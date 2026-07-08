import { useFilteredPhotos } from "../../store/ingestStore";
import { FacetPanel } from "./FacetPanel";
import { PhotoGridCell } from "./PhotoGridCell";

/**
 * Browse tab: unfiltered/filtered photo grid plus the Facet-panel sidebar.
 * Desktop only for now — the mobile slide-up-sheet requirement (AC #1/#4)
 * is deferred (see deferred-work.md), so the sidebar is hidden below `lg`
 * rather than stacking a full interactive Facet-panel above the grid.
 * Reads only through useFilteredPhotos() (AD-3's import-boundary contract).
 */
export function Browse() {
  const photos = useFilteredPhotos();

  return (
    <div className="mx-auto flex max-w-container-max flex-col gap-10 px-gutter py-8 lg:flex-row lg:items-start">
      <aside
        aria-label="Facets"
        className="hidden flex-none border-2 border-dim bg-panel p-card-padding lg:block lg:w-sidebar-width"
      >
        <FacetPanel />
      </aside>
      <div className="min-w-0 flex-1">
        <p className="text-eyebrow text-accent uppercase">// BROWSE</p>
        <div className="mt-7 grid grid-cols-2 gap-item-gap lg:grid-cols-4">
          {photos.map((photo) => (
            <PhotoGridCell key={photo.id} photo={photo} />
          ))}
        </div>
      </div>
    </div>
  );
}
