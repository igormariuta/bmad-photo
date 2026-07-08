import { useFilteredPhotos } from "../../store/ingestStore";
import { PhotoGridCell } from "./PhotoGridCell";

/**
 * Browse tab (Story 3.2): unfiltered photo grid plus a Facet-panel sidebar
 * region reserved now so Story 3.3 only has to fill its content, not
 * restructure the container a second time. Reads only through
 * useFilteredPhotos() (AD-3's import-boundary contract) — a trivial alias
 * today, real filtering from Story 3.3 onward.
 */
export function Browse() {
  const photos = useFilteredPhotos();

  return (
    <div className="mx-auto flex max-w-container-max flex-col gap-10 px-gutter py-8 lg:flex-row lg:items-start">
      <aside
        aria-label="Facets"
        className="w-full flex-none border-2 border-dim bg-panel p-card-padding lg:w-sidebar-width"
      >
        {/* Facet-panel content is Story 3.3's job — this story only reserves the layout space. */}
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
