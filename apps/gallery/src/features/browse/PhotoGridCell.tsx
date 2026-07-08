import { Dot } from "@bmad/ui";
import type { Photo } from "../../worker/types";

export interface PhotoGridCellProps {
  photo: Photo;
  /** Unused/no-op for this story — Story 3.5 passes a real handler that
   * opens Photo-detail-modal. */
  onOpen?: () => void;
}

const MISSING_FIELD_PLACEHOLDER = "—";

/** AD-4's exact three badge fields, in AD-4's order — pulled out as a pure
 * function so the exact-format requirement (AC #2) is unit-testable without
 * rendering. `[ASSUMPTION]` (Dev Notes): a missing field renders as
 * MISSING_FIELD_PLACEHOLDER, not the literal string "undefined". */
export function formatExifBadgeSegments(photo: Photo): [string, string, string] {
  return [
    photo.lensLabel ?? MISSING_FIELD_PLACEHOLDER,
    photo.apertureF === undefined ? MISSING_FIELD_PLACEHOLDER : `f/${photo.apertureF}`,
    photo.iso === undefined ? MISSING_FIELD_PLACEHOLDER : `ISO ${photo.iso}`,
  ];
}

/** UX-DR15's aria-label, naming at least the capture date. `[ASSUMPTION]`
 * (Dev Notes, confirmed by user review): reuses the same MISSING_FIELD_PLACEHOLDER
 * "—" convention as the badge fields, rather than a longer prose fallback.
 * Slices the raw `YYYY-MM-DD...` prefix directly (matching aggregations.ts'
 * bucketHour convention) instead of parsing through `Date`, since capturedAt
 * carries no timezone info. */
export function formatCellAriaLabel(photo: Photo): string {
  const date =
    photo.capturedAt === undefined ? MISSING_FIELD_PLACEHOLDER : photo.capturedAt.slice(0, 10);
  return `Photo, captured ${date}`;
}

/**
 * Gallery-local (FR-2 single-consumer rule) — Browse's grid tile. Renders as
 * a real <button> (UX-DR15) so it's keyboard/screen-reader operable ahead of
 * Story 3.5 wiring `onOpen` to open Photo-detail-modal. An empty
 * `thumbnailUrl` (round-17, 2026-07-08 — photos now commit before their
 * thumbnail is ready, so cells fill in progressively) renders a pulsing
 * placeholder in the same aspect-square box instead of an `<img>` with no
 * `src`, which would show the browser's broken-image icon.
 */
export function PhotoGridCell({ photo, onOpen }: PhotoGridCellProps) {
  const [lens, aperture, iso] = formatExifBadgeSegments(photo);

  return (
    <button
      type="button"
      aria-label={formatCellAriaLabel(photo)}
      onClick={onOpen}
      className="flex flex-col gap-2 text-left"
    >
      {photo.thumbnailUrl ? (
        <img
          src={photo.thumbnailUrl}
          alt=""
          className="aspect-square w-full border-2 border-dim object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-square w-full animate-pulse border-2 border-dim bg-panel"
        />
      )}
      <span className="flex items-center gap-1 text-caption text-muted">
        <span>{lens}</span>
        <Dot />
        <span>{aperture}</span>
        <Dot />
        <span>{iso}</span>
      </span>
    </button>
  );
}
