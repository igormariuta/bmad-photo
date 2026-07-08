import ExifReader from "exifreader";
import { createUnreadablePhoto, hasUsableExifData, normalizeExifFields } from "./normalize";
import type { RawExifFields } from "./normalize";
import type { WorkerMessage, WorkerPhoto } from "./types";

// Typed as `Worker` (the main-thread handle interface) rather than
// `DedicatedWorkerGlobalScope` — the app's single tsconfig uses the "DOM"
// lib, and TS doesn't allow mixing "DOM" and "WebWorker" libs in one
// program. `Worker` and the worker-global `self` share the same
// postMessage/onmessage shape, so this cast is safe without a second
// tsconfig just for this file.
const ctx = self as unknown as Worker;

type RationalLikeTag = { computed?: number };
type NumberLikeTag = { value?: number | number[] };
type DescribedTag = { description?: string };

// A malformed EXIF rational (e.g. a zero denominator) computes to NaN/Infinity
// rather than throwing — guard here so garbage never reaches a Photo field.
function finite(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function readRational(tags: ExifReader.Tags, name: keyof ExifReader.Tags): number | undefined {
  return finite((tags[name] as RationalLikeTag | undefined)?.computed);
}

function readNumber(tags: ExifReader.Tags, name: keyof ExifReader.Tags): number | undefined {
  const value = (tags[name] as NumberLikeTag | undefined)?.value;
  return finite(Array.isArray(value) ? value[0] : value);
}

function readDescription(tags: ExifReader.Tags, name: keyof ExifReader.Tags): string | undefined {
  return (tags[name] as DescribedTag | undefined)?.description;
}

function extractRawFields(tags: ExifReader.Tags): RawExifFields {
  return {
    focalLengthMm: readRational(tags, "FocalLength"),
    lensModelDescription: readDescription(tags, "LensModel"),
    iso: readNumber(tags, "ISOSpeedRatings"),
    apertureF: readRational(tags, "FNumber"),
    shutterSpeedSec: readRational(tags, "ExposureTime"),
    exposureCompEv: readRational(tags, "ExposureBiasValue"),
    capturedAtRaw: readDescription(tags, "DateTimeOriginal"),
    pixelWidth: readNumber(tags, "PixelXDimension"),
    pixelHeight: readNumber(tags, "PixelYDimension"),
  };
}

async function parseFile(file: File): Promise<WorkerPhoto> {
  try {
    const tags = await ExifReader.load(file, { computed: true });
    const rawFields = extractRawFields(tags);
    if (!hasUsableExifData(rawFields)) {
      throw new Error("no usable EXIF/metadata block");
    }
    return { ...normalizeExifFields(rawFields), blob: file };
  } catch {
    ctx.postMessage({ type: "error", fileName: file.name } satisfies WorkerMessage);
    return { ...createUnreadablePhoto(), blob: file };
  }
}

async function parseBatch(files: File[]): Promise<void> {
  const total = files.length;
  let done = 0;

  for (const file of files) {
    const photo = await parseFile(file);
    ctx.postMessage({ type: "photo", photo } satisfies WorkerMessage);
    done += 1;
    ctx.postMessage({ type: "progress", done, total } satisfies WorkerMessage);
  }

  ctx.postMessage({ type: "complete" } satisfies WorkerMessage);
}

ctx.onmessage = (event: MessageEvent<File[]>) => {
  void parseBatch(event.data);
};
