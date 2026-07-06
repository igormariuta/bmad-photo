# Story 3.2: Photo Grid (Browse) — Unfiltered View

Status: ready-for-dev

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

- [ ] Task 1: `Photo-grid-cell` (AC: #1, #2, #3) — `apps/gallery/src/features/browse/PhotoGridCell.tsx`
  - [ ] Props: `photo: Photo`, `onOpen?: () => void` (unused/no-op for now, wired by Story 3.5)
  - [ ] Square tile, 2px border, no radius (`rounded.DEFAULT`), thumbnail image from `photo.thumbnailUrl`
  - [ ] EXIF badge below the thumbnail: `${photo.lensLabel} · f/${photo.apertureF} · ISO ${photo.iso}` using `Dot` as the separator (Story 1.5)
  - [ ] Renders as a `<button>` with `aria-label` naming at least `photo.capturedAt`'s date (UX-DR15)
- [ ] Task 2: Grid + reserved sidebar layout (AC: #1, #4)
  - [ ] Two-region page layout: grid region + a sidebar region (`260px` fixed width, `--m-panel` background, 2px `--m-dim` border, 20px padding — content empty for this story, filled by Story 3.3), `40px` gap between the two regions (matching the mockup's `.container { gap: 40px }`)
  - [ ] Grid: 2 columns below `900px`, 4 columns at `≥900px` (sidebar persistent at this width); below `900px` the sidebar drops to full-width, stacked above/below the grid rather than beside it
  - [ ] `--m-space-item-gap` (28px) between cells
- [ ] Task 3: Data wiring (AC: #1, #3)
  - [ ] Add `useFilteredPhotos()` to the store as a trivial alias — `() => useReadablePhotos()`, no filter state, no new store slot (see Dev Notes on why this exists now but stays a pass-through)
  - [ ] Render one `PhotoGridCell` per entry in `useFilteredPhotos()` — nothing else feeds the grid
- [ ] Task 4: Verify (AC: #1–#4)
  - [ ] Ingest a mixed batch — confirm only readable photos appear as cells, badge text matches the exact three-field format, and resizing the viewport produces the specified column counts and sidebar behavior

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

### Debug Log References

### Completion Notes List

### File List
