import { describe, expect, it } from "vitest";
import {
  deriveCameraFacing,
  deriveMegapixelMode,
  formatLensLabel,
  hasUsableExifData,
  parseCapturedAt,
} from "./normalize";

describe("deriveMegapixelMode", () => {
  it("buckets a >=24MP dimension input to 48", () => {
    // 8000x6000 = 48MP
    expect(deriveMegapixelMode(8000, 6000)).toBe(48);
  });

  it("buckets a <24MP dimension input to 12", () => {
    // 4000x3000 = 12MP
    expect(deriveMegapixelMode(4000, 3000)).toBe(12);
  });

  it("returns undefined when dimension tags are missing", () => {
    expect(deriveMegapixelMode(undefined, 3000)).toBeUndefined();
    expect(deriveMegapixelMode(4000, undefined)).toBeUndefined();
    expect(deriveMegapixelMode(undefined, undefined)).toBeUndefined();
  });
});

describe("deriveCameraFacing", () => {
  it("detects front camera from a LensModel description containing 'front'", () => {
    expect(deriveCameraFacing("iPhone 15 Pro front camera 2.69mm f/1.9")).toBe("front");
  });

  it("is case-insensitive", () => {
    expect(deriveCameraFacing("iPhone 15 Pro FRONT camera 2.69mm f/1.9")).toBe("front");
  });

  it("falls back to rear when 'front' is absent", () => {
    expect(deriveCameraFacing("iPhone 15 Pro back camera 6mm f/1.8")).toBe("rear");
  });

  it("returns undefined when LensModel is missing", () => {
    expect(deriveCameraFacing(undefined)).toBeUndefined();
  });
});

describe("formatLensLabel", () => {
  it("formats focal length to the nearest whole mm", () => {
    expect(formatLensLabel(23.7)).toBe("24mm");
  });

  it("returns undefined when focal length is missing", () => {
    expect(formatLensLabel(undefined)).toBeUndefined();
  });
});

describe("parseCapturedAt", () => {
  it("converts EXIF's colon-delimited datetime to a timezone-naive ISO-8601 string", () => {
    expect(parseCapturedAt("2026:06:14 18:32:05")).toBe("2026-06-14T18:32:05");
  });

  it("returns undefined when the raw value is missing or malformed", () => {
    expect(parseCapturedAt(undefined)).toBeUndefined();
    expect(parseCapturedAt("not-a-date")).toBeUndefined();
  });
});

describe("hasUsableExifData", () => {
  it("is false when every extracted field is undefined", () => {
    expect(hasUsableExifData({})).toBe(false);
  });

  it("is true when at least one field was extracted", () => {
    expect(hasUsableExifData({ iso: 200 })).toBe(true);
  });
});
