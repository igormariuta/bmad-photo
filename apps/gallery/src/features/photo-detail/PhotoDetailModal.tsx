import { useId } from "react";
import { Modal, ModalHeader } from "@bmad/ui";
import type { Photo } from "../../worker/types";
import { formatExifBadgeSegments, MISSING_FIELD_PLACEHOLDER } from "../browse/PhotoGridCell";
import { Spec } from "./Spec";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** For values `< 1` (the vast majority — phone shutter speeds are almost always
 * sub-second), converts to a fraction as photographers actually read it (e.g.
 * `0.008` → `"1/125s"`). Values `>= 1` (rare long-exposure case) print as plain
 * decimal seconds instead — the fraction formula only makes sense below 1s. */
export function formatShutterSpeed(shutterSpeedSec?: number): string {
  if (shutterSpeedSec === undefined) return MISSING_FIELD_PLACEHOLDER;
  return shutterSpeedSec > 0 && shutterSpeedSec < 1
    ? `1/${Math.round(1 / shutterSpeedSec)}s`
    : `${shutterSpeedSec}s`;
}

/** Signed EV, e.g. `+0.3 EV` / `-1.0 EV` / `0 EV` (zero gets no sign). */
export function formatExposureComp(exposureCompEv?: number): string {
  if (exposureCompEv === undefined) return MISSING_FIELD_PLACEHOLDER;
  if (exposureCompEv === 0) return "0 EV";
  const sign = exposureCompEv > 0 ? "+" : "-";
  return `${sign}${Math.abs(exposureCompEv).toFixed(1)} EV`;
}

/** Reads the timezone-naive ISO-8601 string as-is (Story 2.2's `capturedAt`
 * decision — no timezone conversion, since none is known), so this parses
 * fixed offsets directly instead of going through `Date` — matching
 * aggregations.ts' `bucketHour` slicing convention. */
export function formatCapturedAt(capturedAt?: string): string {
  if (capturedAt === undefined) return MISSING_FIELD_PLACEHOLDER;
  const year = capturedAt.slice(0, 4);
  const month = Number.parseInt(capturedAt.slice(5, 7), 10);
  const day = Number.parseInt(capturedAt.slice(8, 10), 10);
  const time = capturedAt.slice(11, 16);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}, ${time}`;
}

export function formatMegapixelMode(megapixelMode?: 12 | 48): string {
  return megapixelMode === undefined ? MISSING_FIELD_PLACEHOLDER : `${megapixelMode}MP`;
}

export function formatCamera(camera?: "front" | "rear"): string {
  if (camera === "front") return "Front";
  if (camera === "rear") return "Rear";
  return MISSING_FIELD_PLACEHOLDER;
}

/** All 8 Spec rows (AC #2) — the grid badge's three fields (reusing its exact
 * formatting via `formatExifBadgeSegments`) plus the five detail-only fields.
 * Pulled out as a pure function so it's unit-testable without rendering,
 * mirroring `PhotoGridCell`'s `formatExifBadgeSegments` pattern. Order
 * (round-4 user request, 2026-07-08): Captured, Lens, Aperture, Shutter
 * speed, ISO, Exposure comp., Megapixel mode, Camera — the same relative
 * order now used by `FacetPanel` and `Insights`' dimension list, for
 * cross-page consistency. */
export function formatSpecRows(photo: Photo): { label: string; value: string }[] {
  const [lens, aperture, iso] = formatExifBadgeSegments(photo);
  return [
    { label: "Captured", value: formatCapturedAt(photo.capturedAt) },
    { label: "Lens", value: lens },
    { label: "Aperture", value: aperture },
    { label: "Shutter speed", value: formatShutterSpeed(photo.shutterSpeedSec) },
    { label: "ISO", value: iso },
    { label: "Exposure comp.", value: formatExposureComp(photo.exposureCompEv) },
    { label: "Megapixel mode", value: formatMegapixelMode(photo.megapixelMode) },
    { label: "Camera", value: formatCamera(photo.camera) },
  ];
}

export interface PhotoDetailModalProps {
  /** `null` means closed — the Modal unmounts its body, so no stale photo data is read. */
  photo: Photo | null;
  onClose: () => void;
}

/**
 * Populates Story 1.5's Modal/ModalHeader shell with a tapped photo's full
 * Metadata (AC #1, #2). Esc/backdrop/close-control dismissal, the focus trap,
 * and `aria-labelledby` wiring all come from `Modal` itself (AC #3) — nothing
 * new to build there. `variant="wide"` (round-2 redesign, 2026-07-08, user
 * request) puts the photo itself front and center — a 7:3 grid split
 * (`grid-cols-10` + `col-span-7`/`col-span-3`, not an arbitrary `fr` ratio,
 * to stay clear of this repo's `tailwindcss/no-arbitrary-value` lint rule;
 * widened from an initial 3:1 per round-3 user feedback) with the photo on
 * the left and this Spec-row detail panel on the right, collapsing to a
 * single stacked column below `lg`. Neither column forces a height — the
 * row's height (and the detail panel's border/background) follows the
 * photo's natural rendered height, not the viewport. The photo column gets
 * `p-section-rhythm` (round-3) so the photo doesn't sit flush against the
 * dialog's edges, matching the design system's section-level breathing room.
 * The `<img>` itself is capped at `75vh` (round-5 bug fix, 2026-07-08 — a
 * full-resolution portrait photo could render taller than the viewport,
 * with its top clipped off-screen and no visible margin at either edge;
 * inline `style`, not a Tailwind arbitrary-value class, per this repo's
 * `tailwindcss/no-arbitrary-value` lint rule — same escape hatch
 * `HistogramBar.tsx` already uses) — always leaves at least 25vh of visible
 * margin/room for the rest of the dialog, on top of `Modal`'s own outer
 * framing padding.
 */
export function PhotoDetailModal({ photo, onClose }: PhotoDetailModalProps) {
  const titleId = useId();

  return (
    <Modal
      isOpen={photo !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      labelledBy={titleId}
      variant="wide"
    >
      {(close) => {
        if (!photo) return null;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-10">
            <div className="flex items-center justify-center bg-panel p-section-rhythm lg:col-span-7">
              <img
                src={photo.fullUrl}
                alt={photo.fileName}
                className="max-w-full object-contain"
                style={{ maxHeight: "75vh" }}
              />
            </div>
            <div className="flex flex-col gap-6 border-t-2 border-dim p-8 lg:col-span-3 lg:border-t-0 lg:border-l-2">
              <ModalHeader
                eyebrow="// EXIF"
                title={photo.fileName}
                titleId={titleId}
                titleClassName="font-display text-h3 text-fg"
                onClose={close}
              />
              <div>
                {formatSpecRows(photo).map((row) => (
                  <Spec key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          </div>
        );
      }}
    </Modal>
  );
}
