# Story 3.1: UnderlineTabs — Insights/Browse Split

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want to switch between Insights and Browse without losing my place in either,
so that I can explore my library without disrupting my habits overview.

## Acceptance Criteria

1. **Given** Epic 2's single Insights view, **when** Browse is introduced, **then** an `UnderlineTabs` control adds Insights and Browse as two tabs. [Source: planning-artifacts/epics.md#Story 3.1]
2. **Given** the user switches tabs, **when** they return to a previously-visited tab, **then** scroll position and active Facet filters are preserved independently per tab. [Source: planning-artifacts/epics.md#Story 3.1]
3. **Given** Browse's Facet filters are active, **when** Insights renders, **then** Insights is unaffected — it always reflects the full readable set (AD-3: `insights/` may import only `useReadablePhotos`/`useUnreadableCount`, never Browse's selectors, enforced by the eslint import-boundary rule). [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-3]

## Dev Notes — read this first

**Epic 3 is blocked-by/sequenced-after Epic 2** (per epics.md) — this is Epic 3's first story, and like Epic 2's early stories, it deliberately doesn't deliver a fully-populated Browse experience yet. The Photo Grid (Story 3.2) and Facet Panel (Story 3.3) don't exist yet; this story's job is the **tab mechanism, state-preservation infrastructure, the selector layer, and the deferred import-boundary lint rule** — Browse's own tab content is a placeholder until 3.2/3.3 land.

- **No client-side router exists in this app** (architecture is explicit: "Gallery's Insights/Browse are `UnderlineTabs`-driven local state, not routes"). This has a real technical consequence for AC #2: **don't conditionally render only the active tab's content** (`{tab === 'insights' && <Insights/>}`) — that unmounts the inactive tab and loses its scroll position on every switch. Instead, **keep both tab panels mounted simultaneously**, toggling visibility only (e.g. CSS `hidden`/`display: none`, or an off-screen/inert technique). Note this specifically fixes *scroll position* — Facet-filter state (Story 3.3) lives in the Zustand store, outside the React tree, so it would survive a tab switch regardless of mount strategy; scroll position is the actual reason dual-mounting is required here.
- **`UnderlineTabs` keeps its default `baseline={true}` here — do not set `baseline={false}`.** An earlier draft of this story reasoned that Header-bar's own `--m-line` rule would make a second rule redundant, citing the reference component's generic doc note. The real mockups (`mockups/gallery-insights.html`, `gallery-browse.html`) settle this concretely: the `.tabs` nav renders directly under `.header-bar` with its **own** `2px solid var(--m-dim)` bottom border, a visually distinct (lighter) rule from Header-bar's `--m-line` divider — the two coexist by design in this product, they're not the same line. Use the default.
- **Do NOT build `useFacetFilters()`/`useFilteredPhotos()` here.** An earlier draft of this story built them early on the theory that Story 3.2 would need "something" to render — that was wrong and has been corrected: Story 2.2 already assigned this pair to Story 3.3 explicitly (flagging early construction as premature per SM-C1), and epics.md's own Story 3.2 AC only requires rendering "the full readable set" — which `useReadablePhotos()` (built in Story 2.2) already provides on its own. Story 3.2 consumes `useReadablePhotos()` directly; Story 3.3 is where the Facet-filter store slot and both selectors get built for real, at the same time Story 3.3 swaps Browse's grid over to `useFilteredPhotos()`.
- **Finish what Story 1.3 deferred:** Story 1.3 (Task 6) built the AD-1 package-direction import-boundary rule but explicitly deferred AD-3's finer `insights/`-vs-`browse/` selector boundary to this story, since the folders had no real content until now. Build that rule here — `insights/` may import only `useReadablePhotos()`/`useUnreadableCount()` (plus `packages/ui`), never anything from `browse/`; `browse/` may not import from `insights/`.
- **`app-shell`'s gating logic changes shape, not just grows a case:** Story 2.4 left it at 3 states (empty-state / progress / header+Insights-as-single-view). The third state now becomes "header + `UnderlineTabs`(Insights, Browse)" — Insights' content itself doesn't change, it just moves under a tab.

## Tasks / Subtasks

- [ ] Task 1: Tab mechanism with dual-mount state preservation (AC: #1, #2)
  - [ ] Render `UnderlineTabs` (`ariaLabel`, `current`, `onSelect`, `tabs=[{id:'insights',label:'Insights'},{id:'browse',label:'Browse'}]`, default `baseline`) directly under `Header-bar` — see Dev Notes on why `baseline={false}` is wrong here
  - [ ] Both `insights/` and `browse/` panels stay mounted at all times; only the inactive one is visually hidden — per Dev Notes, this is what preserves scroll position across switches without extra code
  - [ ] `app-shell`: replace the "Insights as single view" state with "Header-bar + UnderlineTabs(Insights, Browse)"
- [ ] Task 2: AD-3 import-boundary lint rule (AC: #3)
  - [ ] Extend Story 1.3's boundary-rule config (`packages/eslint-config`) with the `insights/`/`browse/` element types now that they hold real content: `insights/` may import `store` selectors (only `useReadablePhotos`, `useUnreadableCount`) and `packages/ui`, never `browse/`; `browse/` may not import from `insights/`
  - [ ] Verify it fails on a deliberately-introduced violation (e.g. a throwaway `insights/` import of a Browse-only selector), then revert
- [ ] Task 3: Browse placeholder content (AC: #1)
  - [ ] Since Stories 3.2/3.3 haven't built the grid/facet-panel yet, render a minimal placeholder in the Browse panel for this story only (e.g. a plain "Browse" heading) — leave a code comment pointing at Story 3.2 as the story that replaces it
- [ ] Task 4: Verify (AC: #1, #2, #3)
  - [ ] Switch tabs, scroll Insights down, switch to Browse and back — confirm Insights' scroll position survived
  - [ ] Confirm the new lint rule fails when `insights/` imports something Browse-only, and passes otherwise
  - [ ] Confirm Insights' rendered numbers are identical regardless of Browse tab's (currently placeholder) content

## Project Structure Notes

```text
apps/gallery/src/
  app-shell/          # gains: UnderlineTabs-driven Insights/Browse layout
  features/browse/    # gains: placeholder panel (real content in 3.2/3.3)
packages/eslint-config/  # gains: insights/browse import-boundary rule (deferred from 1.3)
```

### References

- [Source: planning-artifacts/epics.md#Story 3.1, #Epic 3 intro] — acceptance criteria, "blocked by Epic 2" sequencing note
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-3] — full selector set, import-boundary rule definition
- [Source: 1-3-token-usage-lint-enforcement.md#Task 6] — where the AD-3 half of the import-boundary rule was deferred to this story
- [Source: ux-designs/ux-BMAD/mockups/gallery-insights.html, gallery-browse.html] — real tabs markup/CSS confirming default `baseline` is correct here, not `false`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
