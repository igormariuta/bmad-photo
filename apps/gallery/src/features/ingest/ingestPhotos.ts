import {
  beginIngest,
  commitPhotos,
  updatePhotoMedia,
  updateProgress,
} from "../../store/ingestStore";
import type { Photo, WorkerMessage, WorkerPhoto } from "../../worker/types";

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_EXTENSION = /\.hei[cf]$/i;
const IMAGE_EXTENSION = /\.(jpe?g|png|heic|heif|webp|gif|bmp|tiff?)$/i;

/** Folder selection (`webkitdirectory`) hands back every file in the directory tree, including
 * non-image junk (`.DS_Store`, `Thumbs.db`, sidecar files) — browsers ignore the input's own
 * `accept` attribute for directory picks. Filtering here, before any cap-check/dedup/worker
 * dispatch, keeps a folder of otherwise-all-photos from being wrongly counted against the
 * 100-photo cap by a few incidental non-image files. Falls back to the filename extension since
 * some OSes don't reliably set `File.type` for less common formats (the same gap `isHeic` above
 * already works around). */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXTENSION.test(file.name);
}

/** iOS/Android phones commonly shoot HEIC — the file's own MIME `type` is unreliable across
 * browsers/OSes (often empty), so the filename extension is checked too. Neither Chrome nor
 * Firefox can render HEIC via `<img>` at all (round-15, 2026-07-08, user report — thumbnails
 * silently showed the browser's broken-image icon); Safari can, inconsistently, but converting
 * unconditionally keeps behavior identical everywhere. */
function isHeic(blob: Blob, fileName: string): boolean {
  return HEIC_TYPES.has(blob.type.toLowerCase()) || HEIC_EXTENSION.test(fileName);
}

/** Runs `task`s one at a time, in call order, regardless of how many are queued concurrently
 * — `heic2any`'s bundled libheif decoder is a single shared WASM instance, not proven safe for
 * truly concurrent decode calls from the same JS realm (round-20, 2026-07-08, user report: with
 * several real HEIC photos ingested together, only one ever finished — every other stayed
 * a placeholder indefinitely, matching a classic non-reentrant-WASM symptom that a handful of
 * small synthetic test HEIC files, converted one/two at a time in earlier rounds' verification,
 * never happened to trigger). */
function createSerialQueue(): <T>(task: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();
  return function runSerialized<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}

const runHeicConversionSerialized = createSerialQueue();

/** Converts a HEIC/HEIF blob to a browser-displayable JPEG via `heic2any` (a client-side,
 * WASM-backed decoder — no network round-trip). `heic2any`'s bundled libheif decoder is large
 * (~1.3MB), so it's dynamically imported here rather than at module top-level — a batch with no
 * HEIC files never pays for it. The dynamic `import()` and the conversion call are both inside
 * the serialized queue (see `runHeicConversionSerialized` above) — every step that touches the
 * shared decoder runs strictly one photo at a time. Falls back to the original blob on
 * conversion failure (e.g. a corrupt file) rather than throwing — the thumbnail may still not
 * render, but ingest itself must not fail because of it. */
async function toDisplayableBlob(blob: Blob, fileName: string): Promise<Blob> {
  if (!isHeic(blob, fileName)) {
    return blob;
  }
  try {
    return await runHeicConversionSerialized(async () => {
      const { default: heic2any } = await import("heic2any");
      const converted = await heic2any({ blob, toType: "image/jpeg", quality: 0.8 });
      return Array.isArray(converted) ? converted[0]! : converted;
    });
  } catch {
    return blob;
  }
}

const THUMBNAIL_MAX_DIMENSION = 480;

/** Downscales to at most `maxDimension` on the long edge, via `createImageBitmap` +
 * `OffscreenCanvas` (round-16, 2026-07-08, user report — Browse was noticeably laggy with real
 * phone photos: every grid cell was decoding/painting the *original* multi-megapixel image,
 * only ever shrunk visually via CSS, never actually downscaled). Falls back to the input blob
 * unresized if bitmap/canvas decoding fails for any reason — a slow thumbnail beats a broken
 * ingest. */
async function createThumbnailBlob(blob: Blob, maxDimension = THUMBNAIL_MAX_DIMENSION): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return blob;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.7 });
  } catch {
    return blob;
  }
}

/** Placeholder media for the initial commit — `PhotoGridCell` renders a
 * pulsing placeholder box in place of `<img>` while these are empty (round-
 * 17). Unreadable photos never get real media at all: they're excluded from
 * every readable-only view (Browse, the modal), so generating a HEIC-
 * conversion/thumbnail for one would be pure wasted work — directly
 * contributing to the very "thumbnail saving takes forever" the user
 * reported, since it ran for every ingested file regardless of whether it
 * would ever be displayed. */
const EMPTY_MEDIA = { thumbnailUrl: "", fullUrl: "" };

function toPlaceholderPhoto(workerPhoto: WorkerPhoto): Photo {
  return { ...workerPhoto, ...EMPTY_MEDIA };
}

async function toPhotoMedia(workerPhoto: WorkerPhoto): Promise<Pick<Photo, "thumbnailUrl" | "fullUrl">> {
  if (!workerPhoto.readable) {
    return EMPTY_MEDIA;
  }
  const displayable = await toDisplayableBlob(workerPhoto.blob, workerPhoto.fileName);
  const thumbnail = await createThumbnailBlob(displayable);
  return {
    fullUrl: URL.createObjectURL(displayable),
    thumbnailUrl: URL.createObjectURL(thumbnail),
  };
}

export function ingestPhotos(files: File[]): void {
  beginIngest(files.length);

  const worker = new Worker(new URL("../../worker/exif-worker.ts", import.meta.url), {
    type: "module",
  });

  // The worker parses `files` strictly in input order, one at a time (see exif-worker.ts's
  // parseBatch), so this index always lines up with the file a given "photo" message came from
  // — needed to record that file's dedup signature via commitPhotos (round-18, 2026-07-08).
  let nextFileIndex = 0;

  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    if (message.type === "progress") {
      updateProgress(message.done, message.total);
      return;
    }

    if (message.type === "complete") {
      worker.terminate();
      return;
    }

    if (message.type !== "photo") {
      return;
    }

    // Commit each photo the moment *its own* EXIF parsing finishes — not
    // batched behind the whole selection (round-18, 2026-07-08, user report:
    // Browse waited for the entire batch to parse before showing anything,
    // "надо ждать очень долго"). Placeholder media, same as round-17 — the
    // real thumbnail/full-res conversion runs independently afterward and
    // updates this one photo's entry once it's ready.
    const file = files[nextFileIndex]!;
    nextFileIndex += 1;
    commitPhotos([toPlaceholderPhoto(message.photo)], [file]);
    void toPhotoMedia(message.photo).then((media) => updatePhotoMedia(message.photo.id, media));
  };

  worker.postMessage(files);
}
