import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Photo } from "../worker/types";

interface IngestState {
  photos: Photo[];
  fileCount: number;
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
}));

export function beginIngest(fileCount: number): void {
  useIngestStore.setState({ fileCount });
}

export function commitPhotos(photos: Photo[]): void {
  useIngestStore.setState({ photos, fileCount: photos.length });
}

export function useIngestedFileCount(): number {
  return useIngestStore((state) => state.fileCount);
}

export function useReadablePhotos(): Photo[] {
  return useIngestStore(useShallow((state) => state.photos.filter((photo) => photo.readable)));
}

export function useUnreadableCount(): number {
  return useIngestStore((state) => state.photos.filter((photo) => !photo.readable).length);
}
