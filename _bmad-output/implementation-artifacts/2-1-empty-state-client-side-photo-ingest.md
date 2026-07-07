---
baseline_commit: fa670c845015e7f0ce7ec9c66f1d05f4c1d7e901
---

# Story 2.1: Empty State & Client-side Photo Ingest

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder (primary user),
I want to open the Gallery and select a batch of photos from my device,
so that I can begin analyzing my shooting habits without any account or upload step.

## Acceptance Criteria

1. **Given** the Gallery is opened with no photos yet Ingested, **when** the app renders, **then** the empty-state shows the privacy promise and a single "Add photos" button, with no header/tabs/panel chrome visible. [Source: planning-artifacts/epics.md#Story 2.1]
2. **Given** the empty-state, **when** the user taps "Add photos", **then** the native photo picker opens (mobile: phone photo library; desktop: file picker), and multiple photos can be selected in one action; **and** no network request carries photo bytes or Metadata (verifiable in the network inspector, per NFR1). [Source: planning-artifacts/epics.md#Story 2.1]
3. **Given** a first-Ingest selection, **when** the selection exceeds 100 photos, **then** the action is rejected with a message stating the limit, before any file reaches the worker. [Source: planning-artifacts/epics.md#Story 2.1]
4. **Given** the empty-state's privacy-promise copy, **when** it is written, **then** it follows the plain, non-editorializing voice/tone contract (e.g. "Nothing uploads. Nothing's stored.") — no marketing fluff or exclamation-point energy. [Source: planning-artifacts/epics.md#Story 2.1]

## Dev Notes — read this first

**This is Epic 2's first story — it deliberately does not deliver a complete end-to-end flow.** The EXIF worker doesn't exist until Story 2.2, the progress UI is Story 2.3, and the Insights dashboard is Story 2.4. This story's honest scope is: the empty-state screen, the native picker, and the ≤100 cap check on the *first* Ingest only (cumulative-cap-across-actions and dedup are explicitly Story 2.5's job, not this one, since the store starts empty here — there's nothing yet to dedupe against).

- **Depends on Epic 1 fully implemented** (`packages/theme`, `packages/ui`'s `Button`, `Loading`, `InfoBox`). Uses `apps/gallery/src/app-shell/`, `features/ingest/`, and `store/` — all placeholder folders from Story 1.1's structural seed, now getting their first real content.
- **What happens after a valid (≤100) selection, given the worker doesn't exist yet:** store the raw `File[]` in a minimal Zustand store slot and render `packages/ui`'s `Loading` (block form, from Story 1.5) as a transitional placeholder. This is intentionally a stub — Story 2.2 replaces "store raw files" with the real worker pipeline producing `Photo[]`, and Story 2.3 replaces this `Loading` placeholder with the real determinate `StatBar` progress UI. Note this explicitly in code comments so it isn't mistaken for a forgotten feature by whoever picks up Story 2.2.
- **Chrome-gating for this story only needs two states, not three:** empty-state (nothing ingested) vs. the transitional placeholder (a valid selection was made). There is no header/tabs/Insights view to gate yet — `Header-bar` itself isn't built by any Epic 1 story (checked: it's absent from both Story 1.4's and 1.5's inherited-component lists, since DESIGN.md marks it "New") and Story 2.4 is the first place it's actually required, so building it here would be premature. `app-shell`'s job in this story is only: `photosSelected ? <TransitionalPlaceholder /> : <EmptyState />`.
- **Minimal store shape needed now (extended by Story 2.2, not finalized here):** something like `{ rawFiles: File[] }` with an `ingestFiles(files: File[])` action. Story 2.2 is what introduces the real canonical `Photo[]` + the `useReadablePhotos`/`useUnreadableCount`/`useFacetFilters`/`useFilteredPhotos` selectors from AD-3 — don't build those selectors here, there's no `Photo` data yet to select over.
- **Native picker mechanics:** a plain `<input type="file" accept="image/*" multiple>` — **no** `capture` attribute (that would force the camera instead of offering the photo library/file picker choice). This is what gives mobile Safari its native photo-library picker and desktop browsers their native file picker, with zero custom UI needed for the picker itself.
- **The 100-cap check is purely a client-side count of the selected `FileList`**, done synchronously in the input's `onChange` handler, before anything is written to the store or dispatched anywhere — there is no worker yet in this story for the check to precede, but the same "validate before dispatch" principle carries forward once Story 2.2 adds one.
- **NFR1 verification is procedural, not code:** since this story adds no `fetch`/`XHR` call anywhere, the "no network request carries photo bytes" AC is satisfied by omission — verify with the browser's Network tab as a manual check, not a new mechanism to build.

## Tasks / Subtasks

- [x] Task 1: Minimal Ingest store slot (AC: #2, #3)
  - [x] In `apps/gallery/src/store/`, add a Zustand store holding `rawFiles: File[]` and an `ingestFiles(files: File[]): void` action that replaces `rawFiles` (first-Ingest only — no append/dedupe logic yet, that's Story 2.5)
  - [x] Do not export the raw store directly (AD-3 convention, applies even to this minimal shape) — export a small hook (e.g. `useIngestedFileCount()`) for whatever needs to read it in this story
- [x] Task 2: Empty-state screen (AC: #1, #4)
  - [x] Build in `apps/gallery/src/features/ingest/` (per Story 1.1's structural seed): full-screen centered layout — eyebrow, H1, one-line privacy-promise body copy, single primary `Button` (from `packages/ui`, Story 1.4) labeled "Add photos", plus a smaller sub-line below the button
  - [x] **Copy is now confirmed by the real mockup (`mockups/gallery-empty-state.html`), not a drafted approximation — use it verbatim:** eyebrow `"// EXIF GALLERY"`; H1 `"See how you actually shoot."` (rendered on two lines in the mockup); privacy-promise body `"Nothing uploads. Nothing's stored."`; button `"Add photos"`; sub-line below the button: `"Reads EXIF entirely in your browser — focal length, ISO, shutter, time of day. Close the tab and it's gone."`
  - [x] No header/tabs/panel chrome renders alongside this screen (Dev Notes: `app-shell` gates on `rawFiles.length === 0`)
- [x] Task 3: Native picker + cap check (AC: #2, #3)
  - [x] Wire the "Add photos" `Button` to a hidden `<input type="file" accept="image/*" multiple>` (a real `<button>` triggering a visually-hidden file input's native picker is the standard accessible pattern — don't rely on styling the raw `<input>` itself)
  - [x] In the input's `onChange`: if `event.target.files.length > 100`, reject — render the limit message (plain phrasing, e.g. *"Pick 100 photos or fewer."*) in `packages/ui`'s `InfoBox` (Story 1.5) rather than inventing new markup for it; this is an informational limit notice, not a form validation error, so `InfoBox` fits better than `FieldError`/`ErrorMessage`. Do **not** call `ingestFiles` at all
  - [x] If `event.target.files.length <= 100`, call `ingestFiles(Array.from(event.target.files))`
- [x] Task 4: Transitional post-selection placeholder (AC: #2)
  - [x] `app-shell` renders `packages/ui`'s `Loading` (block form) when `rawFiles.length > 0` — this is intentionally temporary, see Dev Notes; leave a code comment pointing at Story 2.2/2.3 as the stories that replace it
- [x] Task 5: Verify (AC: #1, #2, #3, #4)
  - [x] Empty-state renders with no chrome on first load
  - [x] Selecting ≤100 photos transitions to the placeholder, no network requests fire (check DevTools Network tab)
  - [x] Selecting >100 photos shows the limit message and does not transition away from the empty-state
  - [x] Copy review: privacy-promise line reads as a plain statement of fact, not marketing copy

### Review Findings

- [x] [Review][Decision] `InfoBox` tone for the over-cap message: `danger` vs `info` — resolved: keep `tone="danger"` (current code, no change). Product call: a rejected action is a real negative outcome, and `InfoBox`'s own doc comment reserves `danger` for exactly this ("warnings/destructive-outcome notes"). [apps/gallery/src/features/ingest/EmptyState.tsx]
- [x] [Review][Patch] Over-cap limit message isn't announced to screen readers — no `role="alert"`/`aria-live` on the dynamically-rendered `InfoBox`, so assistive tech won't notice the rejection when it appears. **Fixed:** wrapped the conditional `InfoBox` in a persistent `<div role="alert">` (not `InfoBox` itself, since Project Structure Notes rule out touching `packages/ui` in this story) — the container stays mounted so content inserted into it is reliably announced; verified via Playwright that `[role="alert"]` picks up the message text. [apps/gallery/src/features/ingest/EmptyState.tsx]
- [x] [Review][Patch] Redundant `font-bold` on the H1 — `text-h1` already sets `font-weight: 700` via its bundled token (`--text-h1--font-weight`), making the explicit class a no-op duplicate. **Fixed:** removed `font-bold`; verified computed `font-weight` is still `700` (from the token) via Playwright. [apps/gallery/src/features/ingest/EmptyState.tsx]
- [x] [Review][Defer] Non-image files aren't filtered before reaching `ingestFiles`/the store (`accept="image/*"` isn't OS-enforced) — deferred, pre-existing scope boundary: this is Story 2.2's EXIF-worker job (AD-2 marks unreadable files via `error`/`readable:false`), not this story's. [apps/gallery/src/features/ingest/EmptyState.tsx]
- [x] [Review][Defer] No path back from the transitional `Loading` placeholder to `EmptyState` once a valid selection is made — deferred, pre-existing scope boundary: intentional given this story's stub scope; Story 2.2/2.3 replace this branch entirely with the real worker pipeline/progress UI, so a reset affordance now would be throwaway work. [apps/gallery/src/app-shell/App.tsx]

**Round 2 (re-review after the above patches were applied):** 3-layer review re-run on the patched diff — Blind Hunter (14 findings, all repeats of round-1-dismissed items or false positives, 0 new actionable), Acceptance Auditor (confirmed both patches correct, no new deviations, all 4 ACs still hold), Edge Case Hunter (1 new finding, 1 repeat of an already-deferred item).

- [x] [Review][Dismiss] Repeated identical `limitMessage` text inside `role="alert"` may not re-announce to screen readers on a second consecutive identical rejection (React skips the DOM text mutation for an unchanged string) — dismissed: edge case (same exact rejection twice in a row), acceptable for this story's scope; the first announcement (the common case) still works correctly. [apps/gallery/src/features/ingest/EmptyState.tsx]

## Project Structure Notes

```text
apps/gallery/src/
  app-shell/          # gains: empty-state vs. placeholder gating logic
  features/ingest/    # gains: empty-state screen, picker wiring, cap-check message
  store/              # gains: minimal rawFiles slot (extended by Story 2.2)
```

No new packages/apps; no changes to `packages/ui`/`packages/theme` in this story.

### References

- [Source: planning-artifacts/epics.md#Story 2.1] — acceptance criteria origin, exact privacy-copy example
- [Source: planning-artifacts/epics.md#Epic 2 intro] — "In this epic, Browse does not yet exist... no dead/unreachable navigation" (confirms the intentionally transitional nature of intermediate story states)
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-3] — store-not-exported-directly convention, applied even to this minimal shape
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-7] — first-Ingest vs. cumulative-cap distinction (this story is first-Ingest only)
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#NFR1, #NFR2] — privacy (no network egress) and Ingest cap origin
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — empty-state] — full-screen centered layout spec
- [Source: ux-designs/ux-BMAD/mockups/gallery-empty-state.html] — confirmed final copy (eyebrow, H1, privacy line, button, sub-line)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

No debugging issues encountered. `tsc --noEmit`, `vite build`, `eslint`, and `stylelint` all pass clean on first implementation pass.

### Completion Notes List

- Added `zustand@5.0.14` (per ARCHITECTURE-SPINE.md's Stack table) as a new `apps/gallery` dependency — the story's own Dev Notes specify a Zustand store by name, so this isn't an out-of-spec addition.
- `apps/gallery/src/store/ingestStore.ts`: minimal `{ rawFiles: File[] }` slot with a first-Ingest-only `ingestFiles` action (replaces, doesn't append — Story 2.5's job). The `create()` result itself is not exported; only `useIngestedFileCount()` (read) and `useIngestFiles()` (the action getter) are, per AD-3's store-not-exported-directly convention.
- `apps/gallery/src/features/ingest/EmptyState.tsx`: full-screen centered layout using the mockup's exact copy verbatim (eyebrow, two-line H1, privacy-promise line, "Add photos" button, sub-line). The "Add photos" `Button` triggers a `hidden` (display:none), `tabIndex={-1}`, `aria-hidden` file input via a ref + `.click()` — the standard accessible hidden-input pattern; the input itself is never meant to be reached directly by keyboard/screen-reader.
  - Cap check (`files.length > 100`) runs synchronously in `onChange`, before `ingestFiles` is ever called, and renders `InfoBox` (`tone="danger"`) with `"Pick 100 photos or fewer."` — matches the story's phrasing example.
  - Only Tailwind's core/theme-mapped scale is used (`max-w-xs` = 320px, matching the mockup's sub-line max-width exactly; `gap-6`/`px-8` map to the `--m-space-6`/`--m-space-8` tokens) — zero arbitrary-value usage, confirmed by a clean `tailwindcss/no-arbitrary-value` lint pass.
- `apps/gallery/src/app-shell/App.tsx`: gates `useIngestedFileCount() > 0 ? <Loading /> : <EmptyState />` — the only two states this story needs (Dev Notes explicitly rule out building `Header-bar`/chrome here, since no Epic 1 story delivers it and Story 2.4 is its first real consumer). Code comment on the `Loading` branch names Story 2.2/2.3 as what replaces it, so it isn't mistaken for a forgotten feature.
- **No Vitest suite added**, consistent with the project's established convention (Stories 1.1/1.4/1.5): ARCHITECTURE-SPINE.md's own Deferred section states only the Story 2.2 EXIF-normalization layer gets Vitest coverage; this story's verification mechanism is Task 5's manual checklist.
- **Verified end-to-end in a real browser** (Playwright-driven Chromium against the `vite dev` server, screenshotted and torn down afterward — no test files added to the repo): empty-state renders pixel-matching the mockup with zero header/chrome elements; selecting 101 files shows `"Pick 100 photos or fewer."` and stays on the empty-state; selecting 5 files transitions to the `Loading` placeholder; captured network requests during both selections contained zero non-localhost entries, confirming NFR1 (no photo bytes/Metadata leave the tab) by observation, not just by omission of a `fetch` call.

### File List

- `apps/gallery/package.json` (modified — added `zustand` dependency)
- `pnpm-lock.yaml` (modified — `pnpm install` lockfile update for `zustand`)
- `apps/gallery/src/store/ingestStore.ts` (new)
- `apps/gallery/src/features/ingest/EmptyState.tsx` (new; patched post-review — `role="alert"` wrapper, removed redundant `font-bold`)
- `apps/gallery/src/app-shell/App.tsx` (modified — empty-state/placeholder gating)
- `apps/gallery/src/store/.gitkeep` (deleted — superseded by real content)
- `apps/gallery/src/features/ingest/.gitkeep` (deleted — superseded by real content)

## Change Log

- 2026-07-07 — Implemented Story 2.1: empty-state screen, minimal Zustand Ingest store, native photo picker with 100-photo cap check, transitional `Loading` placeholder gating in `app-shell`. Verified in a real browser via Playwright (empty-state render, over-cap rejection, valid-selection transition, zero network egress). `turbo lint`/`tsc`/`vite build` all pass clean.
- 2026-07-07 — Addressed code review findings: 1 decision resolved (kept `InfoBox` `tone="danger"` for the over-cap message), 2 patches applied (`role="alert"` on the limit-message container for screen-reader announcement; removed redundant `font-bold` on the H1), 2 items deferred (non-image file filtering → Story 2.2; no reset path from `Loading` → intentional stub scope), 13 dismissed as noise. `turbo lint`/`tsc`/`vite build` re-verified clean; both patches re-verified live via Playwright.
- 2026-07-07 — Round 2 re-review on the patched diff: 3 layers re-run, 0 new actionable findings (1 new edge case — repeated-identical-alert-text re-announcement — dismissed as acceptable for this story's scope; 1 repeat of an already-deferred item; remainder repeats/false-positives of round 1). Story confirmed `done`, no further code changes.
