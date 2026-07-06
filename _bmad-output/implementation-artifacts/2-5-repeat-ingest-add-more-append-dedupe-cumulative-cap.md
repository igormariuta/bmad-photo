# Story 2.5: Repeat Ingest ("Add More") — Append, Dedupe, Cumulative Cap

Status: ready-for-dev

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

- [ ] Task 1: Persistent "Add more" trigger (AC: #1)
  - [ ] Pass a `Button` (Story 1.4) into `Header-bar`'s `actions` slot (added in Story 2.4 specifically for this), reusing the same hidden-`<input type="file">` picker pattern from Story 2.1 — same accept/multiple attributes, no `capture`
- [ ] Task 2: Dedup signature tracking (AC: #3)
  - [ ] Extend the store with an internal `Set<string>` of `(fileName, size, lastModified)` signatures, populated for **every** Ingested file regardless of its `readable` outcome — including `readable: false` entries — from the very first Ingest batch (Story 2.1/2.2) onward, not just subsequent "Add more" actions, or the second "Add more" won't correctly dedupe against the first batch. Getting this wrong for unreadable files specifically would let a previously-unreadable file re-duplicate on a later "Add more" and inflate the unreadable count, which is exactly what AC #3 forbids
  - [ ] On a new selection, filter out any file whose signature already exists in the set — these are silently dropped, no message, no worker dispatch, no cap-check contribution
- [ ] Task 3: Cumulative cap check (AC: #2)
  - [ ] After dedup (Task 2), compute `existingTotal + dedupedNewCount`; if `> 100`, reject the **entire** new selection with a message stating the limit (reuse the same `InfoBox` treatment as Story 2.1's first-Ingest cap message) — before any of the new files reach the worker
  - [ ] If within the cap, dispatch only the deduped new files to the worker
- [ ] Task 4: Append (never replace) into the canonical store (AC: #1, #4)
  - [ ] On the worker's `complete` message for this new batch, create `thumbnailUrl`s for the new entries only (Story 2.2's main-thread step), then **append** the resulting `Photo[]` to the existing array — never reset or replace it
  - [ ] Add the new files' signatures to the dedup set (Task 2)
- [ ] Task 5: Progress UI reuse (AC: #1)
  - [ ] Route this batch through the same `StatBar` progress screen from Story 2.3, temporarily standing in for Insights during the parse (see Dev Notes' `[ASSUMPTION]`)
- [ ] Task 6: Verify (AC: #1–#4)
  - [ ] Ingest a first batch, then "Add more" with a mix of genuinely-new and exact-duplicate files (same fileName/size/lastModified) — confirm duplicates are silently absent from the final count and the store isn't reset
  - [ ] "Add more" with a selection that would push cumulative total over 100 (accounting for dedup) — confirm rejection with a stated-limit message, and confirm zero of those new files were dispatched to the worker
  - [ ] Confirm Insights recompute to reflect the combined set after a successful "Add more"
  - [ ] Confirm previously-Ingested photos' thumbnails still resolve (their object URLs weren't revoked)

## Project Structure Notes

Extends `apps/gallery/src/store/` (dedup signature set, append instead of replace) and `apps/gallery/src/features/ingest/` (the "Add more" trigger, routed through `Header-bar`'s new `actions` slot from Story 2.4). No new packages/components.

### References

- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-7] — append-not-replace, cumulative cap, dedup key, `thumbnailUrl` revocation-only-on-reset
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4] — confirms `Photo` has no filename/size/timestamp fields (why a separate dedup structure is needed)
- [Source: planning-artifacts/epics.md#Story 2.5] — acceptance criteria origin
- [Source: 2-4-insights-dashboard.md#Task 1] — `Header-bar`'s `actions` slot, added for this story

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
