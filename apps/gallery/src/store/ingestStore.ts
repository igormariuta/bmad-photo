import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Photo } from "../worker/types";

interface IngestProgress {
  done: number;
  total: number;
}

interface IngestState {
  photos: Photo[];
  fileCount: number;
  progress: IngestProgress;
  complete: boolean;
}

/**
 * Not exported directly (AD-3 convention) — only the selector hooks and
 * plain mutator functions below reach outside this module. The mutators are
 * plain functions (not hooks) so non-component orchestration code (the
 * worker message handler in features/ingest) can call them directly.
 */
const useIngestStore = create<IngestState>(() => ({
  photos: [],
  fileCount: 0,
  progress: { done: 0, total: 0 },
  complete: false,
}));

export function beginIngest(fileCount: number): void {
  useIngestStore.setState({ fileCount, progress: { done: 0, total: fileCount }, complete: false });
}

export function updateProgress(done: number, total: number): void {
  useIngestStore.setState({ progress: { done, total } });
}

export function commitPhotos(photos: Photo[]): void {
  useIngestStore.setState({ photos, fileCount: photos.length, complete: true });
}

export function useIngestedFileCount(): number {
  return useIngestStore((state) => state.fileCount);
}

export function useIngestProgress(): IngestProgress {
  return useIngestStore(useShallow((state) => state.progress));
}

/** Distinguishes "parsing in progress" from "parsing complete" for
 * app-shell's 3-way gate — `fileCount` alone is set at the start of Ingest
 * and can't tell the two states apart. */
export function useIsIngestComplete(): boolean {
  return useIngestStore((state) => state.complete);
}

export function useReadablePhotos(): Photo[] {
  return useIngestStore(useShallow((state) => state.photos.filter((photo) => photo.readable)));
}

export function useUnreadableCount(): number {
  return useIngestStore((state) => state.photos.filter((photo) => !photo.readable).length);
}
