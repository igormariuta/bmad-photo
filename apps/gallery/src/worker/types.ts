export interface Photo {
  id: string;
  readable: boolean;
  /** The original `File.name` — always present (every `File` object has one), unlike the
   * EXIF-derived fields below which may genuinely be missing. */
  fileName: string;
  focalLengthMm?: number;
  lensLabel?: string;
  iso?: number;
  apertureF?: number;
  shutterSpeedSec?: number;
  exposureCompEv?: number;
  capturedAt?: string;
  megapixelMode?: 12 | 48;
  camera?: "front" | "rear";
  /** A small, downscaled JPEG for the Browse grid (round-16, 2026-07-08, user report — Browse
   * was noticeably laggy with real phone photos, since every grid cell was decoding/rendering
   * the *original* full-resolution image, only visually shrunk via CSS). */
  thumbnailUrl: string;
  /** The full-resolution displayable image (HEIC-converted if needed, otherwise the original),
   * for the one photo shown at a time in the Photo-detail-modal. */
  fullUrl: string;
}

/**
 * The worker hands back the underlying Blob instead of thumbnailUrl/fullUrl —
 * object URLs aren't portable across execution contexts (AD-4), so the main
 * thread creates them via URL.createObjectURL after receiving this shape.
 * This deliberately diverges from AD-2's own `complete` message snippet
 * (which types `photos` as `Photo[]`) per the correction AD-4's prose makes.
 */
export type WorkerPhoto = Omit<Photo, "thumbnailUrl" | "fullUrl"> & { blob: Blob };

export type WorkerMessage =
  | { type: "progress"; done: number; total: number }
  | { type: "error"; fileName: string }
  /** Sent once per file, in input order, as soon as *that file's* EXIF parsing finishes —
   * not batched into one final array (round-18, 2026-07-08, user report: Browse waited for
   * the entire batch to parse before showing anything, "надо ждать очень долго"). Lets the
   * main thread commit each photo to the store the moment it's ready, so Browse's grid fills
   * in one cell at a time instead of appearing all at once after the slowest file. */
  | { type: "photo"; photo: WorkerPhoto }
  | { type: "complete" };
