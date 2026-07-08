import { describe, expect, it } from "vitest";
import { computeInsights, sortRowsForTrend } from "./aggregations";
import type { Photo } from "../../worker/types";

let nextId = 0;
function photo(fields: Partial<Photo>): Photo {
  nextId += 1;
  return { id: `p${nextId}`, readable: true, fileName: "photo.jpg", thumbnailUrl: "", fullUrl: "", ...fields };
}

function dimension(photos: Photo[], key: string) {
  const found = computeInsights(photos).find((d) => d.key === key);
  if (!found) throw new Error(`missing dimension: ${key}`);
  return found;
}

describe("computeInsights", () => {
  it("returns exactly 5 dimensions (hour dropped round-8, camera dropped round-9), in the cross-page-consistent order (round-4 user request, deviating from Story 2.4 AC #2's original order)", () => {
    const keys = computeInsights([]).map((d) => d.key);
    expect(keys).toEqual(["lens", "aperture", "shutter", "iso", "megapixel"]);
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

  it("groups ISO by exact value, not a pre-binned range (round-9)", () => {
    const photos = [photo({ iso: 200 }), photo({ iso: 200 }), photo({ iso: 800 })];
    expect(dimension(photos, "iso").rows).toEqual([
      { label: "ISO 200", count: 2, value: 67 },
      { label: "ISO 800", count: 1, value: 33 },
    ]);
  });

  it("breaks same-count ties by ascending natural value, not arbitrary insertion order (round-12)", () => {
    const photos = [640, 20, 40, 64, 32, 16, 1000, 400].map((iso) => photo({ iso }));
    expect(dimension(photos, "iso").rows.map((r) => r.label)).toEqual([
      "ISO 16",
      "ISO 20",
      "ISO 32",
      "ISO 40",
      "ISO 64",
      "ISO 400",
      "ISO 640",
      "ISO 1000",
    ]);
  });

  it("groups shutter speed by exact value, not a standard-stop bucket (round-9)", () => {
    const photos = [
      photo({ shutterSpeedSec: 1 / 500 }),
      photo({ shutterSpeedSec: 1 / 500 }),
      photo({ shutterSpeedSec: 2 }),
    ];
    expect(dimension(photos, "shutter").rows).toEqual([
      { label: "1/500s", count: 2, value: 67 },
      { label: "2s", count: 1, value: 33 },
    ]);
  });

  it("groups aperture by exact apertureF value", () => {
    const photos = [photo({ apertureF: 1.8 }), photo({ apertureF: 1.8 }), photo({ apertureF: 2.8 })];
    expect(dimension(photos, "aperture").rows).toEqual([
      { label: "f/1.8", count: 2, value: 67 },
      { label: "f/2.8", count: 1, value: 33 },
    ]);
  });

  it("rounds imprecise real-phone EXIF aperture floats to 1 decimal, grouping near-identical f-stops together", () => {
    const photos = [
      photo({ apertureF: 1.7799999713880652 }),
      photo({ apertureF: 1.7800000286119348 }),
      photo({ apertureF: 2.798828125 }),
    ];
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

  it("computes each dimension's percentage over only photos with that field defined, not the full readable set", () => {
    const photos = [
      photo({ lensLabel: "24mm", iso: 100 }),
      photo({ lensLabel: "24mm" }), // no iso — excluded from ISO's denominator only
    ];
    expect(dimension(photos, "lens").rows).toEqual([{ label: "24mm", count: 2, value: 100 }]);
    expect(dimension(photos, "iso").rows).toEqual([{ label: "ISO 100", count: 1, value: 100 }]);
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

describe("sortRowsForTrend", () => {
  function row(label: string, count = 1): { label: string; count: number; value: number } {
    return { label, count, value: 0 };
  }

  it("sorts lens rows ascending by focal length, regardless of input order", () => {
    const rows = [row("48mm"), row("24mm"), row("100mm")];
    expect(sortRowsForTrend("lens", rows).map((r) => r.label)).toEqual(["24mm", "48mm", "100mm"]);
  });

  it("sorts aperture rows ascending by f-number", () => {
    const rows = [row("f/2.8"), row("f/1.4"), row("f/1.8")];
    expect(sortRowsForTrend("aperture", rows).map((r) => r.label)).toEqual(["f/1.4", "f/1.8", "f/2.8"]);
  });

  it("sorts shutter rows fastest-to-slowest by parsing the exact value out of the label (round-9)", () => {
    const rows = [row("1/60s"), row("1/1000s"), row("2s"), row("1/250s")];
    expect(sortRowsForTrend("shutter", rows).map((r) => r.label)).toEqual([
      "1/1000s",
      "1/250s",
      "1/60s",
      "2s",
    ]);
  });

  it("sorts iso rows ascending by the exact numeric value parsed out of the label (round-9)", () => {
    const rows = [row("ISO 3200"), row("ISO 100"), row("ISO 800"), row("ISO 400")];
    expect(sortRowsForTrend("iso", rows).map((r) => r.label)).toEqual([
      "ISO 100",
      "ISO 400",
      "ISO 800",
      "ISO 3200",
    ]);
  });

  it("passes through rows unchanged for a dimension with no trend chart (e.g. megapixel)", () => {
    const rows = [row("48MP"), row("12MP")];
    expect(sortRowsForTrend("megapixel", rows)).toEqual(rows);
  });
});
