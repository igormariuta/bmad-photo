import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Photo } from "../worker/types";

interface IngestProgress {
  done: number;
  total: number;
}

/** A range Facet's bounds — either side `undefined` means unbounded on that
 * side; both `undefined` means the Facet is inactive/default ("All"). */
export interface RangeFilter {
  min?: number;
  max?: number;
}

/** One entry per Facet (Story 3.3 Dev Notes' 8-Facet list), each defaulting
 * to unbounded/"All". `dateFrom`/`dateTo` are `YYYY-MM-DD` strings compared
 * lexicographically against `capturedAt`'s date prefix — sortable as plain
 * strings without a `Date` parse, consistent with normalize.ts/aggregations.ts'
 * existing string-slice convention for this field. */
export interface FacetFiltersState {
  lens?: string;
  megapixelMode?: 12 | 48;
  camera?: "front" | "rear";
  dateFrom?: string;
  dateTo?: string;
  iso: RangeFilter;
  aperture: RangeFilter;
  shutter: RangeFilter;
  exposureComp: RangeFilter;
}

export const DEFAULT_FACET_FILTERS: FacetFiltersState = {
  iso: {},
  aperture: {},
  shutter: {},
  exposureComp: {},
};

interface IngestState {
  photos: Photo[];
  fileCount: number;
  progress: IngestProgress;
  complete: boolean;
  /** Dedup key set (AD-7) — not `Photo` fields (AD-4 has no filename/size/
   * timestamp-of-file), so tracked separately, populated for every Ingested
   * file regardless of `readable` outcome, from the very first Ingest batch. */
  signatures: Set<string>;
  /** Distinguishes "a prior batch already committed" from "this is the
   * very first Ingest," since `fileCount` gets overwritten to the new
   * batch's size by beginIngest() while a later Add More batch parses. */
  hasCommittedOnce: boolean;
  /** Global (dev-story fix-up 2026-07-08) — both Browse and Insights read
   * through `useFilteredPhotos()`, so filtering here affects both the grid
   * and the aggregate numbers. Supersedes Story 3.1/3.3's original design
   * where this was Browse-only and Insights stayed on the full readable set
   * (AC #5 as originally written). */
  facetFilters: FacetFiltersState;
}

/**
 * Not exported directly (AD-3 convention) — only the selector hooks and
 * plain mutator functions below reach outside this module. The mutators are
 * plain functions (not hooks) so non-component orchestration code (the
 * worker message handler in features/ingest) can call them directly.
 */
const useIngestStore = create<IngestState>(() => ({
  photos: [],
  fileCount: 0,
  progress: { done: 0, total: 0 },
  complete: false,
  signatures: new Set(),
  hasCommittedOnce: false,
  facetFilters: DEFAULT_FACET_FILTERS,
}));

export const MAX_PHOTOS_PER_INGEST = 100;

/** JSON-encoded rather than a bare `|`-join — self-documenting and avoids
 * ever having to reason about whether a filename could contain the
 * delimiter (size/lastModified are always plain non-negative integers, so a
 * bare join was already unambiguous in practice, but this removes the need
 * to prove that on every read). */
export function fileSignature(file: File): string {
  return JSON.stringify([file.name, file.size, file.lastModified]);
}

export interface DedupeAndCapCheckResult {
  /** The new-selection files to actually dispatch, with exact duplicates
   * (by signature) already silently dropped. Empty when over cap. */
  accepted: File[];
  /** Set only when the deduped total would exceed maxTotal — the entire
   * selection is rejected in that case, not just the overflow. */
  rejectionMessage?: string;
}

/** Pure (AD-7's dedupe-then-cap-check order) — takes existing signatures/
 * total as plain args instead of reading the store, so it's unit-testable
 * without any React/Zustand wiring. Dedupes against `existingSignatures`
 * AND against duplicates within `files` itself (a `seen` set accumulated
 * as it iterates), so re-selecting the same file twice in one picker
 * action doesn't double-count it either. */
export function dedupeAndCapCheck(
  files: File[],
  existingSignatures: ReadonlySet<string>,
  existingTotal: number,
  maxTotal: number,
): DedupeAndCapCheckResult {
  const seen = new Set(existingSignatures);
  const deduped: File[] = [];
  for (const file of files) {
    const signature = fileSignature(file);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    deduped.push(file);
  }

  if (existingTotal + deduped.length > maxTotal) {
    return {
      accepted: [],
      rejectionMessage: `Adding these would exceed the ${maxTotal}-photo limit for this session.`,
    };
  }

  return { accepted: deduped };
}

/** Reads current store state and delegates to dedupeAndCapCheck — the thin
 * wiring layer components call; the logic worth testing lives above. */
