export interface Photo {
  id: string;
  readable: boolean;
  focalLengthMm?: number;
  lensLabel?: string;
  iso?: number;
  apertureF?: number;
  shutterSpeedSec?: number;
  exposureCompEv?: number;
  capturedAt?: string;
  megapixelMode?: 12 | 48;
  camera?: "front" | "rear";
  thumbnailUrl: string;
}

/**
 * The worker hands back the underlying Blob instead of a thumbnailUrl —
 * object URLs aren't portable across execution contexts (AD-4), so the main
 * thread creates them via URL.createObjectURL after receiving this shape.
 * This deliberately diverges from AD-2's own `complete` message snippet
 * (which types `photos` as `Photo[]`) per the correction AD-4's prose makes.
 */
export type WorkerPhoto = Omit<Photo, "thumbnailUrl"> & { blob: Blob };

export type WorkerMessage =
  | { type: "progress"; done: number; total: number }
  | { type: "error"; fileName: string }
  | { type: "complete"; photos: WorkerPhoto[] };
