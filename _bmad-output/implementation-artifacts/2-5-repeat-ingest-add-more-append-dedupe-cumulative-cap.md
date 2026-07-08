---
baseline_commit: b0a00980e5c7137fff781b0b2854fcd8279a3b1f
---

# Story 2.5: Repeat Ingest ("Add More") — Append, Dedupe, Cumulative Cap

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want to add more photos to my existing session,
so that my Insights update to reflect my whole library without losing what I already ingested.

## Acceptance Criteria

1. **Given** an existing Ingested set, **when** the user triggers "Add photos" again from the persistent Header-bar affordance, **then** the new selection appends to the existing store — it never replaces it (AD-7). [Source: planning-artifacts/epics.md#Story 2.5]
2. **Given** the cumulative session total, **when** an "Add more" action would push the total over 100, **then** it is rejected with a message stating the limit, before any file reaches the worker. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-7]
3. **Given** a re-selected file with the same `(fileName, size, lastModified)` as an already-Ingested file, **when** it is processed, **then** it is silently deduped — not re-added or double-counted in Insights. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-7]
4. **Given** an "Add more" action succeeds, **when** the store updates, **then** Insights recompute over the new full readable set. [Source: planning-artifacts/epics.md#Story 2.5]

## Dev Notes — read this first

- **Depends on Story 2.4** (the Header-bar `actions` slot patched in specifically for this story's trigger) and Story 2.2 (the canonical `Photo[]` store and worker pipeline this story extends).
- **The dedup key `(fileName, size, lastModified)` isn't a field on `Photo` at all** (checked: AD-4's `Photo` type has no filename/size/timestamp-of-file fields — it only has photo *content* metadata like `capturedAt`). This means the store needs a **second, internal-only tracking structure** — a `Set` of `` `${fileName}|${size}|${lastModified}` `` signatures — alongside the canonical `Photo[]` array, used purely for the dedup check inside the ingest action. This is not exposed via any selector (AD-3's "store not exported directly" applies to this too) and isn't part of the `Photo` entity.
- **Order of operations matters and isn't spelled out in AD-7 explicitly — here's the resolution:** dedupe **first** (against the signature set), silently dropping matches, **then** check whether `existingTotal + dedupedNewCount > 100` and reject only if so. Duplicates must not count toward the cap check — a re-selection that happens to include 20 duplicates and 30 genuinely-new files should be evaluated as "adding 30," not "adding 50." (Two separate outcomes, don't conflate them: silently dropping a dup is not the same code path as the explicit over-cap rejection message.)
- **"Cumulative for the session" (AD-7) counts every already-Ingested file, readable or not** — the cap is against total store size, not the readable-only subset.
- **`[ASSUMPTION]` UI treatment during a subsequent "Add more" parse:** epics.md doesn't specify whether this looks different from the first Ingest's full-screen progress takeover (Story 2.3). Simplest, most consistent choice: reuse the exact same `StatBar` progress screen, temporarily replacing the Insights view for the duration of the new batch's parse, rather than inventing a second concurrent/inline progress pattern. Flag for confirmation if an in-place (non-blocking) progress treatment is preferred instead.
- **`thumbnailUrl`s for already-Ingested photos are untouched** — AD-4 is explicit that they're revoked only on a full-session reset, never on "Add more." Only the newly-added batch gets new object URLs created (same main-thread `createObjectURL` step from Story 2.2, applied just to the new entries).
- **AC #4 needs no new mechanism**, same as Story 2.4's AC #3 — appending to the reactive store and reading it through `useReadablePhotos()`/`useUnreadableCount()` makes Insights recompute automatically.

## Tasks / Subtasks

- [x] Task 1: Persistent "Add more" trigger (AC: #1)
  - [x] Pass a `Button` (Story 1.4) into `Header-bar`'s `actions` slot (added in Story 2.4 specifically for this), reusing the same hidden-`<input type="file">` picker pattern from Story 2.1 — same accept/multiple attributes, no `capture`
- [x] Task 2: Dedup signature tracking (AC: #3)
  - [x] Extend the store with an internal `Set<string>` of `(fileName, size, lastModified)` signatures, populated for **every** Ingested file regardless of its `readable` outcome — including `readable: false` entries — from the very first Ingest batch (Story 2.1/2.2) onward, not just subsequent "Add more" actions, or the second "Add more" won't correctly dedupe against the first batch. Getting this wrong for unreadable files specifically would let a previously-unreadable file re-duplicate on a later "Add more" and inflate the unreadable count, which is exactly what AC #3 forbids
  - [x] On a new selection, filter out any file whose signature already exists in the set — these are silently dropped, no message, no worker dispatch, no cap-check contribution
- [x] Task 3: Cumulative cap check (AC: #2)
  - [x] After dedup (Task 2), compute `existingTotal + dedupedNewCount`; if `> 100`, reject the **entire** new selection with a message stating the limit (reuse the same `InfoBox` treatment as Story 2.1's first-Ingest cap message) — before any of the new files reach the worker
  - [x] If within the cap, dispatch only the deduped new files to the worker
- [x] Task 4: Append (never replace) into the canonical store (AC: #1, #4)
  - [x] On the worker's `complete` message for this new batch, create `thumbnailUrl`s for the new entries only (Story 2.2's main-thread step), then **append** the resulting `Photo[]` to the existing array — never reset or replace it
  - [x] Add the new files' signatures to the dedup set (Task 2)
- [x] Task 5: Progress UI reuse (AC: #1)
  - [x] Route this batch through the same `StatBar` progress screen from Story 2.3, temporarily standing in for Insights during the parse (see Dev Notes' `[ASSUMPTION]`)
- [x] Task 6: Verify (AC: #1–#4)
  - [x] Ingest a first batch, then "Add more" with a mix of genuinely-new and exact-duplicate files (same fileName/size/lastModified) — confirm duplicates are silently absent from the final count and the store isn't reset
  - [x] "Add more" with a selection that would push cumulative total over 100 (accounting for dedup) — confirm rejection with a stated-limit message, and confirm zero of those new files were dispatched to the worker
  - [x] Confirm Insights recompute to reflect the combined set after a successful "Add more"
  - [x] Confirm previously-Ingested photos' thumbnails still resolve (their object URLs weren't revoked)

### Review Findings (2026-07-08)

- [x] [Review][Patch] Concurrent "Add More" trigger bypasses the 100-photo cap and dedup guarantees (AC #2, AC #3) [apps/gallery/src/features/ingest/AddMoreControl.tsx, apps/gallery/src/app-shell/App.tsx, apps/gallery/src/store/ingestStore.ts] — fixed: `AddMoreControl` now disables the Button/input while `!ingestComplete`, verified live via Playwright (CPU-throttled) that the trigger is disabled mid-parse and re-enables on commit
- [x] [Review][Patch] `dedupeAndCapCheck` doesn't dedupe duplicate signatures within the same incoming selection [apps/gallery/src/store/ingestStore.ts:60-64] — fixed: now accumulates a `seen` set across the iteration instead of only checking against `existingSignatures`; unit-tested
- [x] [Review][Patch] `commitPhotos`'s append/signature/`hasCommittedOnce` logic has zero direct test coverage [apps/gallery/src/store/ingestStore.ts] — fixed: extracted the pure `mergeCommit(state, photos, files)` reducer (mirroring the `dedupeAndCapCheck` pattern) and added 4 direct unit tests
- [x] [Review][Patch] `fileSignature`'s `|`-delimited join is theoretically collision-prone for filenames containing `|` [apps/gallery/src/store/ingestStore.ts:14-16] — on closer analysis this was **not actually exploitable** (size/lastModified are always plain non-negative integers, so the trailing two `|`-segments are always unambiguous regardless of what's in `name`); switched to a `JSON.stringify([name, size, lastModified])` encoding anyway as a free, self-documenting hardening so no future reader has to re-derive that proof
- [x] [Review][Patch] `MAX_PHOTOS_PER_INGEST` is now duplicated between `ingestStore.ts` and `EmptyState.tsx` [apps/gallery/src/features/ingest/EmptyState.tsx, apps/gallery/src/store/ingestStore.ts] — fixed: `EmptyState.tsx` now imports the constant from `ingestStore.ts` instead of declaring its own
- [x] [Review][Defer] Worker error handling still absent [apps/gallery/src/features/ingest/ingestPhotos.ts] — deferred, pre-existing gap restated from Stories 2.2/2.3/2.4
- [x] [Review][Defer] No automated component/e2e test coverage for the AddMoreControl input-reset-ordering regression, App.tsx's 3-way branch, or the Playwright-verified flows [apps/gallery/src/features/ingest/AddMoreControl.tsx, apps/gallery/src/app-shell/App.tsx] — deferred, repo has no React Testing Library/e2e framework installed; consistent with prior stories' verification approach
- [x] [Review][Defer] `fileCount` is overloaded (cumulative library size vs. transient in-flight batch size) [apps/gallery/src/store/ingestStore.ts] — deferred, root-cause design smell underlying the patched concurrency issue; a full split into two fields is a larger refactor not required once the trigger is disabled mid-parse
- [x] [Review][Defer] Rejection `InfoBox`/`role="alert"` doesn't re-announce an identical repeated message, and has no dismiss affordance [apps/gallery/src/features/ingest/AddMoreControl.tsx] — deferred, matches `EmptyState.tsx`'s existing, already-shipped pattern; not a regression introduced by this story

## Project Structure Notes

Extends `apps/gallery/src/store/` (dedup signature set, append instead of replace) and `apps/gallery/src/features/ingest/` (the "Add more" trigger, routed through `Header-bar`'s new `actions` slot from Story 2.4). No new packages/components.

### References

- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-7] — append-not-replace, cumulative cap, dedup key, `thumbnailUrl` revocation-only-on-reset
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4] — confirms `Photo` has no filename/size/timestamp fields (why a separate dedup structure is needed)
- [Source: planning-artifacts/epics.md#Story 2.5] — acceptance criteria origin
- [Source: 2-4-insights-dashboard.md#Task 1] — `Header-bar`'s `actions` slot, added for this story

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

- Live-verified via a Playwright script driving the Vite dev server against synthetic EXIF-bearing JPEG fixtures (piexifjs-generated): first Ingest (3 readable) → Add More with 2 new + 1 exact duplicate (confirmed combined count = 5, dup silently dropped, no reset) → Add More with 99 more distinct files (5 + 99 = 104 > 100, confirmed rejection message and count unchanged at 5) → zero console/page errors throughout. Screenshots retained in the session scratchpad.
- Caught and fixed a real bug during that live run: `AddMoreControl`'s `handleFilesSelected` originally reset `event.target.value = ""` *before* converting the live `FileList` to a plain array — since `input.files` is a live list tied to the input's current selection, the reset zeroed it out before `checkAddMore` ever ran, so every Add More silently no-opped (readable count stayed at 3). Fixed by capturing `Array.from(files)` first, then resetting — matching Story 2.1's `EmptyState` ordering, which does this correctly.

### Completion Notes List

- `ingestStore.ts`: added a `signatures: Set<string>` (dedup keys, `${fileName}|${size}|${lastModified}`) and a `hasCommittedOnce` flag to state; `commitPhotos` now always appends (photos + signatures) instead of replacing, and is called with both the resulting `Photo[]` and the originating `File[]` so signatures get recorded for every Ingested file regardless of `readable` outcome. Added a pure, directly-unit-tested `dedupeAndCapCheck(files, existingSignatures, existingTotal, maxTotal)` (dedupe-then-cap-check order per AD-7) plus a thin `checkAddMore` wrapper that reads current store state and delegates to it — mirrors the aggregations.ts/normalize.ts precedent of keeping the testable logic pure and the Zustand wiring thin/untested-directly.
- `AddMoreControl.tsx` (new): the persistent Header-bar "Add photos" trigger — Button + hidden file input, calls `checkAddMore`, shows an `InfoBox` (role="alert") on rejection, silently no-ops when every file was a dup, otherwise calls `ingestPhotos`.
- `App.tsx`: gate now distinguishes the very first Ingest (still full-screen `IngestProgress`, no header) from a later Add More batch parsing (Header-bar with `AddMoreControl` stays visible, only `Insights` swaps for `IngestProgress`) via the new `useHasCommittedOnce()` selector — needed because `fileCount` itself is transiently overwritten to the new batch's size mid-parse and can't distinguish the two cases.
- `ingestPhotos.ts`: `commitPhotos` call now also passes the dispatched `files` array (order-aligned 1:1 with the worker's `photos` output, per the worker's sequential per-file loop).
- turbo lint/build/test all pass (32 Vitest tests, 7 new — `ingestStore.test.ts` covers `fileSignature` stability and `dedupeAndCapCheck`'s dedupe-first/cap-second ordering including the exact boundary).

**Post-review patches (2026-07-08):** A 3-layer adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) independently converged on one critical finding across all three layers, plus 4 smaller ones — all 5 fixed:
- `AddMoreControl` now disables its Button/hidden input while `!ingestComplete` — closes a real bug where clicking "Add photos" again before a prior batch committed let `checkAddMore` read stale `fileCount`/`signatures`, bypassing both the 100-photo cap and dedup (Acceptance Auditor traced a concrete 95→+4→+4 = 103 overflow with zero rejection shown). Verified live via a CPU-throttled Playwright run that the trigger disables mid-parse and re-enables on commit.
- `dedupeAndCapCheck` now dedupes within the incoming selection itself (a `seen` set accumulated during iteration), not just against `existingSignatures` — closes a gap where the same file selected twice in one batch wasn't caught.
- Extracted `mergeCommit(state, photos, files)` as a pure reducer out of `commitPhotos` and added 4 direct unit tests — closes a real test-coverage gap on the append/signature/`hasCommittedOnce` logic that Task 2/4 emphasize getting right.
- `fileSignature` switched from a bare `${name}|${size}|${lastModified}` join to `JSON.stringify([name, size, lastModified])`. On analysis the original join was already unambiguous in practice (size/lastModified are always plain digit strings, so the trailing two `|` segments are always recoverable regardless of `name`'s content) — not a real vulnerability — but the JSON form is free and removes the need for a future reader to re-derive that proof.
- `EmptyState.tsx` now imports `MAX_PHOTOS_PER_INGEST` from `ingestStore.ts` instead of declaring its own copy, closing a drift risk between the two Ingest entry points' cap constants.

All 13 Vitest tests in `ingestStore.test.ts` pass (6 new from the patch round); turbo lint/build/test all green; re-verified live via Playwright that the full Add More flow (dedupe, append, over-cap rejection) still works after the patches.

### Post-completion fix-up round 1 (2026-07-08, user request — folder upload, matching Story 2.1's own)

Same request as Story 2.1's identical fix-up (see that story for the full write-up) — this control is `AddMoreControl.tsx`'s own concern for every batch after the first. Added a second "Add folder" button/input (`webkitdirectory`, set imperatively via ref callback) alongside the existing "Add photos"; the selected `FileList` is filtered through Story 2.2's new `isImageFile` helper before the existing dedupe/cap-check pipeline, so a folder's non-image junk (`.DS_Store`, etc.) never counts against the cumulative cap or the dedup signature set. This file's own `handleFilesSelected` already ordered `Array.from(files)` before the `event.target.value` reset correctly (unlike Story 2.1's `EmptyState.tsx`, which had the same fix applied after a real regression there) — no equivalent bug existed here.

turbo lint/build/test clean (113/113 tests); live-verified via Playwright.

### File List

- `apps/gallery/src/store/ingestStore.ts` (modified)
- `apps/gallery/src/store/ingestStore.test.ts` (new)
- `apps/gallery/src/features/ingest/ingestPhotos.ts` (modified)
- `apps/gallery/src/features/ingest/AddMoreControl.tsx` (new; post-completion round 1 — added a second "Add folder" button/input, filters non-image files via Story 2.2's `isImageFile`)
- `apps/gallery/src/features/ingest/EmptyState.tsx` (modified — post-review patch, shares `MAX_PHOTOS_PER_INGEST`)
- `apps/gallery/src/app-shell/App.tsx` (modified)

## Change Log

- 2026-07-08: Implemented Story 2.5 — persistent Add More trigger, dedup signature tracking, cumulative cap check, append-only store, progress-screen reuse with persistent header. All ACs verified live via Playwright against synthetic EXIF fixtures.
- 2026-07-08: Addressed code review findings — 5 patches applied (disabled Add More trigger during in-flight parse to close a cap/dedup-bypass bug, intra-batch dedup in `dedupeAndCapCheck`, extracted+tested `mergeCommit` reducer, hardened `fileSignature` encoding, deduplicated `MAX_PHOTOS_PER_INGEST`), 4 deferred, 5 dismissed as noise.
- 2026-07-08 — Post-completion fix-up round 1 (user request) — added folder selection to `AddMoreControl`, matching the identical addition to Story 2.1's `EmptyState`; filters non-image files via Story 2.2's new `isImageFile` helper before the existing dedupe/cap pipeline. `turbo lint/build/test` clean (113/113 tests); live-verified via Playwright.
