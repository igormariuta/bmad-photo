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
 * precedent).
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
    .sort((a, b) => b.count - a.count);
}

function bucketIso(iso: number): string {
  if (iso < 100) return "32–100";
  if (iso < 400) return "100–400";
  if (iso < 1600) return "400–1600";
  return "1600+";
}

// [ASSUMPTION] No mockup covers shutter speed — standard photographic stops
// used as a reasonable default (see Story 2.4 Dev Notes).
const SHUTTER_STOPS: Array<{ maxSeconds: number; label: string }> = [
  { maxSeconds: 1 / 1000, label: "1/1000s or faster" },
  { maxSeconds: 1 / 500, label: "1/500s" },
  { maxSeconds: 1 / 250, label: "1/250s" },
  { maxSeconds: 1 / 125, label: "1/125s" },
  { maxSeconds: 1 / 60, label: "1/60s" },
  { maxSeconds: 1 / 30, label: "1/30s" },
];

function bucketShutter(shutterSpeedSec: number): string {
  for (const stop of SHUTTER_STOPS) {
    if (shutterSpeedSec <= stop.maxSeconds) {
      return stop.label;
    }
  }
  return "1/15s or slower";
}

function bucketHour(capturedAt: string): string | undefined {
  const hour = Number.parseInt(capturedAt.slice(11, 13), 10);
  if (Number.isNaN(hour)) return undefined;
  if (hour < 4) return "00–04";
  if (hour < 8) return "04–08";
  if (hour < 12) return "08–12";
  if (hour < 16) return "12–16";
  if (hour < 20) return "16–20";
  return "20–24";
}

/**
 * The 7 FR-7 dimensions, in the fixed display order from AC #2. Each is
 * always computed over the full readable set (`photos`) — Insights has no
 * filter state to react to.
 */
export function computeInsights(photos: Photo[]): HistogramDimension[] {
  return [
    { key: "lens", caption: "// FOCAL LENGTH", rows: bucketRows(photos, (p) => p.lensLabel) },
    {
      key: "iso",
      caption: "// ISO",
      rows: bucketRows(photos, (p) => (p.iso === undefined ? undefined : bucketIso(p.iso))),
    },
    {
      key: "shutter",
      caption: "// SHUTTER",
      rows: bucketRows(photos, (p) =>
        p.shutterSpeedSec === undefined ? undefined : bucketShutter(p.shutterSpeedSec),
      ),
    },
    {
      key: "aperture",
      caption: "// APERTURE",
      rows: bucketRows(photos, (p) => (p.apertureF === undefined ? undefined : `f/${p.apertureF}`)),
    },
    {
      key: "megapixel",
      caption: "// MEGAPIXEL MIX",
      rows: bucketRows(photos, (p) =>
        p.megapixelMode === undefined ? undefined : `${p.megapixelMode}MP`,
      ),
    },
    {
      key: "camera",
      caption: "// FRONT / REAR",
      rows: bucketRows(photos, (p) =>
        p.camera === undefined ? undefined : p.camera === "front" ? "Front" : "Rear",
      ),
    },
    {
      key: "hour",
      caption: "// HOUR OF DAY",
      rows: bucketRows(photos, (p) =>
        p.capturedAt === undefined ? undefined : bucketHour(p.capturedAt),
      ),
    },
  ];
}