export function checkAddMore(files: File[]): DedupeAndCapCheckResult {
  const state = useIngestStore.getState();
  return dedupeAndCapCheck(files, state.signatures, state.fileCount, MAX_PHOTOS_PER_INGEST);
}

export function beginIngest(fileCount: number): void {
  useIngestStore.setState({ fileCount, progress: { done: 0, total: fileCount }, complete: false });
}

export function updateProgress(done: number, total: number): void {
  useIngestStore.setState({ progress: { done, total } });
}

export interface CommitPhotosResult {
  photos: Photo[];
  fileCount: number;
  complete: true;
  signatures: Set<string>;
  hasCommittedOnce: true;
}

/** Pure state-merge for commitPhotos — always appends (AD-7), records a
 * signature for every file regardless of its photo's `readable` outcome.
 * Extracted so this (the part worth getting right) is directly
 * unit-testable without any Zustand/React wiring, mirroring the
 * dedupeAndCapCheck/checkAddMore split above. */
export function mergeCommit(
  state: { photos: Photo[]; signatures: ReadonlySet<string> },
  photos: Photo[],
  files: File[],
): CommitPhotosResult {
  const signatures = new Set(state.signatures);
  for (const file of files) {
    signatures.add(fileSignature(file));
  }
  const nextPhotos = [...state.photos, ...photos];

  return {
    photos: nextPhotos,
    fileCount: nextPhotos.length,
    complete: true,
    signatures,
    hasCommittedOnce: true,
  };
}

/** Always appends — never replaces (AD-7). The very first Ingest appends
 * onto empty arrays, which has the same effect as a plain set. */
export function commitPhotos(photos: Photo[], files: File[]): void {
  useIngestStore.setState((state) => mergeCommit(state, photos, files));
}

export function useIngestedFileCount(): number {
  return useIngestStore((state) => state.fileCount);
}

/** True once any batch has ever committed — stays true through a later Add
 * More batch's parse, when `fileCount` is transiently the new batch's size
 * rather than the cumulative total. Used by app-shell to know whether a
 * mid-parse screen should keep the Header-bar (Add More) or not (first Ingest). */
export function useHasCommittedOnce(): boolean {
  return useIngestStore((state) => state.hasCommittedOnce);
}

export function useIngestProgress(): IngestProgress {
  return useIngestStore(useShallow((state) => state.progress));
}

/** Distinguishes "parsing in progress" from "parsing complete" for
 * app-shell's 3-way gate — `fileCount` alone is set at the start of Ingest
 * and can't tell the two states apart. */
export function useIsIngestComplete(): boolean {
  return useIngestStore((state) => state.complete);
}

export function useReadablePhotos(): Photo[] {
  return useIngestStore(useShallow((state) => state.photos.filter((photo) => photo.readable)));
}

/** Distinct `lensLabel` values across the full readable set (Task 3) — a
 * purpose-built selector rather than `browse/` calling `useReadablePhotos()`
 * directly (AD-3's convention), and deliberately NOT derived from
 * `useFilteredPhotos()`: the lens Facet's own option list must stay stable
 * as other Facets narrow the grid, not shrink away. Sorted by focal length
 * (parsed off `formatLensLabel`'s fixed `"{n}mm"` shape) for a stable,
 * predictable order. */
export function useLensOptions(): string[] {
  return useIngestStore(
    useShallow((state) => {
      const labels = new Set<string>();
      for (const photo of state.photos) {
        if (photo.readable && photo.lensLabel !== undefined) {
          labels.add(photo.lensLabel);
        }
      }
      return Array.from(labels).sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    }),
  );
}

/** Flat primitives, not `{ iso: [min, max], ... }` — `useShallow` only
 * compares one level deep, so nested tuple arrays (fresh references every
 * selector call) always compare unequal and drove an infinite render loop
 * ("Maximum update depth exceeded", caught via live Playwright verification,
 * 2026-07-08). Primitive numbers compare correctly by value instead. */
export interface NumericFacetBounds {
  isoMin: number;
  isoMax: number;
  apertureMin: number;
  apertureMax: number;
  shutterMin: number;
  shutterMax: number;
  exposureCompMin: number;
  exposureCompMax: number;
}

const FALLBACK_BOUNDS: [number, number] = [0, 1];

/** [min, max] observed for a numeric field across the full readable set — a
 * degenerate single-value set (min === max) widens by 1 so a slider driven
 * by these bounds always has a draggable range. */
