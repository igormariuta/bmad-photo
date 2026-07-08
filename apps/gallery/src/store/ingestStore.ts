import { useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Photo } from "../worker/types";

interface IngestProgress {
  done: number;
  total: number;
}

/** A range Facet's bounds — either side `undefined` means unbounded on that
 * side; both `undefined` means the Facet is inactive/default ("All");
 * `min === max` means an exact single value (the "pick one" slider mode,
 * round-4 UX request, 2026-07-08). `lens`/`aperture`/`shutter` use this
 * shape, each driving a discrete-snap slider (only values actually present
 * in the batch) with a single-value/range toggle. */
export interface RangeFilter {
  min?: number;
  max?: number;
}

/**
 * One entry per Facet (Story 3.3 Dev Notes' 8-Facet list). `exposureComp`/
 * `megapixelMode`/`years` are checkbox-style multi-select value lists (UX
 * redesign, 2026-07-08) — an empty array means inactive/"All"; a non-empty
 * array matches a photo whose field equals ANY selected value. `years`
 * replaced the earlier `dateFrom`/`dateTo` range (user request: simplify
 * the date Facet down to year selection). `lens`/`aperture`/`shutter`/`iso`
 * are slider-driven `RangeFilter`s instead (round-4/5 UX requests: these
 * read more naturally as a slider than a long checkbox list) — `lens`
 * matches against the integer parsed off `lensLabel`'s `"{n}mm"` shape, not
 * `focalLengthMm` directly, so it can never land on a value more precise
 * than what's actually displayed.
 */
export interface FacetFiltersState {
  lens: RangeFilter;
  iso: RangeFilter;
  aperture: RangeFilter;
  exposureComp: number[];
  megapixelMode: (12 | 48)[];
  camera?: "front" | "rear";
  years: RangeFilter;
  shutter: RangeFilter;
}

export const DEFAULT_FACET_FILTERS: FacetFiltersState = {
  lens: {},
  iso: {},
  aperture: {},
  exposureComp: [],
  megapixelMode: [],
  years: {},
  shutter: {},
};

/** Pure — toggles `value` in/out of a checkbox-style multi-select Facet
 * array. Exported + unit-tested (mirrors dedupeAndCapCheck/mergeCommit's
 * "extract the part worth getting right" pattern). */
export function toggleInArray<T>(array: readonly T[], value: T): T[] {
  return array.includes(value) ? array.filter((item) => item !== value) : [...array, value];
}

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

export interface FacetValueOptions {
  lens: number[];
  iso: number[];
  aperture: number[];
  shutter: number[];
  exposureComp: number[];
  megapixelMode: (12 | 48)[];
  years: number[];
  /** Whether any readable photo has this camera value — Camera's own
   * options are fixed (All/Front/Rear, not data-derived like every other
   * Facet), so this drives disabling an option with zero matches instead
   * (round-5 UX request) rather than omitting/adding options dynamically. */
  hasCameraFront: boolean;
  hasCameraRear: boolean;
}

