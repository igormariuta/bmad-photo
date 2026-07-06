# Story 2.3: Ingest Progress Indicator

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want to see parsing progress while my batch is processed,
so that I know the app is working and the interface stays responsive.

## Acceptance Criteria

1. **Given** an Ingest batch is being parsed, **when** progress updates arrive from the worker, **then** a determinate `StatBar` shows "Parsing N/100" with a filling block-bar, announced via `aria-live="polite"`. [Source: planning-artifacts/epics.md#Story 2.3]
2. **Given** a realistic batch size, **when** parsing is in progress, **then** the main thread stays responsive (NFR2). [Source: planning-artifacts/prds/prd-BMAD/prd.md#NFR2]
3. **Given** the progress indicator is showing, **when** the user attempts to dismiss it early, **then** it cannot be dismissed — content becomes interactive only once Ingest completes. [Source: planning-artifacts/epics.md#Story 2.3]

## Dev Notes

- **Depends on Story 2.2** (the worker's `progress` messages: `{ done: number; total: number }`) and Story 1.5's `StatBar` (the gap-fill addition built there specifically for this story).
- **This story replaces Story 2.1's `Loading` placeholder** with the real progress UI — that placeholder was explicitly temporary; remove it and its "TODO: Story 2.3" comment now.
- **"Parsing N/100" in the AC text is illustrative, not a literal hardcoded 100.** Batches can be any size up to the 100-photo cap (Story 2.1's cap check). Use the worker's actual `progress.total` for both the label and `StatBar`'s `cells`/denominator — a 42-photo batch reads "Parsing 12/42", not "Parsing 12/100". Don't hardcode the number 100 anywhere in this component.
- **AC #2 (main thread stays responsive) isn't a new mechanism this story builds** — it's a consequence of Story 2.2 already doing all parsing inside a Web Worker (AD-2). This story's own job is just to render the `progress` messages as they arrive; verify responsiveness by interacting with the UI (e.g. toggling Theme-toggle) while a batch parses, not by adding new code.
- **"Cannot be dismissed early" means literally no close/cancel affordance renders during parsing** — not a disabled button, an *absent* one. The screen only changes once the worker's `complete` message arrives (handled by whatever Story 2.2 wired the completion transition to — Story 2.4's Insights view becomes reachable at that point).
- **`aria-live="polite"`** should wrap the count text (e.g. "Parsing 12/42") specifically, so screen readers announce each update without interrupting other activity — not `assertive`, which would be disruptive for something this frequent.

## Tasks / Subtasks

- [ ] Task 1: Wire the worker's `progress` messages into UI state (AC: #1)
  - [ ] In `apps/gallery/src/features/ingest/` (or wherever Story 2.2 placed the worker message handler), track `{ done, total }` from each `progress` message in local/store state
  - [ ] Story 2.2's `error` messages (one per file that fails to parse) are a **separate** signal from `progress` — per Story 2.2's own Dev Notes, this story is meant to consume them too. A file that errors still counts toward `done` (it was *attempted*, just unreadable) — make sure whatever increments `done` in Story 2.2's worker loop does so for both successfully-parsed and errored files, so the bar reaches `total` and doesn't stall short. This story doesn't need a distinct visual treatment for errored files mid-parse (Story 2.4's unreadable-count `InfoBox` is where that surfaces after completion) — just don't let them get lost from the count
- [ ] Task 2: Render the determinate `StatBar` (AC: #1, #3)
  - [ ] `<StatBar label={\`Parsing ${done}/${total}\`} value={(done / total) * 100} cells={48} />` — reuse the `cells={48}` resolution from the Story 1.5 reference usage rather than inventing a different number
  - [ ] Wrap the label/count text in an `aria-live="polite"` region
  - [ ] Render no close/cancel/dismiss control anywhere on this screen while parsing is in progress
- [ ] Task 3: Verify (AC: #1, #2, #3)
  - [ ] Parse a realistic batch (e.g. 20–50 photos) and confirm the label counts up correctly to the real total, not a hardcoded 100
  - [ ] While parsing, interact with an unrelated always-mounted control (e.g. Theme-toggle in the header, once it exists) and confirm it responds immediately — main thread isn't blocked
  - [ ] Confirm there is no way to navigate away from or dismiss the progress screen before `complete` fires

## Project Structure Notes

Touches only `apps/gallery/src/features/ingest/` (progress UI) — replacing Story 2.1's placeholder. No new packages/components; `StatBar` already exists from Story 1.5.

### References

- [Source: planning-artifacts/epics.md#Story 2.3] — acceptance criteria origin
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-2] — `progress` message shape (`done`/`total`), off-main-thread parsing rationale
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#NFR2] — main-thread responsiveness requirement
- [Source: 1-5-shared-component-library-display-feedback-navigation-primitives.md#Task 4] — `StatBar`'s prop shape (`label`, `value`, `cells`)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