export function computeBounds(values: number[]): [number, number] {
  if (values.length === 0) {
    return FALLBACK_BOUNDS;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? [min, max + 1] : [min, max];
}

/** Slider domain bounds for the 4 numeric range Facets (RangeSlider, user
 * request 2026-07-08) — same full-readable-set sourcing as
 * `useLensOptions()`, so the slider's own scale stays stable as other
 * Facets narrow the grid. */
export function useNumericFacetBounds(): NumericFacetBounds {
  return useIngestStore(
    useShallow((state) => {
      const readable = state.photos.filter((photo) => photo.readable);
      const values = (pick: (photo: Photo) => number | undefined) =>
        readable.map(pick).filter((value): value is number => value !== undefined);
      const [isoMin, isoMax] = computeBounds(values((photo) => photo.iso));
      const [apertureMin, apertureMax] = computeBounds(values((photo) => photo.apertureF));
      const [shutterMin, shutterMax] = computeBounds(values((photo) => photo.shutterSpeedSec));
      const [exposureCompMin, exposureCompMax] = computeBounds(values((photo) => photo.exposureCompEv));
      return {
        isoMin,
        isoMax,
        apertureMin,
        apertureMax,
        shutterMin,
        shutterMax,
        exposureCompMin,
        exposureCompMax,
      };
    }),
  );
}

/** A range Facet with both bounds `undefined` is inactive — every photo
 * passes regardless of whether its own field is defined. Once active (either
 * bound set), a photo with an `undefined` field for this dimension is
 * excluded — there's no value to confirm it satisfies the filter (Dev
 * Notes' `[ASSUMPTION]`, following AD-4's "undefined, never a sentinel"
 * rule). */
function matchesRange(value: number | undefined, filter: RangeFilter): boolean {
  if (filter.min === undefined && filter.max === undefined) {
    return true;
  }
  if (value === undefined) {
    return false;
  }
  if (filter.min !== undefined && value < filter.min) {
    return false;
  }
  if (filter.max !== undefined && value > filter.max) {
    return false;
  }
  return true;
}

/** Same inactive/undefined-field rule as matchesRange, applied to the date
 * Facet's `YYYY-MM-DD` string bounds against `capturedAt`'s date prefix. */
function matchesDateRange(capturedAt: string | undefined, dateFrom?: string, dateTo?: string): boolean {
  if (dateFrom === undefined && dateTo === undefined) {
    return true;
  }
  if (capturedAt === undefined) {
    return false;
  }
  const date = capturedAt.slice(0, 10);
  if (dateFrom !== undefined && date < dateFrom) {
    return false;
  }
  if (dateTo !== undefined && date > dateTo) {
    return false;
  }
  return true;
}

/** AND-combines all 8 Facets (AC #4) — pure so it's unit-testable without
 * any Zustand/React wiring, mirroring dedupeAndCapCheck/mergeCommit above. */
export function matchesFacetFilters(photo: Photo, filters: FacetFiltersState): boolean {
  if (filters.lens !== undefined && photo.lensLabel !== filters.lens) {
    return false;
  }
  if (filters.megapixelMode !== undefined && photo.megapixelMode !== filters.megapixelMode) {
    return false;
  }
  if (filters.camera !== undefined && photo.camera !== filters.camera) {
    return false;
  }
  if (!matchesDateRange(photo.capturedAt, filters.dateFrom, filters.dateTo)) {
    return false;
  }
  if (!matchesRange(photo.iso, filters.iso)) {
    return false;
  }
  if (!matchesRange(photo.apertureF, filters.aperture)) {
    return false;
  }
  if (!matchesRange(photo.shutterSpeedSec, filters.shutter)) {
    return false;
  }
  if (!matchesRange(photo.exposureCompEv, filters.exposureComp)) {
    return false;
  }
  return true;
}

/** Global — both Browse and Insights read through this (dev-story fix-up
 * 2026-07-08; Story 3.3 originally scoped it Browse-only). Real filtering
 * logic as of Story 3.3, replacing Story 3.2's trivial
 * `() => useReadablePhotos()` alias. Filters directly off `state.photos`
 * (not by calling `useReadablePhotos()`) to stay a single store
 * subscription, matching this file's existing single-selector style. */
export function useFilteredPhotos(): Photo[] {
  return useIngestStore(
    useShallow((state) =>
      state.photos.filter((photo) => photo.readable && matchesFacetFilters(photo, state.facetFilters)),
    ),
  );
}

export function useFacetFilters(): FacetFiltersState {
  return useIngestStore(useShallow((state) => state.facetFilters));
}

/** Every control's onChange commits directly here — no local draft/Apply
 * step (AC #4). */
export function setFacetFilter<K extends keyof FacetFiltersState>(
  key: K,
  value: FacetFiltersState[K],
): void {
  useIngestStore.setState((state) => ({ facetFilters: { ...state.facetFilters, [key]: value } }));
}

export function clearAllFacetFilters(): void {
  useIngestStore.setState({ facetFilters: DEFAULT_FACET_FILTERS });
}

export function useUnreadableCount(): number {
  return useIngestStore((state) => state.photos.filter((photo) => !photo.readable).length);
}
