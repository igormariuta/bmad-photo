import { describe, expect, it } from "vitest";
import { summarizeRange } from "./FacetPanel";

describe("summarizeRange", () => {
  it("returns the unbounded label when both sides are blank", () => {
    expect(summarizeRange("", "", "All ISO")).toBe("All ISO");
  });

  it("joins both sides with an en dash when both are set", () => {
    expect(summarizeRange("100", "400", "All ISO")).toBe("100–400");
  });

  it("shows a min-only range with a ≥ prefix", () => {
    expect(summarizeRange("100", "", "All ISO")).toBe("≥100");
  });

  it("shows a max-only range with a ≤ prefix", () => {
    expect(summarizeRange("", "400", "All ISO")).toBe("≤400");
  });
});
