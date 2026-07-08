import { useFilteredPhotos } from "../../store/ingestStore";
import { PhotoGridCell } from "./PhotoGridCell";

/**
 * Browse tab: the Facet-filtered photo grid. The Facet-panel itself is a
 * persistent global sidebar rendered once in App.tsx (shared with Insights,
 * dev-story fix-up 2026-07-08) rather than owned by this component — the
 * page-level width/padding it used to apply also moved up to App.tsx so
 * Browse and Insights share identical page width. Reads only through
 * useFilteredPhotos() (AD-3's import-boundary contract).
 */
export function Browse() {
  const photos = useFilteredPhotos();

  return (
    <div>
      <p className="text-eyebrow text-accent uppercase">// BROWSE</p>
      <div className="mt-7 grid grid-cols-2 gap-item-gap lg:grid-cols-4">
        {photos.map((photo) => (
          <PhotoGridCell key={photo.id} photo={photo} />
        ))}
      </div>
    </div>
  );
}
