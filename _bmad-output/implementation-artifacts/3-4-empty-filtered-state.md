# Story 3.4: Empty Filtered State

Status: ready-for-dev

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

- [ ] Task 1: Empty-filtered message (AC: #1, #2)
  - [ ] In the Browse grid region, when the trigger condition (Dev Notes) holds, replace the grid with a message — *"No photos match these filters."* — and a `Button` labeled "Clear filters" wired to Story 3.3's existing clear-all handler
  - [ ] Copy and layout must read as visually/textually distinct from Story 2.1's empty-state (different heading, no privacy-promise copy, no "Add photos" primary action — this is a narrowing problem, not a first-run problem)
- [ ] Task 2: Verify (AC: #1, #2)
  - [ ] Apply a Facet combination that matches zero photos — confirm the message + Clear-filters action appear, and the grid is otherwise empty of stray content
  - [ ] Trigger Story 2.1's true empty-state and this state side by side (or in sequence) — confirm they're readable as clearly different situations, not the same screen with a different count

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

### Debug Log References

### Completion Notes List

### File List
