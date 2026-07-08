import { describe, expect, it } from "vitest";
import {
  computeFacetValueOptions,
  dedupeAndCapCheck,
  DEFAULT_FACET_FILTERS,
  fileSignature,
  hasActiveFacetFilters,
  matchesFacetFilters,
  mergeCommit,
  mergePhotoMedia,
  toggleInArray,
  MAX_PHOTOS_PER_INGEST,
  type FacetFiltersState,
} from "./ingestStore";
import type { Photo } from "../worker/types";

function makeFile(name: string, lastModified = 1, size = 7): File {
  return new File(["x".repeat(size)], name, { lastModified });
}

function photo(fields: Partial<Photo>): Photo {
  return { id: "id", readable: true, thumbnailUrl: "", fullUrl: "", ...fields };
}

describe("fileSignature", () => {
  it("is stable for the same (name, size, lastModified) triple", () => {
    const a = makeFile("a.jpg", 100);
    const b = makeFile("a.jpg", 100);
    expect(fileSignature(a)).toBe(fileSignature(b));
  });

  it("differs when lastModified differs", () => {
    const a = makeFile("a.jpg", 100);
    const b = makeFile("a.jpg", 200);
    expect(fileSignature(a)).not.toBe(fileSignature(b));
  });

  it("stays distinct across differing triples even when the name embeds the delimiter character", () => {
    const a = makeFile("a|1", 3, 2);
    const b = makeFile("a", 2, 1);
    expect(fileSignature(a)).not.toBe(fileSignature(b));
  });
});

describe("dedupeAndCapCheck", () => {
  it("passes through files with no matching signature untouched", () => {
    const files = [makeFile("a.jpg"), makeFile("b.jpg")];
    const result = dedupeAndCapCheck(files, new Set(), 0, MAX_PHOTOS_PER_INGEST);
    expect(result.accepted).toHaveLength(2);
    expect(result.rejectionMessage).toBeUndefined();
  });

  it("silently drops files whose signature is already known, no rejection message", () => {
    const dup = makeFile("dup.jpg");
    const fresh = makeFile("fresh.jpg");
    const existing = new Set([fileSignature(dup)]);
    const result = dedupeAndCapCheck([dup, fresh], existing, 1, MAX_PHOTOS_PER_INGEST);
    expect(result.accepted).toEqual([fresh]);
    expect(result.rejectionMessage).toBeUndefined();
  });

  it("evaluates the cap against the deduped count, not the raw selection count", () => {
    // existingTotal 99 + 1 genuinely-new (after 1 dup dropped from a 2-file
    // selection) must NOT reject, even though the raw selection count is 2.
    const dup = makeFile("dup.jpg");
    const fresh = makeFile("fresh.jpg");
    const existing = new Set([fileSignature(dup)]);
    const result = dedupeAndCapCheck([dup, fresh], existing, 99, MAX_PHOTOS_PER_INGEST);
    expect(result.accepted).toEqual([fresh]);
    expect(result.rejectionMessage).toBeUndefined();
  });

  it("rejects the entire selection with a stated-limit message when over cap", () => {
    const files = [makeFile("a.jpg"), makeFile("b.jpg")];
    const result = dedupeAndCapCheck(files, new Set(), 99, MAX_PHOTOS_PER_INGEST);
    expect(result.accepted).toEqual([]);
    expect(result.rejectionMessage).toMatch(String(MAX_PHOTOS_PER_INGEST));
  });

  it("accepts exactly up to the cap boundary", () => {
    const files = [makeFile("a.jpg")];
    const result = dedupeAndCapCheck(files, new Set(), MAX_PHOTOS_PER_INGEST - 1, MAX_PHOTOS_PER_INGEST);
    expect(result.accepted).toEqual(files);
    expect(result.rejectionMessage).toBeUndefined();
  });

  it("dedupes duplicate signatures within the same incoming selection, not just against existingSignatures", () => {
    const first = makeFile("same.jpg");
    const sameAgain = makeFile("same.jpg");
    const fresh = makeFile("fresh.jpg");
    const result = dedupeAndCapCheck([first, sameAgain, fresh], new Set(), 0, MAX_PHOTOS_PER_INGEST);
    expect(result.accepted).toEqual([first, fresh]);
  });
});

