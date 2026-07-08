import { describe, expect, it } from "vitest";
import {
  computeBounds,
  dedupeAndCapCheck,
  DEFAULT_FACET_FILTERS,
  fileSignature,
  matchesFacetFilters,
  mergeCommit,
  MAX_PHOTOS_PER_INGEST,
  type FacetFiltersState,
} from "./ingestStore";
import type { Photo } from "../worker/types";

function makeFile(name: string, lastModified = 1, size = 7): File {
  return new File(["x".repeat(size)], name, { lastModified });
}

function photo(fields: Partial<Photo>): Photo {
  return { id: "id", readable: true, thumbnailUrl: "", ...fields };
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

describe("matchesFacetFilters", () => {
  function filters(overrides: Partial<FacetFiltersState>): FacetFiltersState {
    return { ...DEFAULT_FACET_FILTERS, ...overrides };
  }

  it("matches everything against the default (all-unbounded) filters", () => {
    expect(matchesFacetFilters(photo({}), DEFAULT_FACET_FILTERS)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 200, lensLabel: "24mm" }), DEFAULT_FACET_FILTERS)).toBe(
      true,
    );
  });

  it("discrete Facet (lens): matches on exact equality, excludes a photo with an undefined field", () => {
    const f = filters({ lens: "24mm" });
    expect(matchesFacetFilters(photo({ lensLabel: "24mm" }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ lensLabel: "48mm" }), f)).toBe(false);
    expect(matchesFacetFilters(photo({}), f)).toBe(false);
  });

  it("discrete Facet (megapixelMode/camera): active filter excludes undefined field, inactive filter is unaffected", () => {
    const mp = filters({ megapixelMode: 48 });
    expect(matchesFacetFilters(photo({ megapixelMode: 48 }), mp)).toBe(true);
    expect(matchesFacetFilters(photo({ megapixelMode: 12 }), mp)).toBe(false);
    expect(matchesFacetFilters(photo({}), mp)).toBe(false);
    expect(matchesFacetFilters(photo({}), DEFAULT_FACET_FILTERS)).toBe(true);

    const cam = filters({ camera: "front" });
    expect(matchesFacetFilters(photo({ camera: "front" }), cam)).toBe(true);
    expect(matchesFacetFilters(photo({ camera: "rear" }), cam)).toBe(false);
  });

  it("range Facet (iso): respects open-ended min/max bounds, excludes undefined field only when active", () => {
    const minOnly = filters({ iso: { min: 400 } });
    expect(matchesFacetFilters(photo({ iso: 400 }), minOnly)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 399 }), minOnly)).toBe(false);
    expect(matchesFacetFilters(photo({}), minOnly)).toBe(false);

    const maxOnly = filters({ iso: { max: 400 } });
    expect(matchesFacetFilters(photo({ iso: 401 }), maxOnly)).toBe(false);

    const bounded = filters({ iso: { min: 100, max: 400 } });
    expect(matchesFacetFilters(photo({ iso: 100 }), bounded)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 400 }), bounded)).toBe(true);
    expect(matchesFacetFilters(photo({ iso: 401 }), bounded)).toBe(false);
  });

  it("range Facet (aperture/shutter/exposureComp): each applies independently", () => {
    const f = filters({ aperture: { max: 2 }, shutter: { min: 0.01 } });
    expect(matchesFacetFilters(photo({ apertureF: 1.8, shutterSpeedSec: 0.02 }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ apertureF: 2.8, shutterSpeedSec: 0.02 }), f)).toBe(false);
    expect(matchesFacetFilters(photo({ apertureF: 1.8, shutterSpeedSec: 0.005 }), f)).toBe(false);
  });

  it("date Facet: compares the YYYY-MM-DD prefix of capturedAt lexicographically", () => {
    const f = filters({ dateFrom: "2026-06-14", dateTo: "2026-06-21" });
    expect(matchesFacetFilters(photo({ capturedAt: "2026-06-14T10:00:00" }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ capturedAt: "2026-06-21T23:59:59" }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ capturedAt: "2026-06-13T23:59:59" }), f)).toBe(false);
    expect(matchesFacetFilters(photo({ capturedAt: "2026-06-22T00:00:00" }), f)).toBe(false);
    expect(matchesFacetFilters(photo({}), f)).toBe(false);
  });

  it("AND-combines multiple active Facets — a photo must satisfy every one", () => {
    const f = filters({ lens: "24mm", iso: { max: 400 } });
    expect(matchesFacetFilters(photo({ lensLabel: "24mm", iso: 200 }), f)).toBe(true);
    expect(matchesFacetFilters(photo({ lensLabel: "48mm", iso: 200 }), f)).toBe(false);
    expect(matchesFacetFilters(photo({ lensLabel: "24mm", iso: 800 }), f)).toBe(false);
  });
});

describe("computeBounds", () => {
  it("returns the fallback [0, 1] for an empty set", () => {
    expect(computeBounds([])).toEqual([0, 1]);
  });

  it("returns [min, max] for a normal set", () => {
    expect(computeBounds([200, 800, 400])).toEqual([200, 800]);
  });

  it("widens a degenerate single-value set by 1 so the slider has a draggable range", () => {
    expect(computeBounds([400, 400, 400])).toEqual([400, 401]);
  });
});
