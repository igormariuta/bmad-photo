import { create } from "zustand";

interface IngestState {
  rawFiles: File[];
  ingestFiles: (files: File[]) => void;
}

/**
 * First-Ingest-only shape: `ingestFiles` replaces `rawFiles` outright, no
 * append/dedupe (that's Story 2.5). Story 2.2 replaces this whole slot with
 * the real canonical `Photo[]` store plus the
 * useReadablePhotos/useUnreadableCount/useFacetFilters/useFilteredPhotos
 * selectors from AD-3 — don't build those selectors here, there's no `Photo`
 * data yet to select over.
 *
 * Not exported directly (AD-3 convention) — only the selector hooks below
 * reach outside this module.
 */
const useIngestStore = create<IngestState>((set) => ({
  rawFiles: [],
  ingestFiles: (files) => set({ rawFiles: files }),
}));

export function useIngestedFileCount(): number {
  return useIngestStore((state) => state.rawFiles.length);
}

export function useIngestFiles(): (files: File[]) => void {
  return useIngestStore((state) => state.ingestFiles);
}