describe("mergeCommit", () => {
  it("appends onto an empty store the same as it would onto a populated one", () => {
    const state = { photos: [], signatures: new Set<string>() };
    const file = makeFile("a.jpg");
    const result = mergeCommit(state, [photo({ id: "a" })], [file]);
    expect(result.photos).toEqual([photo({ id: "a" })]);
    expect(result.fileCount).toBe(1);
    expect(result.complete).toBe(true);
    expect(result.hasCommittedOnce).toBe(true);
    expect(result.signatures.has(fileSignature(file))).toBe(true);
  });

  it("appends new photos after existing ones — never replaces", () => {
    const existingFile = makeFile("existing.jpg");
    const state = {
      photos: [photo({ id: "existing" })],
      signatures: new Set([fileSignature(existingFile)]),
    };
    const newFile = makeFile("new.jpg");
    const result = mergeCommit(state, [photo({ id: "new" })], [newFile]);
    expect(result.photos).toEqual([photo({ id: "existing" }), photo({ id: "new" })]);
    expect(result.fileCount).toBe(2);
  });

  it("records a signature for every file regardless of the resulting photo's readable outcome", () => {
    const state = { photos: [], signatures: new Set<string>() };
    const unreadableFile = makeFile("corrupt.jpg");
    const result = mergeCommit(state, [photo({ id: "u", readable: false })], [unreadableFile]);
    expect(result.signatures.has(fileSignature(unreadableFile))).toBe(true);
  });

  it("doesn't mutate the signatures set passed in via state", () => {
    const original = new Set<string>();
    const state = { photos: [], signatures: original };
    mergeCommit(state, [photo({ id: "a" })], [makeFile("a.jpg")]);
    expect(original.size).toBe(0);
  });
});

describe("mergePhotoMedia", () => {
  it("replaces only the matching photo's media, leaving its other fields untouched", () => {
    const photos = [photo({ id: "a", lensLabel: "24mm" }), photo({ id: "b" })];
    const result = mergePhotoMedia(photos, "a", { thumbnailUrl: "thumb", fullUrl: "full" });
    expect(result[0]).toEqual({ ...photo({ id: "a", lensLabel: "24mm" }), thumbnailUrl: "thumb", fullUrl: "full" });
    expect(result[1]).toEqual(photo({ id: "b" }));
  });

  it("leaves every photo unchanged when no id matches", () => {
    const photos = [photo({ id: "a" })];
    const result = mergePhotoMedia(photos, "missing", { thumbnailUrl: "thumb", fullUrl: "full" });
    expect(result).toEqual(photos);
  });
});

