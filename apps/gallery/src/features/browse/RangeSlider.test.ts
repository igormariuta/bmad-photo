import { describe, expect, it } from "vitest";
import { clamp, percentFor, valueFromRatio } from "./RangeSlider";

describe("clamp", () => {
  it("passes through values already inside the range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps below min and above max", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("percentFor", () => {
  it("maps min/max to 0/100", () => {
    expect(percentFor(0, 0, 100)).toBe(0);
    expect(percentFor(100, 0, 100)).toBe(100);
  });

  it("maps the midpoint to 50", () => {
    expect(percentFor(50, 0, 100)).toBe(50);
  });

  it("clamps out-of-domain values to 0/100 instead of extrapolating", () => {
    expect(percentFor(-10, 0, 100)).toBe(0);
    expect(percentFor(110, 0, 100)).toBe(100);
  });

  it("returns 0 for a degenerate (min === max) domain instead of dividing by zero", () => {
    expect(percentFor(5, 5, 5)).toBe(0);
  });
});

describe("valueFromRatio", () => {
  it("maps ratio 0/1 to min/max", () => {
    expect(valueFromRatio(0, 100, 400, 1)).toBe(100);
    expect(valueFromRatio(1, 100, 400, 1)).toBe(400);
  });

  it("snaps to the nearest step", () => {
    expect(valueFromRatio(0.5, 0, 100, 25)).toBe(50);
    expect(valueFromRatio(0.51, 0, 100, 25)).toBe(50);
  });

  it("clamps an out-of-range ratio", () => {
    expect(valueFromRatio(-0.5, 0, 100, 1)).toBe(0);
    expect(valueFromRatio(1.5, 0, 100, 1)).toBe(100);
  });
});
