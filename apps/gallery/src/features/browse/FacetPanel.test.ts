import { describe, expect, it } from "vitest";
import { formatAperture, formatExposureComp, formatShutterSpeed } from "./FacetPanel";

describe("formatShutterSpeed", () => {
  it("formats sub-1s values as a fraction, photographic convention", () => {
    expect(formatShutterSpeed(1 / 500)).toBe("1/500s");
    expect(formatShutterSpeed(0.01)).toBe("1/100s");
  });

  it("formats 1s and above as plain seconds", () => {
    expect(formatShutterSpeed(1)).toBe("1s");
    expect(formatShutterSpeed(2.5)).toBe("2.5s");
  });
});

describe("formatExposureComp", () => {
  it("prefixes positive values with +", () => {
    expect(formatExposureComp(0.3)).toBe("+0.3");
  });

  it("leaves zero and negative values unprefixed", () => {
    expect(formatExposureComp(0)).toBe("0");
    expect(formatExposureComp(-0.3)).toBe("-0.3");
  });

  it("rounds imprecise real-phone EXIF floats to 1 decimal", () => {
    expect(formatExposureComp(0.33539035466185535)).toBe("+0.3");
    expect(formatExposureComp(-0.669083118102841)).toBe("-0.7");
  });
});

describe("formatAperture", () => {
  it("rounds imprecise real-phone EXIF floats to 1 decimal", () => {
    expect(formatAperture(1.7799999713880652)).toBe("f/1.8");
    expect(formatAperture(2.798828125)).toBe("f/2.8");
  });

  it("leaves already-clean values unchanged", () => {
    expect(formatAperture(1.8)).toBe("f/1.8");
    expect(formatAperture(2)).toBe("f/2");
  });
});