describe("toggleInArray", () => {
  it("adds a value not yet present", () => {
    expect(toggleInArray([1, 2], 3)).toEqual([1, 2, 3]);
  });

  it("removes a value already present", () => {
    expect(toggleInArray([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it("doesn't mutate the array passed in", () => {
    const original = [1, 2];
    toggleInArray(original, 3);
    expect(original).toEqual([1, 2]);
  });
});

describe("matchesFacetFilters", () => {
  function filters(overrides: Partial<FacetFiltersState>): FacetFiltersState {
    return { ...DEFAULT_FACET_FILTERS, ...overrides };
  }

  it("matches everything against the default (all-empty) filters", () => {
    expect(matchesFacetFilters(photo({}), DEFAULT_FACET_FILTERS)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 200, lensLabel: "24mm" }), DEFAULT_FACET_FILTERS)).toBe(
      true,
    );
  });

  it("range Facet (lens): matches the integer parsed off lensLabel's '{n}mm' shape, excludes a photo with an undefined field", () => {
    const f = filters({ lens: { min: 24, max: 48 } });
    expect(matchesFacetFilters(photo({ lensLabel: "24mm" }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ lensLabel: "48mm" }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ lensLabel: "85mm" }), f)).toBe(false);
    expect(matchesFacetFilters(photo({}), f)).toBe(false);
  });

  it("range Facet (lens): min === max is an exact single-value pick (slider 'pick one' mode)", () => {
    const f = filters({ lens: { min: 24, max: 24 } });
    expect(matchesFacetFilters(photo({ lensLabel: "24mm" }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ lensLabel: "35mm" }), f)).toBe(false);
  });

  it("discrete Facet (megapixelMode/camera): active filter excludes undefined field, inactive filter is unaffected", () => {
    const mp = filters({ megapixelMode: [48] });
    expect(matchesFacetFilters(photo({ megapixelMode: 48 }), mp)).toBe(true);
    expect(matchesFacetFilters(photo({ megapixelMode: 12 }), mp)).toBe(false);
    expect(matchesFacetFilters(photo({}), mp)).toBe(false);
    expect(matchesFacetFilters(photo({}), DEFAULT_FACET_FILTERS)).toBe(true);

    const cam = filters({ camera: "front" });
    expect(matchesFacetFilters(photo({ camera: "front" }), cam)).toBe(true);
    expect(matchesFacetFilters(photo({ camera: "rear" }), cam)).toBe(false);
  });

  it("discrete Facet (exposureComp): matches any selected value, excludes undefined field only when active", () => {
    const exposureComp = filters({ exposureComp: [0.3, -0.3] });
    expect(matchesFacetFilters(photo({ exposureCompEv: 0.3 }), exposureComp)).toBe(true);
    expect(matchesFacetFilters(photo({ exposureCompEv: 0 }), exposureComp)).toBe(false);
  });

  it("range Facet (iso/aperture/shutter): min/max-based, respects open-ended bounds", () => {
    const iso = filters({ iso: { min: 100, max: 400 } });
    expect(matchesFacetFilters(photo({ iso: 100 }), iso)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 200 }), iso)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 400 }), iso)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 800 }), iso)).toBe(false);
    expect(matchesFacetFilters(photo({}), iso)).toBe(false);

    const aperture = filters({ aperture: { min: 1.8, max: 1.8 } });
    expect(matchesFacetFilters(photo({ apertureF: 1.8 }), aperture)).toBe(true);
    expect(matchesFacetFilters(photo({ apertureF: 2.8 }), aperture)).toBe(false);

    const minOnly = filters({ shutter: { min: 0.01 } });
    expect(matchesFacetFilters(photo({ shutterSpeedSec: 0.02 }), minOnly)).toBe(true);
    expect(matchesFacetFilters(photo({ shutterSpeedSec: 0.005 }), minOnly)).toBe(false);
    expect(matchesFacetFilters(photo({}), minOnly)).toBe(false);

    const bounded = filters({ shutter: { min: 0.01, max: 0.1 } });
    expect(matchesFacetFilters(photo({ shutterSpeedSec: 0.05 }), bounded)).toBe(true);
    expect(matchesFacetFilters(photo({ shutterSpeedSec: 0.2 }), bounded)).toBe(false);
  });

  it("range Facet (years): matches the year parsed off capturedAt's YYYY prefix", () => {
    const f = filters({ years: { min: 2026, max: 2026 } });
    expect(matchesFacetFilters(photo({ capturedAt: "2026-06-14T10:00:00" }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ capturedAt: "2025-12-31T23:59:59" }), f)).toBe(false);
    expect(matchesFacetFilters(photo({}), f)).toBe(false);
  });

  it("AND-combines multiple active Facets — a photo must satisfy every one", () => {
    const f = filters({ lens: { min: 24, max: 24 }, iso: { min: 200, max: 200 } });
    expect(matchesFacetFilters(photo({ lensLabel: "24mm", iso: 200 }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ lensLabel: "48mm", iso: 200 }), f)).toBe(false);
    expect(matchesFacetFilters(photo({ lensLabel: "24mm", iso: 800 }), f)).toBe(false);
  });
});

