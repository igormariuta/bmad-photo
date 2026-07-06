# Story 3.5: Photo Detail Modal

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want to tap a photo to see its full metadata,
so that I can inspect exactly what was captured.

## Acceptance Criteria

1. **Given** a photo grid cell, **when** the user taps it, **then** a Photo-detail-modal opens, reusing the inherited `Modal`/`ModalHeader` shell. [Source: planning-artifacts/epics.md#Story 3.5]
2. **Given** the modal is open, **when** its body renders, **then** it lists every extracted Metadata field as Spec (label/value) rows — the badge's three fields plus shutter speed, exposure compensation, capture timestamp, megapixel mode, and front/rear. [Source: planning-artifacts/epics.md#Story 3.5]
3. **Given** the modal is open, **when** the user presses Esc, clicks the backdrop, or clicks the close control, **then** it closes, using the same focus-trap and `aria-labelledby` wiring as every other Modal in the system. [Source: planning-artifacts/epics.md#Story 3.5]
4. **Given** a grid cell, **when** it is rendered, **then** it is `<button>`-semantic with an `aria-label` naming at least the photo's capture date. [Source: planning-artifacts/epics.md#Story 3.5, #UX-DR15]

## Dev Notes

- **Depends on Story 3.2** (`PhotoGridCell` — its `onOpen` prop was left a no-op there specifically for this story to wire up) and Story 1.5 (`Modal`/`ModalHeader`).
- **AC #4 is already built** — Story 3.2 already made the cell `<button>`-semantic with a `capturedAt`-derived `aria-label` (including the missing-field fallback phrasing from that story). This story only needs to wire the actual `onClick`/`onOpen` handler; don't rebuild the button semantics.
- **`Spec` (label/value row) doesn't exist anywhere yet and is Gallery-local, single-consumer** — same situation as `Panel` was before Story 2.4 (which needed it in ≥2 places and built it shared), but `Spec` has exactly one consumer in this whole project (this modal), so per FR-2 it stays local, not `packages/ui`. It's a small presentational component; reference implementation (from the same demo-helpers source that also had `Panel`):
  ```tsx
  export function Spec({ label, value }: { label: string; value: string }) {
    return (
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-6 border-b-2 border-[var(--m-dim)] py-3">
        <div className="text-[14px] text-[var(--m-fg)]">{label}</div>
        <div className="text-[12px] tracking-[0.06em] whitespace-nowrap text-[var(--m-accent)] tabular-nums">{value}</div>
      </div>
    );
  }
  ```
- **8 Spec rows total**, each needing its own display formatting (none of this is specified upstream beyond the field list — reasonable defaults, flag if a different format is wanted):
  - `lensLabel` (already `"24mm"`-formatted)
  - `apertureF` → `f/{value}`
  - `iso` → `ISO {value}`
  - `shutterSpeedSec` → for values `< 1` (the vast majority — phone shutter speeds are almost always sub-second), convert to a fraction: `1/{round(1/value)}s` (e.g. `0.008` → `"1/125s"`, matching how photographers actually read shutter speed). For values `>= 1` (a real but rare long-exposure case), display as a plain decimal-seconds string instead (e.g. `2` → `"2s"`), not a nonsensical `"1/1s"` — the fraction formula only makes sense below 1 second
  - `exposureCompEv` → signed EV, e.g. `+0.3 EV` / `-1.0 EV` / `0 EV`
  - `capturedAt` → human-readable (e.g. `"14 Jun 2026, 18:32"`), reading the timezone-naive ISO-8601 string as-is (per Story 2.2's `capturedAt` decision — no timezone conversion, since none is known)
  - `megapixelMode` → `12MP` / `48MP`
  - `camera` → `Front` / `Rear`
  - **Reuse Story 3.2's missing-field placeholder convention** (e.g. `"—"`) for any of these that are `undefined` on a given photo — consistency with the grid badge, not a new pattern
- **Modal wiring is a direct application of Story 1.5's `Modal`/`ModalHeader` contract** — `isOpen`, `onOpenChange`, `labelledBy` matching `ModalHeader`'s `titleId`, render-prop children receiving `close`. Nothing new to invent here; this story is populating that shell's body, not extending the shell itself.

## Tasks / Subtasks

- [ ] Task 1: `Spec` component (AC: #2) — `apps/gallery/src/features/photo-detail/Spec.tsx`
  - [ ] Implement per Dev Notes' reference shape
- [ ] Task 2: Photo-detail-modal (AC: #1, #2, #3) — `apps/gallery/src/features/photo-detail/PhotoDetailModal.tsx`
  - [ ] `Modal` + `ModalHeader` (Story 1.5), title naming the photo (e.g. its capture date or lens), body = 8 `Spec` rows per Dev Notes' formatting rules and missing-field fallback
  - [ ] Standard close behavior inherited from `Modal` itself (Esc/backdrop/close-control, focus trap, `aria-labelledby`) — no extra work needed here beyond correct `labelledBy`/`titleId` wiring
- [ ] Task 3: Wire the grid cell trigger (AC: #1)
  - [ ] `PhotoGridCell`'s `onOpen` (Story 3.2, previously a no-op) now opens this modal for the tapped photo
- [ ] Task 4: Verify (AC: #1–#4)
  - [ ] Tap a grid cell — confirm the modal opens with all 8 fields correctly formatted, including a photo with at least one missing field showing the placeholder, not `"undefined"`
  - [ ] Confirm Esc, backdrop click, and the close control all dismiss the modal
  - [ ] Confirm the grid cell's `aria-label`/button semantics (already built in 3.2) are intact

## Project Structure Notes

```text
apps/gallery/src/features/photo-detail/
  Spec.tsx               # new — Gallery-local, single consumer
  PhotoDetailModal.tsx    # new — Gallery-local
```

This matches the Architecture's structural seed (Story 1.1), which reserves a separate `features/photo-detail/` folder for exactly this — "Modal + full Metadata Spec rows" — distinct from `features/browse/` where `PhotoGridCell` (Story 3.2) lives. `PhotoDetailModal` imports `PhotoGridCell`'s `onOpen` callback wiring from `browse/`, but its own files belong in `photo-detail/`.

### References

- [Source: planning-artifacts/epics.md#Story 3.5, #UX-DR8, #UX-DR15] — acceptance criteria, field list
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4] — `Photo` field types this modal formats for display
- [Source: 3-2-photo-grid-browse-unfiltered-view.md] — `PhotoGridCell`'s `onOpen` prop and missing-field placeholder convention this story reuses
- [Source: 1-5-shared-component-library-display-feedback-navigation-primitives.md#Task 7] — `Modal`/`ModalHeader` contract

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
