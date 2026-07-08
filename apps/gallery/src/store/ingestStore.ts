import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Photo } from "../worker/types";

interface IngestProgress {
  done: number;
  total: number;
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

export function useUnreadableCount(): number {
  return useIngestStore((state) => state.photos.filter((photo) => !photo.readable).length);
}
