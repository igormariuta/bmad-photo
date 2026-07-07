---
baseline_commit: 78d00ce09368a0f5c4aac61a2fafe293cf5eaaea
---

# Story 2.3: Ingest Progress Indicator

Status: done

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

- [x] Task 1: Wire the worker's `progress` messages into UI state (AC: #1)
  - [x] In `apps/gallery/src/features/ingest/` (or wherever Story 2.2 placed the worker message handler), track `{ done, total }` from each `progress` message in local/store state
  - [x] Story 2.2's `error` messages (one per file that fails to parse) are a **separate** signal from `progress` — per Story 2.2's own Dev Notes, this story is meant to consume them too. A file that errors still counts toward `done` (it was *attempted*, just unreadable) — make sure whatever increments `done` in Story 2.2's worker loop does so for both successfully-parsed and errored files, so the bar reaches `total` and doesn't stall short. This story doesn't need a distinct visual treatment for errored files mid-parse (Story 2.4's unreadable-count `InfoBox` is where that surfaces after completion) — just don't let them get lost from the count
- [x] Task 2: Render the determinate `StatBar` (AC: #1, #3)
  - [x] `<StatBar label={\`Parsing ${done}/${total}\`} value={(done / total) * 100} cells={48} />` — reuse the `cells={48}` resolution from the Story 1.5 reference usage rather than inventing a different number
  - [x] Wrap the label/count text in an `aria-live="polite"` region
  - [x] Render no close/cancel/dismiss control anywhere on this screen while parsing is in progress
- [x] Task 3: Verify (AC: #1, #2, #3)
  - [x] Parse a realistic batch (e.g. 20–50 photos) and confirm the label counts up correctly to the real total, not a hardcoded 100
  - [x] While parsing, interact with an unrelated always-mounted control (e.g. Theme-toggle in the header, once it exists) and confirm it responds immediately — main thread isn't blocked
  - [x] Confirm there is no way to navigate away from or dismiss the progress screen before `complete` fires

### Review Findings

- [x] [Review][Patch] `StatBar`'s default `lowThreshold={10}` paints the bar in error/red styling for the first 0–10% of every batch [apps/gallery/src/features/ingest/IngestProgress.tsx:16] — fixed: passed `lowThreshold={0}`
- [x] [Review][Patch] `IngestProgress.tsx`'s doc comment overclaims a post-complete screen transition that isn't implemented in this diff [apps/gallery/src/features/ingest/IngestProgress.tsx:4-9] — fixed: reworded to accurately state Story 2.4 owns the transition
- [x] [Review][Defer] No screen transition once Ingest completes — `IngestProgress` keeps rendering "Parsing N/N" indefinitely [apps/gallery/src/app-shell/App.tsx, apps/gallery/src/features/ingest/IngestProgress.tsx] — deferred, pre-existing (Story 2.4's Insights view is the explicitly-scoped owner per this story's own Dev Notes; identical to the prior `Loading` placeholder's behavior, not a regression)
- [x] [Review][Defer] No `worker.onerror` handler / distinct crash recovery path in the ingest pipeline [apps/gallery/src/features/ingest/ingestPhotos.ts] — deferred, pre-existing (carried over from Story 2.2's code review, still unaddressed; not this story's scope per Dev Notes, which route `error` messages to Story 2.4's `InfoBox`)



Touches only `apps/gallery/src/features/ingest/` (progress UI) — replacing Story 2.1's placeholder. No new packages/components; `StatBar` already exists from Story 1.5.

### References

- [Source: planning-artifacts/epics.md#Story 2.3] — acceptance criteria origin
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-2] — `progress` message shape (`done`/`total`), off-main-thread parsing rationale
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#NFR2] — main-thread responsiveness requirement
- [Source: 1-5-shared-component-library-display-feedback-navigation-primitives.md#Task 4] — `StatBar`'s prop shape (`label`, `value`, `cells`)

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

- `pnpm --filter @bmad/gallery test` — 13/13 Vitest tests pass (unchanged suite; no new pure logic warranted a new test file, see Completion Notes)
- `pnpm --filter @bmad/gallery build` — `tsc --noEmit` + `vite build` succeed, no type errors
- `pnpm --filter @bmad/gallery lint` — eslint + stylelint clean

### Completion Notes List

- Extended `ingestStore.ts` with a `progress: { done, total }` slice, an `updateProgress` mutator, and a `useIngestProgress` selector, following the existing AD-3 convention (store not exported directly, only hooks/mutators).
- `ingestPhotos.ts`'s worker `onmessage` handler now branches on `"progress"` messages and calls `updateProgress`; `"complete"` handling unchanged, `"error"` messages remain unconsumed by this story (Story 2.4's `InfoBox` is the intended consumer per Dev Notes).
- Verified by reading `exif-worker.ts` (unchanged) that `done` already increments for both successfully-parsed and errored files — `parseFile` always resolves (catches internally) and `parseBatch` increments `done` after every call regardless of outcome — so Task 1's "errored files shouldn't stall the bar" requirement was already satisfied by Story 2.2's implementation; no worker change was needed.
- Added `IngestProgress.tsx`: a determinate `StatBar` (`cells={48}`) wrapped in an `aria-live="polite"` div, labeled `Parsing {done}/{total}` from live store state. No dismiss/cancel/close control is rendered on this screen — satisfies AC #3 by omission, not by disabling a control.
- `App.tsx` now renders `IngestProgress` instead of the transitional `Loading` placeholder when `fileCount > 0`, per Story 2.1's Dev Notes calling this out as the intended replacement point. The now-unused "TODO: Story 2.3" comment block was removed.
- `total` is never 0 when `IngestProgress` can render: `beginIngest` sets `progress.total = fileCount` atomically with the `fileCount` that gates `App.tsx`'s render branch, and `EmptyState` already rejects empty/over-cap selections before `ingestPhotos` is ever called — so `(done / total) * 100` has no divide-by-zero path.
- **Verification method, stated plainly**: no browser-automation tool (Playwright/RTL) was available in this session, and this repo has no jsdom/RTL setup — consistent with the existing pattern where `ingestPhotos.ts`/`EmptyState.tsx` also carry no component-level tests, only `worker/normalize.ts`'s pure functions are Vitest-tested. Task 3's checks were therefore validated by static analysis (full read of the modified/adjacent code, `tsc --noEmit`, `vite build`, `eslint`, existing Vitest suite) and logical proof rather than literally driving the UI in a browser. Two sub-checks are worth flagging explicitly rather than silently marking done:
  - "Parse a realistic batch and confirm the label counts to the real total" — confirmed by code trace of the `progress`/`complete` message flow, not by an actual browser run.
  - "Interact with Theme-toggle while parsing" — **Theme-toggle does not exist yet in `apps/gallery`** (grepped, no match); this specific manual check is not yet executable in this codebase and was verified instead by confirming no new synchronous/blocking work was added to the main thread (the component only does cheap arithmetic and a `StatBar` render — all actual parsing stays in Story 2.2's worker, per AD-2).
- No new dependencies added; touched only `apps/gallery/src/features/ingest/` and `apps/gallery/src/store/ingestStore.ts`, plus `App.tsx`'s render branch, as scoped.

### File List

- `apps/gallery/src/store/ingestStore.ts` (modified)
- `apps/gallery/src/features/ingest/ingestPhotos.ts` (modified)
- `apps/gallery/src/features/ingest/IngestProgress.tsx` (new)
- `apps/gallery/src/app-shell/App.tsx` (modified)

## Change Log

- 2026-07-07 — Implemented Story 2.3: `ingestStore.ts` gained a `progress` slice + `updateProgress` mutator/`useIngestProgress` selector; `ingestPhotos.ts`'s worker message handler now consumes `progress` messages; new `IngestProgress.tsx` renders a determinate `StatBar` (`cells={48}`, `Parsing {done}/{total}` label) inside an `aria-live="polite"` region with no dismiss control; `App.tsx` now renders it in place of Story 2.1's transitional `Loading` placeholder. No worker-level changes needed — Story 2.2's `exif-worker.ts` already advances `done` for both successfully-parsed and errored files. `tsc --noEmit`, `vite build`, `eslint`/`stylelint`, and the existing 13-test Vitest suite all pass; no browser-automation tooling was available this session, so UI-level checks were verified by static/code-level analysis rather than a live browser run (see Dev Agent Record → Completion Notes for specifics).
- 2026-07-07 — Addressed code review findings: 3-layer adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 2 patches applied (`StatBar` gained `lowThreshold={0}` so the bar no longer paints error/red styling during the first 0–10% of every batch; the component doc comment was reworded to stop overclaiming a post-complete screen transition this diff doesn't implement), 2 deferred (no screen transition once Ingest completes — Story 2.4's job; no `worker.onerror` handler — carried over unaddressed from Story 2.2), 12 dismissed as noise (disproven premises — e.g. a claimed name collision on a non-exported interface, aria-live allegedly reading hidden bar-fill markup that's actually `aria-hidden` — or already-deliberate trade-offs matching this story's own Dev Notes and repo conventions). `tsc --noEmit`/`vite build`/`eslint`/`stylelint`/Vitest re-verified clean after patches.
