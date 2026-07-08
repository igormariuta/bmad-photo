import { useState } from "react";
import { Button } from "@bmad/ui";
import {
  clearAllFacetFilters,
  useFilteredPhotos,
  useHasActiveFacetFilters,
  useReadablePhotos,
  useUnreadableCount,
} from "../../store/ingestStore";
import { PhotoDetailModal } from "../photo-detail/PhotoDetailModal";
import { PhotoGridCell } from "./PhotoGridCell";

/**
 * Browse tab: the Facet-filtered photo grid. The Facet-panel itself is a
 * persistent global sidebar rendered once in App.tsx (shared with Insights,
 * dev-story fix-up 2026-07-08) rather than owned by this component — the
 * page-level width/padding it used to apply also moved up to App.tsx so
 * Browse and Insights share identical page width. Reads only through
 * useFilteredPhotos() (AD-3's import-boundary contract).
 *
 * Two distinct "nothing to show" messages replace the grid (Story 3.4,
 * round 2 — code-review follow-up): every ingested photo is unreadable (no
 * Clear-filters action, since there's no filter to clear) versus the active
 * Facet filters matching zero of the readable photos (narrower copy, with
 * the Clear-filters entry point into Story 3.3's clearAllFacetFilters).
 * Both are `aria-live="polite"`, matching this app's existing dynamic-status
 * convention (IngestProgress).
 */
export function Browse() {
  const photos = useFilteredPhotos();
  const readablePhotos = useReadablePhotos();
  const unreadableCount = useUnreadableCount();
  const hasActiveFilters = useHasActiveFacetFilters();

  const isFilteredEmpty = photos.length === 0 && readablePhotos.length > 0 && hasActiveFilters;
  const isAllUnreadable = readablePhotos.length === 0;

  // Tracked by id, not the `Photo` object itself — `readablePhotos` is a live store
  // subscription, so this always resolves to the up-to-date photo (e.g. once its
  // thumbnailUrl/fullUrl arrive after progressive media loading) instead of a stale
  // snapshot captured at click time.
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const selectedPhoto =
    selectedPhotoId === null ? null : (readablePhotos.find((photo) => photo.id === selectedPhotoId) ?? null);

  return (
    <div>
      <p className="text-eyebrow text-accent uppercase">// BROWSE</p>
      {isFilteredEmpty ? (
        <div
          aria-live="polite"
          className="mt-7 flex flex-col items-center gap-4 border-2 border-dim px-8 py-16 text-center"
        >
          <p className="text-body text-fg">No photos match these filters.</p>
          <Button type="button" variant="outline" onClick={clearAllFacetFilters}>
            Clear filters
          </Button>
        </div>
      ) : isAllUnreadable ? (
        <div
          aria-live="polite"
          className="mt-7 flex flex-col items-center gap-2 border-2 border-dim px-8 py-16 text-center"
        >
          <p className="text-body text-fg">No readable photos.</p>
          <p className="text-caption text-muted">{unreadableCount} unreadable — always excluded.</p>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-item-gap lg:grid-cols-4">
          {photos.map((photo) => (
            <PhotoGridCell key={photo.id} photo={photo} onOpen={() => setSelectedPhotoId(photo.id)} />
          ))}
        </div>
      )}
      <PhotoDetailModal photo={selectedPhoto} onClose={() => setSelectedPhotoId(null)} />
    </div>
  );
}
