import type { WorkerPhoto } from "./types";

const MEGAPIXEL_THRESHOLD = 24;
const CAPTURED_AT_PATTERN = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2})$/;

export interface RawExifFields {
  focalLengthMm?: number;
  lensModelDescription?: string;
  iso?: number;
  apertureF?: number;
  shutterSpeedSec?: number;
  exposureCompEv?: number;
  capturedAtRaw?: string;
  pixelWidth?: number;
  pixelHeight?: number;
}

export function deriveMegapixelMode(
  pixelWidth: number | undefined,
  pixelHeight: number | undefined,
): 12 | 48 | undefined {
  if (pixelWidth === undefined || pixelHeight === undefined) {
    return undefined;
  }
  const megapixels = (pixelWidth * pixelHeight) / 1_000_000;
  return megapixels >= MEGAPIXEL_THRESHOLD ? 48 : 12;
}

export function deriveCameraFacing(
  lensModelDescription: string | undefined,
): "front" | "rear" | undefined {
  if (lensModelDescription === undefined) {
    return undefined;
  }
  return /front/i.test(lensModelDescription) ? "front" : "rear";
}

export function formatLensLabel(focalLengthMm: number | undefined): string | undefined {
  if (focalLengthMm === undefined) {
    return undefined;
  }
  return `${Math.round(focalLengthMm)}mm`;
}

/**
 * EXIF's DateTimeOriginal is "YYYY:MM:DD HH:MM:SS" with no timezone info.
 * Stored as a timezone-naive ISO-8601 string rather than guessing an offset
 * — Story 2.4's hour-of-day bucketing needs local time, and a false UTC
 * offset would be worse than omitting one.
 */
export function parseCapturedAt(raw: string | undefined): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const match = CAPTURED_AT_PATTERN.exec(raw);
  if (!match) {
    return undefined;
  }
  const [, year, month, day, time] = match;
  return `${year}-${month}-${day}T${time}`;
}

export function hasUsableExifData(fields: RawExifFields): boolean {
  return Object.values(fields).some((value) => value !== undefined);
}

export function normalizeExifFields(fields: RawExifFields): Omit<WorkerPhoto, "blob"> {
  return {
    id: crypto.randomUUID(),
    readable: true,
    focalLengthMm: fields.focalLengthMm,
    lensLabel: formatLensLabel(fields.focalLengthMm),
    iso: fields.iso,
    apertureF: fields.apertureF,
    shutterSpeedSec: fields.shutterSpeedSec,
    exposureCompEv: fields.exposureCompEv,
    capturedAt: parseCapturedAt(fields.capturedAtRaw),
    megapixelMode: deriveMegapixelMode(fields.pixelWidth, fields.pixelHeight),
    camera: deriveCameraFacing(fields.lensModelDescription),
  };
}

export function createUnreadablePhoto(): Omit<WorkerPhoto, "blob"> {
  return { id: crypto.randomUUID(), readable: false };
}
