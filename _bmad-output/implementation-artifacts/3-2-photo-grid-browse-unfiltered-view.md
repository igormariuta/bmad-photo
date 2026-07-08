---
baseline_commit: b4ac416e2db6bfceda0d4b58bb616486ccc8d6f5
---

# Story 3.2: Photo Grid (Browse) — Unfiltered View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want to see my ingested photos as a browsable grid,
so that I can visually scan my library.

## Acceptance Criteria

1. **Given** the Browse tab with no filters applied, **when** it renders, **then** it shows the full readable set as a grid of Photo-grid-cell tiles — square, 2px border, no radius. [Source: planning-artifacts/epics.md#Story 3.2]
2. **Given** a grid cell, **when** it renders, **then** it shows an EXIF badge below the thumbnail with exactly three fields, in order: `focalLengthMm` (as lens label) · `apertureF` · `iso`. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4]
3. **Given** an unreadable photo, **when** the grid renders, **then** that photo is excluded entirely, never rendered as a cell. [Source: planning-artifacts/epics.md#Story 3.2]
4. **Given** different viewport widths, **when** the grid renders, **then** it shows 2 columns below `sm`, scales columns between `sm`–`lg`, and gains a persistent sidebar layout at `≥lg`. [Source: ux-designs/ux-BMAD/DESIGN.md#Layout & Spacing]

## Dev Notes — read this first

- **Depends on Story 3.1** (the tab mechanism this story's grid lives inside).
- **`Photo-grid-cell` (UX-DR7, "New") is Gallery-local**, not `packages/ui` — Browse is its only consumer anywhere in this project (FR-2's single-consumer rule).
- **Build a minimal `useFilteredPhotos()` now, but keep it a trivial pass-through — don't build the Facet-filter store or any real filtering logic yet.** AD-3 is explicit that `browse/` components' *only* input is `useFacetFilters()`/`useFilteredPhotos()` — `browse/` isn't supposed to reach `useReadablePhotos()` directly, even though `insights/` does. But building the full Facet-filter system now, before Story 3.3's Facet-panel exists to populate it, would be speculative ahead of need (SM-C1). The resolution: `useFilteredPhotos()` exists starting now, satisfying AD-3's import-boundary contract, but its body is just `() => useReadablePhotos()` — an alias, no filter state, no `facetFilters` store slot. Story 3.3 is what replaces this alias with real filtering logic and adds the store slot; that's a body-only change to an already-existing, already-consumed selector, not a grid restructure.
- **The grid must reserve layout space for the Facet-panel sidebar at `≥lg` now, even though Story 3.3 builds the panel's actual content.** Restructuring the grid's container layout a second time in 3.3 would be wasted work — build the two-region page layout (grid + a sidebar slot) here, leave the sidebar slot empty/placeholder, and let 3.3 fill it in.
- **Column counts are now confirmed by the real mockup (`mockups/gallery-browse.html`), not an invented assumption.** DESIGN.md itself flags exact breakpoints as unspecified, but the mockup settles it with a simple 2-tier scheme: `grid-template-columns: repeat(2, 1fr)` below `900px`, `repeat(4, 1fr)` at `≥900px` (alongside the persistent sidebar). This corrects an earlier draft of this story, which invented a more granular 4-tier column scheme (2/3/4/4–5) with no source — use the mockup's simpler 2-tier scheme instead. Treat `900px` as approximately this project's `lg` breakpoint.
- **Sidebar width is also confirmed: a fixed `260px`** (`flex: 0 0 260px` in the mockup), not a proportional/fluid width — reserve exactly this in Story 3.2's layout region even though Story 3.3 fills its content. Sidebar background is `--m-panel` (not `--m-card`), with a 2px `--m-dim` border and 20px padding.
- **Cell gap is `--m-space-item-gap` (28px)** — DESIGN.md is explicit this is the "repeating item" spacing rule, not `section-rhythm`.
- **UX-DR15 requires `<button>`-semantic cells with an `aria-label` naming at least the capture date — build that now, even though the click handler that opens Photo-detail-modal is Story 3.5's job.** Render the cell as a real `<button>` element with a correct `aria-label` (e.g. derived from `capturedAt`); leave its `onClick` a no-op (or omitted) for this story, with a comment pointing at Story 3.5.
- **EXIF badge format:** `Dot`-separated (Story 1.5), matching the architecture's own example exactly: `"24mm · f/1.8 · ISO 200"` — i.e. `{lensLabel}` (already `"24mm"`-formatted, not `focalLengthMm` raw) · `f/{apertureF}` · `ISO {iso}`. Exactly these three fields, in exactly this order — no more, no fewer, per AD-4.
- **`[ASSUMPTION]` Missing-field fallback:** AD-4 marks `lensLabel`, `apertureF`, `iso`, and `capturedAt` all optional — a `readable: true` photo can still be missing any individual one. Neither epics.md nor the architecture says what the badge or `aria-label` should show when a badge field is `undefined`. Render a plain placeholder for that one segment (e.g. `"—"`) rather than the literal string `"undefined"`; for the `aria-label`, fall back to a generic phrase (e.g. `"Photo, capture date unknown"`) when `capturedAt` is missing. Flag for confirmation if different placeholder text is preferred.
- **Unreadable photos are excluded before rendering even starts** — `useReadablePhotos()` already only returns `readable: true` photos, so this AC is satisfied by construction as long as the grid doesn't reach past that selector into any raw/unfiltered list.

## Tasks / Subtasks

- [x] Task 1: `Photo-grid-cell` (AC: #1, #2, #3) — `apps/gallery/src/features/browse/PhotoGridCell.tsx`
  - [x] Props: `photo: Photo`, `onOpen?: () => void` (unused/no-op for now, wired by Story 3.5)
  - [x] Square tile, 2px border, no radius (`rounded.DEFAULT`), thumbnail image from `photo.thumbnailUrl`
  - [x] EXIF badge below the thumbnail: `${photo.lensLabel} · f/${photo.apertureF} · ISO ${photo.iso}` using `Dot` as the separator (Story 1.5)
  - [x] Renders as a `<button>` with `aria-label` naming at least `photo.capturedAt`'s date (UX-DR15)
- [x] Task 2: Grid + reserved sidebar layout (AC: #1, #4)
  - [x] Two-region page layout: grid region + a sidebar region (`260px` fixed width, `--m-panel` background, 2px `--m-dim` border, 20px padding — content empty for this story, filled by Story 3.3), `40px` gap between the two regions (matching the mockup's `.container { gap: 40px }`)
  - [x] Grid: 2 columns below `900px`, 4 columns at `≥900px` (sidebar persistent at this width); below `900px` the sidebar drops to full-width, stacked above/below the grid rather than beside it
  - [x] `--m-space-item-gap` (28px) between cells
- [x] Task 3: Data wiring (AC: #1, #3)
  - [x] Add `useFilteredPhotos()` to the store as a trivial alias — `() => useReadablePhotos()`, no filter state, no new store slot (see Dev Notes on why this exists now but stays a pass-through)
  - [x] Render one `PhotoGridCell` per entry in `useFilteredPhotos()` — nothing else feeds the grid
- [x] Task 4: Verify (AC: #1–#4)
  - [x] Ingest a mixed batch — confirm only readable photos appear as cells, badge text matches the exact three-field format, and resizing the viewport produces the specified column counts and sidebar behavior

### Review Findings

- [x] [Review][Defer] Facet-panel mobile behavior is a plain stacked block, not DESIGN.md/UX-DR5/UX-DR16's "slide-up sheet" [apps/gallery/src/features/browse/Browse.tsx] — deferred, resolved by user 2026-07-08: focus this iteration on desktop only; mobile slide-up-sheet behavior is deprioritized and left for a later pass (likely alongside Story 3.3, once the Facet-panel has real content to present)
- [x] [Review][Patch] `[ASSUMPTION]` aria-label fallback text was too long ("Photo, capture date unknown") — FIXED: shortened to "Photo, captured —", reusing the same "—" placeholder convention as the badge fields. Applied in `formatCellAriaLabel` (`PhotoGridCell.tsx`) + test updated to match.
- [x] [Review][Patch] Completion Notes phrasing overstates what the diff does — FIXED: reworded to make clear AC #4's text itself is unchanged; only the implementation follows the Dev Notes' correction. [_bmad-output/implementation-artifacts/3-2-photo-grid-browse-unfiltered-view.md]
- [x] [Review][Defer] No component-level test renders `<PhotoGridCell>` itself (button semantics, `onClick`→`onOpen` wiring, computed `aria-label`, image render) [apps/gallery/src/features/browse/PhotoGridCell.tsx] — deferred, pre-existing gap (no React Testing Library/component-test infra exists anywhere in this repo yet)
- [x] [Review][Defer] Empty `<aside aria-label="Facets">` landmark ships with zero content, an unexplained empty region for screen-reader landmark navigation [apps/gallery/src/features/browse/Browse.tsx] — deferred, explicitly directed by this story's own Dev Notes as an intentional placeholder for Story 3.3 to fill
- [x] [Review][Defer] `useFilteredPhotos()` returning an empty array renders a blank grid with no empty-state messaging [apps/gallery/src/features/browse/Browse.tsx] — deferred, owned by Story 3.4 ("Empty Filtered State")
- [x] [Review][Defer] `thumbnailUrl` image load failure has no `onError` handler or accessible fallback [apps/gallery/src/features/browse/PhotoGridCell.tsx] — deferred, no established error-handling pattern elsewhere in the app for this; low probability (freshly created local `URL.createObjectURL` blob URLs)

## Project Structure Notes

```text
apps/gallery/src/features/browse/
  PhotoGridCell.tsx    # new — Gallery-local
  (grid + sidebar layout, wherever Story 3.1's placeholder Browse panel lives)
```

### References

- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — photo-grid-cell, #Layout & Spacing] — visual spec, column/gap rules
- [Source: ux-designs/ux-BMAD/mockups/gallery-browse.html] — real reference markup/CSS: exact column counts (2/900px/4), sidebar width (260px) and styling, EXIF badge markup
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4] — exact badge field order/format
- [Source: planning-artifacts/epics.md#Story 3.2, #UX-DR7, #UX-DR15] — acceptance criteria, accessibility requirement origin
- [Source: 3-1-underlinetabs-insights-browse-split.md] — the tab mechanism and Browse placeholder panel this grid renders inside (this story itself builds `useFilteredPhotos()` — see Dev Notes and Task 3, not 3.1)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx turbo run lint build test --filter=@bmad/gallery --filter=@bmad/theme --filter=@bmad/ui` — 7/7 tasks pass, 43 Vitest tests (5 new `PhotoGridCell` unit tests + 38 pre-existing), zero `tailwindcss/no-arbitrary-value` or `boundaries/dependencies` violations.
- Live-verified via a headless Playwright run against synthetic EXIF fixtures generated with Pillow (`IFDRational`-typed EXIF tags so `exifreader`'s `.computed` divides correctly — plain Python tuples parsed but left `.computed` as the raw `[num, den]` pair): 2 readable photos (full EXIF) + 1 EXIF-less photo ingested; confirmed the grid renders exactly 2 cells (`CELL_COUNT 2` — the unreadable photo excluded per AC #3), badge text `"24mm · f/1.8 · ISO 200"` / `"48mm · f/2.2 · ISO 400"` matching AD-4's format exactly (AC #2), `aria-label` naming the capture date, `grid-template-columns` resolving to 4 tracks at 1280px and 2 tracks at 500px (AC #4), sidebar computed width 260px at ≥900px and full-width (420px inside a 500px viewport) below it, and zero console errors.

### Completion Notes List

- `Photo-grid-cell` (`apps/gallery/src/features/browse/PhotoGridCell.tsx`, Gallery-local per FR-2) renders as a real `<button>` (UX-DR15) with `aria-label` naming the capture date. Two pure helpers — `formatExifBadgeSegments`/`formatCellAriaLabel` — carry the exact-format/fallback logic and are unit-tested directly (mirroring `aggregations.ts`'s existing pure-function pattern), matching AD-4's own worked example `"24mm · f/1.8 · ISO 200"` exactly. `onOpen` is threaded straight to `onClick` but always `undefined` today since `Browse.tsx` never passes it — a real no-op, not a stub Story 3.5 has to rewire, per the Dev Notes.
- `useFilteredPhotos()` added to `ingestStore.ts` as the specified trivial alias (`() => useReadablePhotos()`) — satisfies AD-3's import-boundary contract now without any filter state or store slot; Story 3.3 replaces only this function's body.
- `Browse.tsx` rebuilt as the two-region layout: a `260px`-fixed reserved sidebar (`aria-label="Facets"`, `bg-panel`/`border-dim`/`p-card-padding`, empty placeholder for Story 3.3) plus the grid, `gap-10` (40px) between regions per the mockup's `.container`. Grid is `grid-cols-2 lg:grid-cols-4` with `gap-item-gap` (28px) between cells.
- **New design tokens, following the existing `container-max`/`article-max` precedent of naming one-off layout pixel values rather than using banned arbitrary Tailwind values:** added `--m-space-sidebar-width: 260px` to `packages/theme/src/spacing.css` (mapped to `--spacing-sidebar-width` in `tailwind-preset.css`, used as `w-sidebar-width`).
- **`lg` breakpoint override, scoped to Gallery only:** the real mockup (`gallery-browse.html`) uses a single `900px` breakpoint, which the Dev Notes say to treat as this project's `lg` tier — rather than editing the shared `packages/theme` breakpoint scale (which `apps/landing`'s still-unbuilt Epic 4 stories would also inherit), overrode `--breakpoint-lg: 900px` locally inside `apps/gallery/src/app-shell/app.css`'s own `@theme` block. This is additive/local to Gallery's Tailwind build only.
- AC #4's text itself is unchanged by this diff. Its literal "2 columns below `sm`, scales between `sm`–`lg`" wording is what the Dev Notes call out as superseded by the real mockup's simpler 2-tier scheme (2 cols / 4 cols at one 900px breakpoint) — the *implementation* follows the Dev Notes' correction, not AC #4's literal text, but AC #4 itself was not edited to match (flagged by code review; left as a known doc/AC drift, not fixed in this pass).
- Verify (Task 4) was a full live Playwright run, not code-level reasoning alone — see Debug Log References for the synthetic-fixture approach and exact results.
- **Code review round (2026-07-08):** 3-layer adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 2 decisions resolved (mobile Facet-panel slide-up-sheet deferred to focus on desktop this iteration; aria-label fallback shortened to `"Photo, captured —"`), 2 patches applied (shortened aria-label fallback wired into `formatCellAriaLabel` + test; imprecise Completion Notes wording about AC #4 corrected), 4 deferred (no component-level test renders `PhotoGridCell` itself, empty `Facets` landmark ships with no content until 3.3, blank-grid empty-state owned by Story 3.4, no `onError` handler on the thumbnail `<img>`), 9 dismissed as noise (including one false-positive date-formatting claim, verified against `normalize.ts`'s `parseCapturedAt`). `turbo lint/build/test` re-verified clean after patches (43/43 tests).

### File List

- `apps/gallery/src/features/browse/PhotoGridCell.tsx` (new — Gallery-local grid cell + pure `formatExifBadgeSegments`/`formatCellAriaLabel` helpers)
- `apps/gallery/src/features/browse/PhotoGridCell.test.ts` (new — unit tests for the two pure helpers)
- `apps/gallery/src/features/browse/Browse.tsx` (modified — two-region grid + reserved-sidebar layout, replacing Story 3.1's placeholder)
- `apps/gallery/src/store/ingestStore.ts` (modified — added `useFilteredPhotos()` trivial alias)
- `packages/theme/src/spacing.css` (modified — added `--m-space-sidebar-width: 260px`)
- `packages/theme/src/tailwind-preset.css` (modified — mapped `--spacing-sidebar-width`)
- `apps/gallery/src/app-shell/app.css` (modified — Gallery-scoped `@theme { --breakpoint-lg: 900px }` override)

## Change Log

- 2026-07-08: Implemented Story 3.2 — `Photo-grid-cell` (Gallery-local, button-semantic, exact AD-4 badge format with placeholder fallbacks), `useFilteredPhotos()` trivial alias, and `Browse.tsx`'s two-region grid + reserved-sidebar layout (260px sidebar, 2/4-col responsive grid at a Gallery-scoped 900px `lg` breakpoint). Added a `sidebar-width` theme token following the `container-max`/`article-max` precedent. `turbo lint`/`build`/`test` all pass (7/7 tasks, 43 Vitest tests, 5 new); live-verified via a headless Playwright run against synthetic Pillow-generated EXIF fixtures (exact badge format, unreadable-photo exclusion, responsive column/sidebar behavior, zero console errors).
