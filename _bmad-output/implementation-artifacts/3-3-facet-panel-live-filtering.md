# Story 3.3: Facet Panel & Live Filtering

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want to filter my library by any facet,
so that I can narrow down to exactly the shots I'm looking for.

## Acceptance Criteria

1. **Given** the Browse tab, **when** the Facet-panel renders, **then** it appears as a sidebar on desktop (inside the 1240px container) or a slide-up sheet on mobile, with controls for lens, date-range, ISO, aperture, shutter, exposure comp, megapixel mode, and front/rear. [Source: planning-artifacts/epics.md#Story 3.3]
2. **Given** a discrete Facet (lens, megapixel mode, front/rear), **when** its control renders, **then** it uses Select/RadioGroup/Checkbox; for range Facets (date, ISO, aperture, shutter, exposure comp), it uses Range-control (two Fields, either side may be blank to mean unbounded). [Source: planning-artifacts/epics.md#Story 3.3]
3. **Given** a range Facet with min > max, **when** the invalid range is entered, **then** a FieldError shows on the offending side, and the filter doesn't apply until corrected. [Source: planning-artifacts/epics.md#Story 3.3]
4. **Given** any Facet control changes, **when** the change is committed, **then** the Browse grid re-filters immediately (AND-combined, no "Apply" button), the mobile trigger shows the active filter count, and "Clear-all" resets to the full readable set. [Source: planning-artifacts/epics.md#Story 3.3]
5. **Given** Facet filters are active on Browse, **when** Insights is viewed, **then** Insights remains unaffected (per Story 3.1). [Source: planning-artifacts/epics.md#Story 3.3]

## Dev Notes — read this first

- **Depends on Story 3.2** (a trivial `useFilteredPhotos()` alias — `() => useReadablePhotos()`, no filter state — and the sidebar layout region reserved but left empty). This story is what adds the `facetFilters` store slot, builds `useFacetFilters()` for the first time, and replaces `useFilteredPhotos()`'s trivial body with real filtering logic — the selector already exists and is already consumed by the grid, only its implementation changes here.
- **`Facet-panel` (UX-DR5) and `Range-control` (UX-DR6) are both Gallery-local**, not `packages/ui` — Browse is their only consumer (FR-2).
- **Control choice per discrete Facet — now confirmed by the real mockup (`mockups/gallery-browse.html`), correcting an earlier draft's guess:** `lens` → `Select`, **single-select** (the mockup shows a single current value, `"24mm ▾"`, not a multi-value chip list — an earlier draft of this story allowed `multiple` reasoning speculatively that multi-lens filtering might be wanted; the concrete mockup overrides that guess). `megapixelMode` → `RadioGroup` with options `All` (checked by default) / `12 MP (standard)` / `48 MP (ProRAW)` — matches the mockup's exact option labels. `camera` → `RadioGroup` with options `All` (default) / `Front (selfie)` / `Rear` — also matching the mockup's exact labels. The "All" option on both `RadioGroup`s is confirmed real (not an invented addition) — the mockup shows it as the checked default in both groups.
- **Facet fields use a collapsed/expandable summary pattern, per the mockup** — each Facet field shows a compact one-line trigger (`data-label` + current value + a `▾` chevron, e.g. `"Lens / focal length: 24mm ▾"`, `"ISO: All ISO ▾"`) that expands to reveal its real control (the `Select` options, or a `RangeControl`'s two `Field`s) on interaction. The mockup shows the date-range Facet in its **expanded** state (with visible FROM/TO `RangeControl` fields) while `lens`/`iso` are shown in their **collapsed** summary state — meaning at most one (or a user-chosen few) Facet is expanded at a time, not all eight simultaneously visible in full form. A collapsed Facet's summary value reads `"All {Facet}"` when unbounded/default, or the current value/range once set (e.g. `"24mm"`, an eventual `"100–400"` for ISO).
- **8 Facets total, mapped to `Photo` fields:** `lens` → `lensLabel`, `date` → `capturedAt`, `iso` → `iso`, `aperture` → `apertureF`, `shutter` → `shutterSpeedSec`, `exposureComp` → `exposureCompEv` (the one field that's a Facet, never an Insights histogram row, per UX-DR4), `megapixelMode` → `megapixelMode`, `camera` (front/rear) → `camera`.
- **`[ASSUMPTION]` Undefined-field handling under an active range/discrete filter:** if a photo's relevant field is `undefined` (a per-field gap on an otherwise-readable photo) and that Facet's filter is currently non-default/active, the photo doesn't match (excluded — there's no value to confirm it satisfies the filter). If that Facet's filter is at its default/unbounded state, the photo is unaffected by it regardless of whether the field is defined. Neither the PRD nor the architecture states this explicitly; it's the only behavior consistent with AD-4's "undefined, never a sentinel" rule.
- **`[ASSUMPTION]` Which side is "offending" on an invalid range:** when `min > max`, show the `FieldError` on the **max** field (the more common convention — "must be ≥ min"), not the min field. Flag if a different convention is intended.
- **AC #5 needs no new mechanism** — it's a direct consequence of Story 3.1's AD-3 import-boundary rule already being in place; if `insights/` genuinely never imports Browse's selectors, this AC holds by construction. Don't add a manual "notify Insights" mechanism.
- **AC #4's "no Apply button" means every control's `onChange` commits directly to `useFacetFilters()`'s store slot** — there is no separate local/pending filter draft state to sync later.

## Tasks / Subtasks

- [ ] Task 1: `Range-control` (AC: #2, #3) — `apps/gallery/src/features/browse/RangeControl.tsx`
  - [ ] Two underline `Field`s (Story 1.4) sharing one `data-label` row — `min`/`max` for numeric Facets, `from`/`to` for the date Facet
  - [ ] Either side blank means unbounded on that side
  - [ ] If `min > max` (both sides filled): show `FieldError` on the max field, and do not commit this Facet's filter until corrected (previous valid value, or unbounded, stays active in the meantime)
- [ ] Task 2: `Facet-panel` shell (AC: #1)
  - [ ] Desktop: renders inside Story 3.2's reserved sidebar region (`260px` fixed, `--m-panel` background, 2px `--m-dim` border, 20px padding, 24px gap between fields — per Story 3.2's mockup-confirmed values)
  - [ ] Each of the 8 Facet fields renders as a collapsed summary trigger (`data-label` + current value + chevron) that expands to its real control on interaction, per Dev Notes
  - [ ] Mobile: slide-up sheet, capped ~70% viewport height, opened via a trigger showing the active-filter count (Task 5)
  - [ ] No presence on the Insights tab (already true by construction — the panel only renders inside the Browse panel's tree)
  - [ ] "Clear filters" button uses `Button variant="outline"` (matches the mockup's `.btn-outline` styling), placed at the bottom of the panel
- [ ] Task 3: Discrete Facet controls (AC: #2)
  - [ ] `lens`: `Select`, single-select, options = distinct `lensLabel` values present in `useReadablePhotos()`'s current set
  - [ ] `megapixelMode`: `RadioGroup` — options `All` (default) / `12 MP (standard)` / `48 MP (ProRAW)`
  - [ ] `camera`: `RadioGroup` — options `All` (default) / `Front (selfie)` / `Rear`
- [ ] Task 4: Range Facet controls (AC: #2, #3)
  - [ ] `date`, `iso`, `aperture`, `shutter`, `exposureComp` each get a `RangeControl` instance, wired to the corresponding `Photo` field per Dev Notes' mapping
- [ ] Task 5: Live filtering + Clear-all + mobile count (AC: #4)
  - [ ] Add the `facetFilters` store slot and build `useFacetFilters()` for the first time: one entry per Facet, defaulting to unbounded/`All`
  - [ ] Replace `useFilteredPhotos()`'s trivial alias body (Story 3.2: `() => useReadablePhotos()`) with real logic that applies every active Facet's predicate against `useReadablePhotos()`, AND-combined (per Dev Notes' undefined-handling rule) — the grid doesn't need to change, it already consumes this selector
  - [ ] Every control's `onChange` commits directly to the store — no local draft/Apply step
  - [ ] "Clear-all" resets every Facet to its default (unbounded/`All`)
  - [ ] `[ASSUMPTION]` Mobile trigger displays the **count of currently-non-default Facets** (e.g. lens + ISO active = "2"), not a sum of individual selected values within multi-select Facets (e.g. 3 lenses selected still counts as 1, for the `lens` Facet being active) — neither epics.md nor DESIGN.md specifies which; this reading treats the count as "how many Facet dimensions are you filtering by," which is the more legible number to show a user
- [ ] Task 6: Verify (AC: #1–#5)
  - [ ] Apply one filter per Facet type (one discrete, one range) — confirm the grid narrows correctly and AND-combines when two are active together
  - [ ] Enter an invalid range (min > max) — confirm `FieldError` shows on the max side and the grid doesn't change until corrected
  - [ ] Confirm Insights' numbers are identical with filters active vs. cleared
  - [ ] Resize to mobile width — confirm the slide-up sheet behavior and the active-filter count on its trigger

## Project Structure Notes

```text
apps/gallery/src/features/browse/
  RangeControl.tsx   # new — Gallery-local
  FacetPanel.tsx      # new — Gallery-local, fills Story 3.2's reserved sidebar region
```

### References

- [Source: planning-artifacts/epics.md#Story 3.3, #UX-DR5, #UX-DR6] — acceptance criteria, component specs
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — facet-panel, range-control] — sidebar/sheet layout, control-per-Facet-type rule
- [Source: ux-designs/ux-BMAD/mockups/gallery-browse.html] — real reference markup/CSS: lens is single-select (not multi), exact RadioGroup option labels, collapsed/expandable facet-field pattern, "Clear filters" button styling, sidebar dimensions
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-3, #AD-4] — Browse-only selector boundary, per-field `undefined` semantics
- [Source: 3-2-photo-grid-browse-unfiltered-view.md] — the trivial `useFilteredPhotos()` alias and sidebar region this story replaces/fills in

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
