import { describe, expect, it } from "vitest";
import { computeInsights } from "./aggregations";
import type { Photo } from "../../worker/types";

let nextId = 0;
function photo(fields: Partial<Photo>): Photo {
  nextId += 1;
  return { id: `p${nextId}`, readable: true, thumbnailUrl: "", ...fields };
}

function dimension(photos: Photo[], key: string) {
  const found = computeInsights(photos).find((d) => d.key === key);
  if (!found) throw new Error(`missing dimension: ${key}`);
  return found;
}

describe("computeInsights", () => {
  it("returns exactly the 7 FR-7 dimensions in AC #2's fixed order", () => {
    const keys = computeInsights([]).map((d) => d.key);
    expect(keys).toEqual(["lens", "iso", "shutter", "aperture", "megapixel", "camera", "hour"]);
  });

  it("groups focal length/lens by the pre-formatted lensLabel and sorts rows descending by count", () => {
    const photos = [
      photo({ lensLabel: "24mm" }),
      photo({ lensLabel: "24mm" }),
      photo({ lensLabel: "24mm" }),
      photo({ lensLabel: "48mm" }),
    ];
    expect(dimension(photos, "lens").rows).toEqual([
      { label: "24mm", count: 3, value: 75 },
      { label: "48mm", count: 1, value: 25 },
    ]);
  });

  it("buckets ISO into the mockup's 4 fixed ranges", () => {
    const photos = [
      photo({ iso: 50 }),
      photo({ iso: 200 }),
      photo({ iso: 800 }),
      photo({ iso: 3200 }),
    ];
    const labels = dimension(photos, "iso").rows.map((r) => r.label).sort();
    expect(labels).toEqual(["100–400", "1600+", "32–100", "400–1600"]);
  });

  it("buckets ISO range boundaries as half-open (lower bound inclusive)", () => {
    const photos = [photo({ iso: 100 }), photo({ iso: 400 }), photo({ iso: 1600 })];
    const byIso = new Map(dimension(photos, "iso").rows.map((r) => [r.label, r.count]));
    expect(byIso.get("100–400")).toBe(1); // iso=100
    expect(byIso.get("400–1600")).toBe(1); // iso=400
    expect(byIso.get("1600+")).toBe(1); // iso=1600
  });

  it("buckets shutter speed by standard photographic stops", () => {
    const photos = [
      photo({ shutterSpeedSec: 1 / 2000 }),
      photo({ shutterSpeedSec: 1 / 500 }),
      photo({ shutterSpeedSec: 1 / 20 }),
    ];
    const labels = new Set(dimension(photos, "shutter").rows.map((r) => r.label));
    expect(labels).toEqual(new Set(["1/1000s or faster", "1/500s", "1/15s or slower"]));
  });

  it("groups aperture by exact apertureF value", () => {
    const photos = [photo({ apertureF: 1.8 }), photo({ apertureF: 1.8 }), photo({ apertureF: 2.8 })];
    expect(dimension(photos, "aperture").rows).toEqual([
      { label: "f/1.8", count: 2, value: 67 },
      { label: "f/2.8", count: 1, value: 33 },
    ]);
  });

  it("buckets megapixel mix into exactly 12MP/48MP", () => {
    const photos = [photo({ megapixelMode: 12 }), photo({ megapixelMode: 48 }), photo({ megapixelMode: 12 })];
    expect(dimension(photos, "megapixel").rows).toEqual([
      { label: "12MP", count: 2, value: 67 },
      { label: "48MP", count: 1, value: 33 },
    ]);
  });

  it("buckets camera facing into exactly Front/Rear", () => {
    const photos = [photo({ camera: "rear" }), photo({ camera: "front" }), photo({ camera: "rear" })];
    expect(dimension(photos, "camera").rows).toEqual([
      { label: "Rear", count: 2, value: 67 },
      { label: "Front", count: 1, value: 33 },
    ]);
  });

  it("buckets hour-of-day into 6 four-hour ranges, parsed from the local capturedAt string", () => {
    const photos = [
      photo({ capturedAt: "2026-06-14T18:32:05" }),
      photo({ capturedAt: "2026-06-14T02:10:00" }),
      photo({ capturedAt: "2026-06-14T19:00:00" }),
    ];
    const byHour = new Map(dimension(photos, "hour").rows.map((r) => [r.label, r.count]));
    expect(byHour.get("16–20")).toBe(2);
    expect(byHour.get("00–04")).toBe(1);
  });

  it("computes each dimension's percentage over only photos with that field defined, not the full readable set", () => {
    const photos = [
      photo({ lensLabel: "24mm", iso: 100 }),
      photo({ lensLabel: "24mm" }), // no iso — excluded from ISO's denominator only
    ];
    expect(dimension(photos, "lens").rows).toEqual([{ label: "24mm", count: 2, value: 100 }]);
    expect(dimension(photos, "iso").rows).toEqual([{ label: "100–400", count: 1, value: 100 }]);
  });

  it("returns an empty rows array for a dimension when no readable photo has that field", () => {
    const photos = [photo({ lensLabel: "24mm" })];
    expect(dimension(photos, "iso").rows).toEqual([]);
  });

  it("returns empty rows for every dimension given an empty photo set", () => {
    for (const d of computeInsights([])) {
      expect(d.rows).toEqual([]);
    }
  });
});