describe("hasActiveFacetFilters", () => {
  function filters(overrides: Partial<FacetFiltersState>): FacetFiltersState {
    return { ...DEFAULT_FACET_FILTERS, ...overrides };
  }

  it("is false for the default (all-inactive) filters", () => {
    expect(hasActiveFacetFilters(DEFAULT_FACET_FILTERS)).toBe(false);
  });

  it("is true when a range Facet has either bound set", () => {
    expect(hasActiveFacetFilters(filters({ lens: { min: 24 } }))).toBe(true);
    expect(hasActiveFacetFilters(filters({ shutter: { max: 0.1 } }))).toBe(true);
    expect(hasActiveFacetFilters(filters({ iso: { min: 100 } }))).toBe(true);
    expect(hasActiveFacetFilters(filters({ aperture: { max: 2.8 } }))).toBe(true);
    expect(hasActiveFacetFilters(filters({ years: { min: 2020 } }))).toBe(true);
  });

  it("is true for a bound of exactly 0 — a falsy value that is still meaningfully 'set'", () => {
    expect(hasActiveFacetFilters(filters({ shutter: { min: 0 } }))).toBe(true);
  });

  it("is true when a checkbox-style Facet has a non-empty selection", () => {
    expect(hasActiveFacetFilters(filters({ megapixelMode: [48] }))).toBe(true);
    expect(hasActiveFacetFilters(filters({ exposureComp: [0.3] }))).toBe(true);
  });

  it("is true when camera is set", () => {
    expect(hasActiveFacetFilters(filters({ camera: "front" }))).toBe(true);
  });

  it("is false when arrays are empty and ranges are both-undefined, even as new object instances", () => {
    expect(hasActiveFacetFilters(filters({ lens: {}, megapixelMode: [] }))).toBe(false);
  });
});

describe("computeFacetValueOptions", () => {
  it("returns empty lists for an empty set", () => {
    expect(computeFacetValueOptions([])).toEqual({
      lens: [],
      iso: [],
      aperture: [],
      shutter: [],
      exposureComp: [],
      megapixelMode: [],
      years: [],
      hasCameraFront: false,
      hasCameraRear: false,
    });
  });

  it("reports whether any readable photo has each camera value", () => {
    expect(computeFacetValueOptions([photo({ camera: "rear" })]).hasCameraFront).toBe(false);
    expect(computeFacetValueOptions([photo({ camera: "rear" })]).hasCameraRear).toBe(true);
    expect(computeFacetValueOptions([photo({ camera: "front" })]).hasCameraFront).toBe(true);
  });

  it("returns distinct, sorted values across the readable set only", () => {
    const photos = [
      photo({ lensLabel: "48mm", iso: 800, apertureF: 2.8, capturedAt: "2026-06-14T10:00:00" }),
      photo({ lensLabel: "24mm", iso: 200, apertureF: 1.8, capturedAt: "2025-01-01T00:00:00" }),
      photo({ lensLabel: "24mm", iso: 200, apertureF: 1.8, capturedAt: "2025-01-01T00:00:00" }), // exact dup
      photo({ readable: false, lensLabel: "85mm", iso: 3200 }), // unreadable — excluded
    ];
    const options = computeFacetValueOptions(photos);
    expect(options.lens).toEqual([24, 48]);
    expect(options.iso).toEqual([200, 800]);
    expect(options.aperture).toEqual([1.8, 2.8]);
    expect(options.years).toEqual([2025, 2026]);
  });

  it("skips undefined fields per-dimension independently", () => {
    const photos = [photo({ iso: 200 }), photo({ apertureF: 1.8 })];
    const options = computeFacetValueOptions(photos);
    expect(options.iso).toEqual([200]);
    expect(options.aperture).toEqual([1.8]);
  });
});
