---
baseline_commit: 9ec1929309ddd59e7ddd18c90b79772cc5c625c1
---

# Story 3.1: UnderlineTabs — Insights/Browse Split

Status: done

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

- [x] Task 1: Tab mechanism with dual-mount state preservation (AC: #1, #2)
  - [x] Render `UnderlineTabs` (`ariaLabel`, `current`, `onSelect`, `tabs=[{id:'insights',label:'Insights'},{id:'browse',label:'Browse'}]`, default `baseline`) directly under `Header-bar` — see Dev Notes on why `baseline={false}` is wrong here
  - [x] Both `insights/` and `browse/` panels stay mounted at all times; only the inactive one is visually hidden — per Dev Notes, this is what preserves scroll position across switches without extra code
  - [x] `app-shell`: replace the "Insights as single view" state with "Header-bar + UnderlineTabs(Insights, Browse)"
- [x] Task 2: AD-3 import-boundary lint rule (AC: #3)
  - [x] Extend Story 1.3's boundary-rule config (`packages/eslint-config`) with the `insights/`/`browse/` element types now that they hold real content: `insights/` may import `store` selectors (only `useReadablePhotos`, `useUnreadableCount`) and `packages/ui`, never `browse/`; `browse/` may not import from `insights/`
  - [x] Verify it fails on a deliberately-introduced violation (e.g. a throwaway `insights/` import of a Browse-only selector), then revert
- [x] Task 3: Browse placeholder content (AC: #1)
  - [x] Since Stories 3.2/3.3 haven't built the grid/facet-panel yet, render a minimal placeholder in the Browse panel for this story only (e.g. a plain "Browse" heading) — leave a code comment pointing at Story 3.2 as the story that replaces it
- [x] Task 4: Verify (AC: #1, #2, #3)
  - [x] Switch tabs, scroll Insights down, switch to Browse and back — confirm Insights' scroll position survived
  - [x] Confirm the new lint rule fails when `insights/` imports something Browse-only, and passes otherwise
  - [x] Confirm Insights' rendered numbers are identical regardless of Browse tab's (currently placeholder) content

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

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx eslint src/features/insights/Insights.tsx` with a throwaway `import { Browse } from "../browse/Browse"` added at the top — confirmed `boundaries/dependencies` fails with "There is no policy allowing dependencies from elements of type \"insights\" to elements of type \"browse\"", then reverted (`git status --short` clean after).
- Same check in reverse on `Browse.tsx` importing `Insights` — failed with the symmetric "browse\" to elements of type \"insights\"" message, then reverted.
- `pnpm --filter @bmad/gallery lint` / `test` / `build` all pass after the revert; workspace-wide `npx turbo lint build test` — 10/10 tasks pass (gallery, landing, packages/ui all green), confirming the new `insights`/`browse` element types don't affect `apps/landing` (no matching folders there) or `packages/ui`'s existing AD-1 boundary.

### Completion Notes List

- Implemented the `UnderlineTabs` tab mechanism directly under `Header-bar` (`app-shell/App.tsx`), replacing the prior "Insights as single view" gate with "Header-bar + UnderlineTabs(Insights, Browse)". Kept the default `baseline={true}` per Dev Notes (real mockups show `.tabs` drawing its own rule distinct from Header-bar's `--m-line`).
- Both tab panels stay permanently mounted; only the inactive one is hidden via the native `hidden` attribute. Critically, each panel wraps its content in its own `min-h-0 flex-1 overflow-y-auto` region inside a `h-screen flex-col` shell — this (not just dual-mounting alone) is what actually preserves Insights' scroll position: `scrollTop` lives on that specific DOM node and survives `display:none`, whereas a page/document-level scroll would get reset/clamped by the browser whenever the visible tab's content is shorter than the previous one (Browse's placeholder is much shorter than a populated Insights view).
- Built the AD-3 import-boundary rule in `packages/eslint-config/src/boundaries.js`: two new `eslint-plugin-boundaries` element types, `insights` (`apps/*/src/features/insights`) and `browse` (`apps/*/src/features/browse`), listed ahead of the generic `app` catch-all so files under those folders classify distinctly rather than falling through. `insights`/`browse` may each import the generic `app` element (this is how `insights/` legitimately reaches the Zustand store's `useReadablePhotos`/`useUnreadableCount` and `worker/types`'s `Photo` type, both of which live under the `app` catch-all) plus `packages/ui` through its published entry, but neither may import the other — enforced by the plugin's `default: "disallow"` since no policy grants it. `eslint-plugin-boundaries` matches at the file/element level, not individual named exports, so "only `useReadablePhotos`/`useUnreadableCount`" is a documented invariant rather than a specifier-level lint check; there is nothing under `browse/` to misuse yet (Story 3.3 builds `useFilteredPhotos`/`useFacetFilters` later), and the folder-level rule is what AC #3 actually requires and what Task 2's own verification step tests.
- Added `features/browse/Browse.tsx` as a minimal placeholder panel (removed the `.gitkeep`), with a comment pointing at Story 3.2 as its replacement.
- Verified the lint rule fails/passes correctly by introducing and reverting throwaway violations in both directions (see Debug Log References). Insights' rendered numbers are unaffected by the Browse tab by construction — `Insights.tsx` is untouched from Story 2.4 and reads only `useReadablePhotos()`/`useUnreadableCount()`; Browse's placeholder makes no store reads at all, and the new lint rule now prevents that from ever changing without also tripping AD-3.
- No browser-automation tooling was available this session, so the scroll-preservation behavior (Task 4's first verify item) was confirmed via code/CSS-level reasoning (own-scroll-region-per-panel, as above) rather than a live Playwright run — matching the same gap noted in Story 2.3's Dev Agent Record. `turbo lint`/`build`/`test` all pass with zero regressions (38 existing Vitest tests untouched — this story added no new pure-logic units, so no new tests were added).
- **Unplanned fixes, found via user testing (not original Tasks):** live testing surfaced two real defects in this story's own new UI, both now fixed:
  1. Dark mode never reached the page outside components that explicitly set `bg-bg` (e.g. Header-bar) — neither `packages/theme` nor `index.html`'s flash-prevention script ever paints an actual background; `.dark` only flips the `--m-*` custom-property *values*. Fixed with a base `html, body { background-color: var(--m-bg); color: var(--m-fg); }` rule in `apps/gallery/src/app-shell/app.css` (using the raw `--m-*` token, not the Tailwind-facing `--color-*` alias, per `packages/eslint-config`'s `stylelint-declaration-strict-value` rule, which only whitelists `var(--m-*)`).
  2. The Tabs row's labels sat flush against Header-bar's bottom rule with no breathing room. Traced to `UnderlineTabs.tsx` (`packages/ui`, shared): its tab buttons only had `pb-3` (bottom padding), no top padding at all — the reference mockup's `.tab` rule uses symmetric `padding: 14px 2px`. Fixed by changing `pb-3` → `py-3` on the tab button.
  - An earlier attempt in this session also swapped `Insights.tsx`'s `max-w-article-max` for `max-w-container-max`, reasoning from `DESIGN.md`'s note that `article-max` is "not used by this suite directly" — the user clarified that wasn't the padding issue they meant, so that change was reverted; `Insights.tsx`/`Browse.tsx` are back to `max-w-article-max`, unchanged from Story 2.4.

### File List

- `apps/gallery/src/app-shell/App.tsx` (modified — `UnderlineTabs` mechanism, dual-mounted Insights/Browse panels each in their own scroll region, `h-screen flex-col` shell)
- `apps/gallery/src/features/browse/Browse.tsx` (new — placeholder Browse panel)
- `apps/gallery/src/features/browse/.gitkeep` (deleted — superseded by real content)
- `packages/eslint-config/src/boundaries.js` (modified — AD-3 `insights`/`browse` element types + import-boundary policies)
- `apps/gallery/src/app-shell/app.css` (modified — base `html, body` theme background/color rule)
- `packages/ui/src/UnderlineTabs/UnderlineTabs.tsx` (modified — `pb-3` → `py-3` on the tab button for symmetric top/bottom padding; post-completion round 2 — added `cursor-pointer` to the tab `<button>`, a real missing-hover-affordance bug)

## Change Log

- 2026-07-08: Implemented Story 3.1 — `UnderlineTabs` Insights/Browse split with dual-mounted, independently-scrolling panels; AD-3 `insights`/`browse` import-boundary lint rule (deferred from Story 1.3); Browse placeholder panel. `turbo lint`/`build`/`test` all pass (10/10 tasks); no browser-automation tooling available this session, so scroll-preservation was verified via code/CSS-level reasoning rather than a live Playwright run.
- 2026-07-08: Fixed two user-reported defects from live testing — dark mode not reaching the page background outside Header-bar (added a base `html, body` rule in `apps/gallery/src/app-shell/app.css`), and no top padding on the Tabs row's labels (fixed `UnderlineTabs.tsx`'s tab button padding from `pb-3` to `py-3`). Re-verified `turbo lint`/`build`/`test` clean (10/10 tasks).
- 2026-07-08 — Post-completion fix-up round 2 (user report) — real bug: the Browse/Insights tab buttons gave no cursor feedback at all, the default browser cursor stayed on hover with nothing signaling they're clickable. Added `cursor-pointer` to `UnderlineTabs`' tab `<button>` — benefits every consumer of this shared `packages/ui` component, not just this app. `turbo lint/build/test` clean; live-verified via Playwright (`getComputedStyle(...).cursor === "pointer"`).
