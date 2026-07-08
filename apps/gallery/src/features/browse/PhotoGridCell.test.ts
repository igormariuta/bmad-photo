import { describe, expect, it } from "vitest";
import { formatCellAriaLabel, formatExifBadgeSegments } from "./PhotoGridCell";
import type { Photo } from "../../worker/types";

function photo(fields: Partial<Photo>): Photo {
  return { id: "p1", readable: true, fileName: "photo.jpg", thumbnailUrl: "", fullUrl: "", ...fields };
}

describe("formatExifBadgeSegments", () => {
  it("returns AD-4's exact three fields in order, matching the architecture's own example", () => {
    expect(formatExifBadgeSegments(photo({ lensLabel: "24mm", apertureF: 1.8, iso: 200 }))).toEqual([
      "24mm",
      "f/1.8",
      "ISO 200",
    ]);
  });

  it("falls back to a placeholder per missing segment instead of the literal string undefined", () => {
    expect(formatExifBadgeSegments(photo({}))).toEqual(["—", "—", "—"]);
  });

  it("falls back independently per field when only some are missing", () => {
    expect(formatExifBadgeSegments(photo({ lensLabel: "48mm", iso: 400 }))).toEqual([
      "48mm",
      "—",
      "ISO 400",
    ]);
  });

  it("rounds an imprecise real-phone EXIF aperture float to 1 decimal", () => {
    expect(formatExifBadgeSegments(photo({ apertureF: 1.7799999713880652 }))[1]).toBe("f/1.8");
  });
});

describe("formatCellAriaLabel", () => {
  it("names the capture date when present", () => {
    expect(formatCellAriaLabel(photo({ capturedAt: "2026-06-14T10:30:00" }))).toBe(
      "Photo, captured 2026-06-14",
    );
  });

  it("falls back to the placeholder dash when capturedAt is missing", () => {
    expect(formatCellAriaLabel(photo({}))).toBe("Photo, captured —");
  });
});
