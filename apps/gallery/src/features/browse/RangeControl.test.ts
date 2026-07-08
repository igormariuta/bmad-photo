import { describe, expect, it } from "vitest";
import { isRangeInvalid } from "./RangeControl";

describe("isRangeInvalid", () => {
  it("is never invalid when either side is blank (unbounded)", () => {
    expect(isRangeInvalid("number", "", "")).toBe(false);
    expect(isRangeInvalid("number", "10", "")).toBe(false);
    expect(isRangeInvalid("number", "", "10")).toBe(false);
  });

  it("number: invalid when min > max, valid when min <= max", () => {
    expect(isRangeInvalid("number", "10", "5")).toBe(true);
    expect(isRangeInvalid("number", "5", "10")).toBe(false);
    expect(isRangeInvalid("number", "5", "5")).toBe(false);
  });

  it("date: compares YYYY-MM-DD strings lexicographically", () => {
    expect(isRangeInvalid("date", "2026-06-21", "2026-06-14")).toBe(true);
    expect(isRangeInvalid("date", "2026-06-14", "2026-06-21")).toBe(false);
    expect(isRangeInvalid("date", "2026-06-14", "2026-06-14")).toBe(false);
  });
});
