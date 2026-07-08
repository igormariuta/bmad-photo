import { describe, expect, it } from "vitest";
import { formatExposureComp, formatShutterSpeed } from "./FacetPanel";

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
});
