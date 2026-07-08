import { describe, expect, it } from "vitest";
import {
  formatCamera,
  formatCapturedAt,
  formatExposureComp,
  formatMegapixelMode,
  formatShutterSpeed,
  formatSpecRows,
} from "./PhotoDetailModal";
import type { Photo } from "../../worker/types";

function photo(fields: Partial<Photo>): Photo {
  return { id: "p1", readable: true, fileName: "photo.jpg", thumbnailUrl: "", fullUrl: "", ...fields };
}

describe("formatShutterSpeed", () => {
  it("converts sub-second values to a fraction, matching how photographers read it", () => {
    expect(formatShutterSpeed(0.008)).toBe("1/125s");
  });

  it("shows a plain decimal-seconds string for long exposures", () => {
    expect(formatShutterSpeed(2)).toBe("2s");
  });

  it("falls back to the placeholder when missing", () => {
    expect(formatShutterSpeed(undefined)).toBe("—");
  });
});

describe("formatExposureComp", () => {
  it("signs a positive value", () => {
    expect(formatExposureComp(0.3)).toBe("+0.3 EV");
  });

  it("signs a negative value", () => {
    expect(formatExposureComp(-1)).toBe("-1.0 EV");
  });

  it("shows zero unsigned", () => {
    expect(formatExposureComp(0)).toBe("0 EV");
  });

  it("falls back to the placeholder when missing", () => {
    expect(formatExposureComp(undefined)).toBe("—");
  });
});

describe("formatCapturedAt", () => {
  it("formats the timezone-naive ISO string as a human-readable date/time", () => {
    expect(formatCapturedAt("2026-06-14T18:32:00")).toBe("14 Jun 2026, 18:32");
  });

  it("falls back to the placeholder when missing", () => {
    expect(formatCapturedAt(undefined)).toBe("—");
  });
});

describe("formatMegapixelMode", () => {
  it("formats 12MP", () => {
    expect(formatMegapixelMode(12)).toBe("12MP");
  });

  it("formats 48MP", () => {
    expect(formatMegapixelMode(48)).toBe("48MP");
  });

  it("falls back to the placeholder when missing", () => {
    expect(formatMegapixelMode(undefined)).toBe("—");
  });
});

describe("formatCamera", () => {
  it("formats front", () => {
    expect(formatCamera("front")).toBe("Front");
  });

  it("formats rear", () => {
    expect(formatCamera("rear")).toBe("Rear");
  });

  it("falls back to the placeholder when missing", () => {
    expect(formatCamera(undefined)).toBe("—");
  });
});

describe("formatSpecRows", () => {
  it("returns all 8 rows in order, correctly formatted", () => {
    expect(
      formatSpecRows(
        photo({
          lensLabel: "24mm",
          apertureF: 1.8,
          iso: 200,
          shutterSpeedSec: 0.008,
          exposureCompEv: 0.3,
          capturedAt: "2026-06-14T18:32:00",
          megapixelMode: 12,
          camera: "rear",
        }),
      ),
    ).toEqual([
      { label: "Captured", value: "14 Jun 2026, 18:32" },
      { label: "Lens", value: "24mm" },
      { label: "Aperture", value: "f/1.8" },
      { label: "Shutter speed", value: "1/125s" },
      { label: "ISO", value: "ISO 200" },
      { label: "Exposure comp.", value: "+0.3 EV" },
      { label: "Megapixel mode", value: "12MP" },
      { label: "Camera", value: "Rear" },
    ]);
  });

  it("falls back to the placeholder independently per missing field", () => {
    const rows = formatSpecRows(photo({}));
    expect(rows.every((row) => row.value === "—")).toBe(true);
  });
});
