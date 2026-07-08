---
baseline_commit: 5c494d504c87e637462a116b7edd23b13b656a78
---

# Story 3.4: Empty Filtered State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want clear feedback when my filters match nothing,
so that I know to adjust them rather than think the app is broken.

## Acceptance Criteria

1. **Given** active Facet filters that match zero photos, **when** the Browse grid renders, **then** it shows a "No photos match these filters" message with a visible "Clear filters" action. [Source: planning-artifacts/epics.md#Story 3.4]
2. **Given** this empty-filtered state, **when** compared to the zero-photos empty-state (Story 2.1), **then** the two are visually and textually distinct. [Source: planning-artifacts/epics.md#Story 3.4]

## Dev Notes

- **Depends on Story 3.3** (`useFacetFilters()`/`useFilteredPhotos()` with real filtering logic).
- **This project now has three visually-distinct "nothing to show" states — don't conflate them:**
  1. Story 2.1's empty-state: no photos Ingested at all (no header/tabs chrome).
  2. Story 2.4's all-unreadable state: photos Ingested, but every one is `readable: false` (Insights-side).
  3. **This story:** photos Ingested, some are readable, but the *active Facet filters* currently match zero of them (Browse-side). This is the only one of the three where "Clear filters" is the relevant action — the other two have no filters to clear.
- **Trigger condition:** `useFilteredPhotos().length === 0` **and** `useReadablePhotos().length > 0` **and** at least one Facet is non-default (i.e. the emptiness is caused by filtering, not by there being nothing readable to filter in the first place — that's state 2 above, Insights' concern, not this one). Story 3.3's mobile filter-count logic already computes "is any Facet non-default"; reuse that same check here rather than re-deriving it.
- **"Clear filters" reuses Story 3.3's "Clear-all" action** — same handler, just a second entry point into it. Story 3.3's own task text describes this behavior inline rather than mandating a named, exported function — if 3.3 was implemented with the logic inline in its own component, extract it to a shared function/hook now rather than duplicating the reset logic here.

## Tasks / Subtasks

- [x] Task 1: Empty-filtered message (AC: #1, #2)
  - [x] In the Browse grid region, when the trigger condition (Dev Notes) holds, replace the grid with a message — *"No photos match these filters."* — and a `Button` labeled "Clear filters" wired to Story 3.3's existing clear-all handler
  - [x] Copy and layout must read as visually/textually distinct from Story 2.1's empty-state (different heading, no privacy-promise copy, no "Add photos" primary action — this is a narrowing problem, not a first-run problem)
- [x] Task 2: Verify (AC: #1, #2)
  - [x] Apply a Facet combination that matches zero photos — confirm the message + Clear-filters action appear, and the grid is otherwise empty of stray content
  - [x] Trigger Story 2.1's true empty-state and this state side by side (or in sequence) — confirm they're readable as clearly different situations, not the same screen with a different count

### Review Findings

- [x] [Review][Decision→Patch] Browse renders no message when all ingested photos are unreadable (readablePhotos.length === 0), even with active Facet filters — Story 3.2's review explicitly deferred "blank-grid empty-state" to this story ("owned by 3.4"), but this story's own Dev Notes trigger condition requires `useReadablePhotos().length > 0`, scoping that case out to Insights only. **User decision (2026-07-08): patch now.** Browse now shows a third state — "No readable photos." + "N unreadable — always excluded." (no Clear-filters action, matching the fact there's nothing to clear) — whenever `readablePhotoCount === 0`, distinct from both the filtered-empty message and Insights' equivalent copy. [apps/gallery/src/features/browse/Browse.tsx]
- [x] [Review][Patch] hasActiveFacetFilters test coverage is uneven across the 8 Facets — only lens/shutter get a dedicated true-case assertion for `isRangeActive`; iso/aperture/years are only exercised implicitly via the all-default case, and no test covers a boundary value of literal `0` (falsy but meaningfully "set"). Fixed: added true-case assertions for iso/aperture/years and a dedicated boundary-0 test. [apps/gallery/src/store/ingestStore.test.ts:240-247]
- [x] [Review][Patch] Duplicated `// BROWSE` eyebrow markup across both Browse.tsx return branches (must be kept in sync by hand), and the new JSDoc's "that's Insights' concern, not Browse's" wording reads as if the all-unreadable case is handled somewhere in Browse when it isn't. Fixed: refactored to a single return with one eyebrow and a 3-way conditional body; JSDoc rewritten to describe both Browse-owned messages accurately. [apps/gallery/src/features/browse/Browse.tsx]
- [x] [Review][Patch] No `aria-live`/`role="status"` on the empty-filtered message container — since this replaces the grid in response to a live Facet interaction (not a page load), screen-reader users get no announcement that their filter just zeroed the results, inconsistent with this repo's existing convention (EmptyState's `role="alert"`, IngestProgress's `aria-live="polite"`). Fixed: both new message containers now carry `aria-live="polite"`, matching IngestProgress's precedent. [apps/gallery/src/features/browse/Browse.tsx]
- [x] [Review][Defer] No automated component-rendering regression test for the new Browse.tsx UI branch [apps/gallery/src/features/browse/Browse.tsx] — deferred, pre-existing: this repo has no jsdom/RTL component-test infra by established convention (vitest runs with `environment: "node"`); verified live via Playwright instead, matching prior stories' precedent (e.g. 3.2's deferred "no component-level test for PhotoGridCell").
- [x] [Review][Defer] `hasActiveFacetFilters`'s "8 Facets" check is a hardcoded list with no structural exhaustiveness enforcement (e.g. a 9th Facet field added later wouldn't be caught by a type error) [apps/gallery/src/store/ingestStore.ts:454-465] — deferred, pre-existing: this mirrors `matchesFacetFilters`'s own pre-existing 8-field hardcoded AND-chain from Story 3.3, extended consistently rather than introducing a new pattern.

## Project Structure Notes

Touches only `apps/gallery/src/features/browse/` — the grid region built in Story 3.2. No new components beyond reusing `Button` (Story 1.4).

### References

- [Source: planning-artifacts/epics.md#Story 3.4, #UX-DR19] — acceptance criteria origin
- [Source: ux-designs/ux-BMAD/EXPERIENCE.md#State Patterns] — the original state-patterns table this AC implements almost verbatim, including the note that Insights has no filter state to ever be empty from
- [Source: 2-1-empty-state-client-side-photo-ingest.md] — the first-run empty-state this must stay visually distinct from
- [Source: 2-4-insights-dashboard.md#Task 6] — the all-unreadable state this is also distinct from
- [Source: 3-3-facet-panel-live-filtering.md#Task 5] — Clear-all handler and active-filter-count check this story reuses

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- Dev Notes pointed at "Story 3.3's mobile filter-count logic" for the active-Facet check, but 3.3's mobile Facet-panel (and its filter-count logic) was deferred by user decision — desktop-only that iteration (see sprint-status.yaml 3-3 entry). No such logic exists in the codebase, so `hasActiveFacetFilters`/`useHasActiveFacetFilters` in `ingestStore.ts` are the first real implementation, not a duplicate of existing logic.
- "Clear filters" reuse required no extraction: Story 3.3 already exported `clearAllFacetFilters` as a plain store function (not inline component logic), so Browse.tsx imports and calls it directly — the same handler FacetPanel's own "Clear filters" button already uses.
- No React component-rendering test infra exists in this repo (vitest is configured with `environment: "node"`, no jsdom/RTL) — an explicit, repeated convention from prior stories' review notes (e.g. 3.2's deferred "no component-level test for PhotoGridCell"). Followed that precedent: unit-tested the new pure/derived logic (`hasActiveFacetFilters`) and verified the actual rendered behavior live instead of adding component-test infra.
- Live verification: started the Vite dev server, generated 3 synthetic EXIF JPEGs via Python/Pillow+piexif (distinct lens/ISO/aperture/camera/year per photo, cached Playwright/Chromium available via `npx` — no new repo dependency added), drove the real ingest → ingested 3 readable photos, toggled the Lens and ISO sliders to an exact-value combination that exists individually in the data but never together (lens=24mm only co-occurs with iso=100, never iso=3200) — confirmed "No photos match these filters." + a "Clear filters" button render with zero stray grid content, zero console errors, then clicked Browse's own "Clear filters" entry point and confirmed all 3 photos reappear. Screenshots taken confirm the empty-filtered box (bordered message + button) reads as clearly distinct from Story 2.1's full-screen hero empty-state and from Insights' plain-text-only "No matching photos." message (out of this story's scope but read for the distinctness comparison).

### Completion Notes List

- Added `hasActiveFacetFilters` (pure) + `useHasActiveFacetFilters` (selector hook) to `ingestStore.ts`, unit-tested (7 new Vitest cases after the review pass) — the "is any Facet non-default" check the Dev Notes referenced but which didn't actually exist yet.
- `Browse.tsx` renders one of three states off a single `// BROWSE` eyebrow wrapper: the ordinary grid; "No photos match these filters." + a "Clear filters" `Button` (reusing `clearAllFacetFilters` directly) when `readablePhotoCount > 0 && photos.length === 0 && hasActiveFilters`; or — added during code review, per user decision — "No readable photos." + an unreadable-count note (no Clear-filters action) when `readablePhotoCount === 0`, closing the gap Story 3.2's review had deferred to this story. Both messages are `aria-live="polite"`.
- Project Structure Notes said this story "touches only `apps/gallery/src/features/browse/`"; `ingestStore.ts` also needed a small addition since the referenced active-filter check didn't exist anywhere yet — this is the same shared store Story 3.3 already put all Facet-filter state in (AD-3), not a scope expansion beyond what the Dev Notes actually required.
- Code review (Blind Hunter + Edge Case Hunter + Acceptance Auditor): 1 decision (patched per user), 3 patches applied (test coverage, eyebrow-markup dedup, aria-live), 2 deferred (no component-test infra — pre-existing repo convention; hardcoded-8-Facets exhaustiveness — mirrors Story 3.3's pre-existing pattern), 9 dismissed as noise (verified false positives once checked against actual source: `camera` field type/default, unreachable NaN path, untested trivial hook wrapper matching existing convention, several process/meta observations, cosmetic punctuation).
- turbo lint/build/test all pass (77/77 Vitest tests); live-verified via Playwright against synthetic Pillow-generated EXIF fixtures for all three Browse states (grid, filtered-empty, all-unreadable) — zero console errors in any case.

### File List

- `apps/gallery/src/store/ingestStore.ts` (modified — `hasActiveFacetFilters`, `useHasActiveFacetFilters`)
- `apps/gallery/src/store/ingestStore.test.ts` (modified — 7 new tests for `hasActiveFacetFilters`)
- `apps/gallery/src/features/browse/Browse.tsx` (modified — 3-way empty-state handling: grid / filtered-empty / all-unreadable, single eyebrow wrapper, aria-live on both messages)

## Change Log

- 2026-07-08: Implemented Story 3.4 — empty-filtered message + Clear-filters entry point in Browse.tsx, backed by a new `hasActiveFacetFilters` derived-state check in the shared ingest store (the check Dev Notes assumed existed but hadn't been built). turbo lint/build/test clean (76/76 tests); live-verified via Playwright against synthetic EXIF fixtures.
- 2026-07-08: Code review pass — added the previously-missing "all-unreadable" message to Browse (user decision, closing a gap Story 3.2's review had deferred to this story), deduplicated the eyebrow markup, added `aria-live="polite"` to both messages, and expanded `hasActiveFacetFilters` test coverage. turbo lint/build/test clean (77/77 tests); live-verified via Playwright for all three Browse states.