function distinctSortedNumbers(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

/** The integer a `lensLabel` (e.g. `"24mm"`) displays — parsed rather than
 * reading `focalLengthMm` directly, so the lens slider's positions always
 * match exactly what's shown (`formatLensLabel`'s rounding), never a more
 * precise raw value a user could never see or intentionally pick. */
function parseLensLabel(lensLabel: string): number {
  return Number.parseInt(lensLabel, 10);
}

/** Pure — the distinct, sorted values for every discrete/slider-driven
 * Facet, computed across the full readable set (not `useFilteredPhotos()`):
 * option lists must stay stable as other Facets narrow the grid, not shrink
 * away (same reasoning the old `useLensOptions()` used). Extracted as a
 * plain function so it's unit-testable and so the hook below can memoize on
 * a stable upstream reference instead of re-deriving on every render. */
export function computeFacetValueOptions(photos: readonly Photo[]): FacetValueOptions {
  const lens: number[] = [];
  const iso: number[] = [];
  const aperture: number[] = [];
  const shutter: number[] = [];
  const exposureComp: number[] = [];
  const megapixelSet = new Set<12 | 48>();
  const years: number[] = [];
  let hasCameraFront = false;
  let hasCameraRear = false;

  for (const photo of photos) {
    if (!photo.readable) {
      continue;
    }
    if (photo.lensLabel !== undefined) {
      lens.push(parseLensLabel(photo.lensLabel));
    }
    if (photo.iso !== undefined) {
      iso.push(photo.iso);
    }
    if (photo.apertureF !== undefined) {
      aperture.push(photo.apertureF);
    }
    if (photo.shutterSpeedSec !== undefined) {
      shutter.push(photo.shutterSpeedSec);
    }
    if (photo.exposureCompEv !== undefined) {
      exposureComp.push(photo.exposureCompEv);
    }
    if (photo.megapixelMode !== undefined) {
      megapixelSet.add(photo.megapixelMode);
    }
    if (photo.capturedAt !== undefined) {
      years.push(parseYear(photo.capturedAt));
    }
    if (photo.camera === "front") {
      hasCameraFront = true;
    } else if (photo.camera === "rear") {
      hasCameraRear = true;
    }
  }

  return {
    lens: distinctSortedNumbers(lens),
    iso: distinctSortedNumbers(iso),
    aperture: distinctSortedNumbers(aperture),
    shutter: distinctSortedNumbers(shutter),
    exposureComp: distinctSortedNumbers(exposureComp),
    megapixelMode: Array.from(megapixelSet).sort((a, b) => a - b),
    years: distinctSortedNumbers(years),
    hasCameraFront,
    hasCameraRear,
  };
}

/**
 * Memoized via React's `useMemo` keyed on `state.photos`'s own reference —
 * NOT `useShallow` on the computed result. `computeFacetValueOptions`
 * returns fresh nested arrays every call, which would infinite-loop under
 * `useShallow`'s one-level-deep comparison (the same bug class the earlier
 * `NumericFacetBounds` fix addressed, 2026-07-08 — see git history).
 * `state.photos` only changes reference on ingest/commit, not on every
 * Facet-filter interaction, so this selector's actual output object stays
 * referentially stable across filter changes.
 */
export function useFacetValueOptions(): FacetValueOptions {
  const photos = useIngestStore((state) => state.photos);
  return useMemo(() => computeFacetValueOptions(photos), [photos]);
}

/** A range Facet with both bounds `undefined` is inactive — every photo
 * passes regardless of whether its own field is defined. Once active (either
 * bound set), a photo with an `undefined` field for this dimension is
 * excluded — there's no value to confirm it satisfies the filter (Dev
 * Notes' `[ASSUMPTION]`, following AD-4's "undefined, never a sentinel"
 * rule). Only `shutter` still uses this (see FacetFiltersState). */
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

/** An empty `selected` array is inactive — every photo passes regardless of
 * whether its own field is defined. Once active, a photo with an
 * `undefined` field for this dimension is excluded (same rule as
 * matchesRange, applied to checkbox-style multi-select Facets). */
function matchesDiscrete<T>(value: T | undefined, selected: readonly T[]): boolean {
  if (selected.length === 0) {
    return true;
  }
  if (value === undefined) {
    return false;
  }
  return selected.includes(value);
}

/** The year a `capturedAt` timestamp falls in, parsed off its `YYYY-...`
 * prefix — `years` is `RangeFilter`-shaped (round-6 UX request, joining
 * lens/aperture/shutter/ISO's slider pattern), matched via the same generic
 * `matchesRange` used everywhere else. */
function parseYear(capturedAt: string): number {
  return Number.parseInt(capturedAt.slice(0, 4), 10);
}

/** AND-combines all 8 Facets (AC #4) — pure so it's unit-testable without
 * any Zustand/React wiring, mirroring dedupeAndCapCheck/mergeCommit above. */
export function matchesFacetFilters(photo: Photo, filters: FacetFiltersState): boolean {
  const lensValue = photo.lensLabel === undefined ? undefined : parseLensLabel(photo.lensLabel);
  if (!matchesRange(lensValue, filters.lens)) {
    return false;
  }
  if (!matchesDiscrete(photo.megapixelMode, filters.megapixelMode)) {
    return false;
  }
  if (filters.camera !== undefined && photo.camera !== filters.camera) {
    return false;
  }
  const yearValue = photo.capturedAt === undefined ? undefined : parseYear(photo.capturedAt);
  if (!matchesRange(yearValue, filters.years)) {
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
  if (!matchesDiscrete(photo.exposureCompEv, filters.exposureComp)) {
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
