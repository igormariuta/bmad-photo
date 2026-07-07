import { beginIngest, commitPhotos } from "../../store/ingestStore";
import type { Photo, WorkerMessage } from "../../worker/types";

export function ingestPhotos(files: File[]): void {
  beginIngest(files.length);

  const worker = new Worker(new URL("../../worker/exif-worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    if (message.type !== "complete") {
      return;
    }

    const photos: Photo[] = message.photos.map(({ blob, ...photo }) => ({
      ...photo,
      thumbnailUrl: URL.createObjectURL(blob),
    }));

    commitPhotos(photos);
    worker.terminate();
  };

  worker.postMessage(files);
}
