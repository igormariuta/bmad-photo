import type { Photo } from "../../worker/types";

export interface HistogramRow {
  label: string;
  /** 0-100 share within this dimension's own denominator (AD-4). */
  value: number;
  count: number;
}

export interface HistogramDimension {
  key: string;
  caption: string;
  rows: HistogramRow[];
}

/**
 * Groups `photos` by `bucket(photo)`, skipping photos where it returns
 * `undefined` — the per-field denominator is the count of photos with a
 * defined bucket for *this* dimension only (AD-4), not the full readable
 * set. Rows sort descending by count (PRD UJ-1's "most-used focal length"
 * precedent), ascending by natural value as a tiebreaker (round-12,
 * 2026-07-08, user report — a run of same-count rows previously fell back
 * to Map insertion order, which reads as arbitrary/messy; e.g. ISO or
 * shutter values all tied at "1 photo" now count up in a straight line).
 */
function bucketRows(photos: Photo[], bucket: (photo: Photo) => string | undefined): HistogramRow[] {
  const counts = new Map<string, number>();
  let total = 0;

  for (const photo of photos) {
    const label = bucket(photo);
    if (label === undefined) {
      continue;
    }
    counts.set(label, (counts.get(label) ?? 0) + 1);
    total += 1;
  }

  if (total === 0) {
    return [];
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count, value: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count || naturalValue(a.label) - naturalValue(b.label));
}

/**
 * Exact per-value shutter-speed label — no more binning into standard stops
 * (round-9, 2026-07-08, user request: Insights should show ungrouped exact
 * values for iso/shutter, matching how aperture already works). Mirrors the
 * identical formatting already duplicated in `FacetPanel.tsx` and
 * `PhotoDetailModal.tsx` — not imported from either, since an eslint rule
 * (AD-3) forbids `insights` importing from `browse`, and reaching into
 * `photo-detail` for a one-line formatter would be an odd new coupling.
 */
function formatShutterLabel(shutterSpeedSec: number): string {
  return shutterSpeedSec > 0 && shutterSpeedSec < 1
    ? `1/${Math.round(1 / shutterSpeedSec)}s`
    : `${shutterSpeedSec}s`;
}

/**
 * The 5 dimensions Insights renders. Each is always computed over the full
 * readable set (`photos`) — Insights has no filter state to react to.
 * `iso`/`shutter` show exact per-value labels, not pre-binned ranges/stops
 * (round-9, 2026-07-08 user request) — matches `aperture`'s existing exact-
 * value behavior. `hour` (round-8) and `camera` ("Front/Rear", round-9)
 * were dropped entirely per explicit user request — the user found neither
 * useful in this dashboard; their bucketing functions were removed along
 * with them (no longer meaningful outside their own dimension). Order
 * (round-4 user request, deliberate deviation from Story 2.4 AC #2's
 * original "lens, iso, shutter, aperture, megapixel, camera, hour" —
 * confirmed with the user): lens, aperture, shutter, iso, megapixel — the
 * same relative order (for the dimensions that remain) as `FacetPanel` and
 * the Photo-detail-modal, for cross-page consistency.
 */
export function computeInsights(photos: Photo[]): HistogramDimension[] {
  return [
    { key: "lens", caption: "// FOCAL LENGTH", rows: bucketRows(photos, (p) => p.lensLabel) },
    {
      key: "aperture",
      caption: "// APERTURE",
      // Rounded to 1 decimal (round-11, 2026-07-08, user report) — real phone
      // EXIF apertureF is an imprecise float (e.g. 1.7799999713880652); without
      // rounding, near-identical real f-stops would each get their own
      // spurious bucket instead of grouping together as one f/1.8.
      rows: bucketRows(photos, (p) =>
        p.apertureF === undefined ? undefined : `f/${Math.round(p.apertureF * 10) / 10}`,
      ),
    },
    {
      key: "shutter",
      caption: "// SHUTTER",
      rows: bucketRows(photos, (p) =>
        p.shutterSpeedSec === undefined ? undefined : formatShutterLabel(p.shutterSpeedSec),
      ),
    },
    {
      key: "iso",
      caption: "// ISO",
      rows: bucketRows(photos, (p) => (p.iso === undefined ? undefined : `ISO ${p.iso}`)),
    },
    {
      key: "megapixel",
      caption: "// MEGAPIXEL MIX",
      rows: bucketRows(photos, (p) =>
        p.megapixelMode === undefined ? undefined : `${p.megapixelMode}MP`,
      ),
    },
  ];
}

function parseShutterLabelSeconds(label: string): number {
  const fraction = /^1\/(\d+)s$/.exec(label);
  if (fraction) {
    return 1 / Number(fraction[1]);
  }
  return Number.parseFloat(label.replace("s", ""));
}

/**
 * Parses the exact numeric value out of any of this file's label formats,
 * dispatching on each format's own distinguishing prefix/suffix — used both
 * as `bucketRows`' same-count tiebreaker and by `sortRowsForTrend` (round-12,
 * 2026-07-08, extracted to a shared helper instead of duplicating the same
 * per-format parsing in both places). Labels with no recognized format
 * (`megapixel`'s `"12MP"`/`"48MP"`, `camera`'s `"Front"`/`"Rear"`) fall back
 * to 0, since neither dimension needs a natural order (megapixel is a bar-
 * list-only dimension now; camera doesn't exist anymore, round-9).
 */
function naturalValue(label: string): number {
  if (label.startsWith("ISO ")) {
    return Number.parseInt(label.slice(4), 10);
  }
  if (label.startsWith("f/")) {
    return Number.parseFloat(label.slice(2));
  }
  if (label.endsWith("mm") || label.endsWith("MP")) {
    return Number.parseInt(label, 10);
  }
  if (label.endsWith("s")) {
    return parseShutterLabelSeconds(label);
  }
  return 0;
}

/**
 * Re-sorts a dimension's rows into ascending "natural" value order — the
 * left-to-right shape the small companion `Sparkline` each Insights Panel
 * shows alongside its bar-list should read — as opposed to `bucketRows`'
 * descending-by-count order (unchanged, still what the bar-list rows and
 * Story 2.4's original AC read from). Only `lens`/`aperture`/`shutter`/`iso`
 * get a trend chart at all (round-8, 2026-07-08 user request — megapixel
 * dropped its chart, its branch was removed here as dead code); anything
 * else passes through unchanged.
 */
export function sortRowsForTrend(key: string, rows: HistogramRow[]): HistogramRow[] {
  if (!["lens", "aperture", "shutter", "iso"].includes(key)) {
    return rows;
  }
  return [...rows].sort((a, b) => naturalValue(a.label) - naturalValue(b.label));
}
