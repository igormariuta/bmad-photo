# Story 4.3: Preset Showcase

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Maya,
I want to see concrete examples of the preset tools,
so that I can evaluate whether they'd solve my problem.

## Acceptance Criteria

1. **Given** the preset-showcase section, **when** it renders, **then** a static before/after image pair (a tone-curve example and a color-mixer example) shows side-by-side on desktop / stacked on mobile, each half framed by a 2px border and labelled with a data-label caption (`"BEFORE"`/`"AFTER"`). [Source: planning-artifacts/epics.md#Story 4.3]
2. **Given** the preset explanation copy, **when** it renders, **then** it names concrete tools: shadow/highlight tone curves, and a Lightroom-style per-color mixer (mute/boost + hue shift, e.g. yellow→orange). [Source: planning-artifacts/epics.md#Story 4.3]
3. **Given** the section enters the viewport, **when** it is scrolled into view, **then** it fades up once, same treatment as Pillar-card. [Source: planning-artifacts/epics.md#Story 4.3]
4. **Given** an image fails to load, **when** the failure occurs, **then** it falls back to an ErrorMessage-style muted placeholder frame with alt text, never a broken-image icon. [Source: planning-artifacts/epics.md#Story 4.3]

## Dev Notes

- **Depends on Story 4.1** (page shell) and Story 4.2 (the scroll-triggered fade-up technique this story reuses verbatim).
- **`Preset-comparison` is Landing-local** (single consumer, FR-2).
- **Real image assets don't exist in this repo yet** — a tone-curve before/after pair and a color-mixer before/after pair need to be sourced or created as static assets. This is a content need, not something inferable from any planning doc; flag for the user/PM to provide or commission these before this story can ship visually complete (the component itself can and should still be built against placeholder image paths).
- **AC #4's "ErrorMessage-style" fallback is a styling reference, not a literal reuse of the `ErrorMessage` component** (which is a full-page, `error`/`status`-driven component from Story 1.5, not an inline image-fallback treatment, and isn't otherwise used anywhere on Landing). Build a small local fallback: on `<img>` load failure, swap to a muted placeholder frame (`--m-panel`/`--m-muted` background, 2px `--m-dim` border, visible `alt` text) — matching `ErrorMessage`'s general muted aesthetic language, not importing the component itself.
- **Fade-up reuses Story 4.2's exact technique** (`animation-timeline: view()`, `prefers-reduced-motion` collapse) — "same treatment as Pillar-card" means literally the same CSS mechanism, not a new one. Since this is one section (a before/after pair, not 3 discrete cards), a per-half 90ms stagger is optional — either a single fade for the whole section or a two-way stagger both satisfy "same treatment," pick whichever reads better once built.

## Tasks / Subtasks

- [ ] Task 1: `Preset-comparison` (AC: #1) — `apps/landing/src/components/PresetComparison.tsx`
  - [ ] Two image halves, each 2px `--m-dim` border, `data-label` caption (`"BEFORE"`/`"AFTER"`) — side-by-side on desktop, stacked on mobile
- [ ] Task 2: Content (AC: #2)
  - [ ] Copy naming concrete tools: shadow/highlight tone curves, and a Lightroom-style per-color mixer (mute/boost + hue shift, e.g. yellow→orange)
- [ ] Task 3: Image-load fallback (AC: #4)
  - [ ] `onError` swaps each half to the muted placeholder frame described in Dev Notes, with `alt` text still visible — never the browser's default broken-image icon
- [ ] Task 4: Scroll-triggered fade-up (AC: #3)
  - [ ] Reuse Story 4.2's CSS technique verbatim
- [ ] Task 5: Verify (AC: #1–#4)
  - [ ] Confirm layout at mobile/desktop widths, copy accuracy, fade-up behavior, and the fallback frame (test by pointing an image `src` at a 404 temporarily)

## Project Structure Notes

```text
apps/landing/src/components/PresetComparison.tsx   # new — Landing-local
```

### References

- [Source: planning-artifacts/epics.md#Story 4.3, #UX-DR14] — acceptance criteria, component spec
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — preset-comparison] — layout, border, caption spec
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#4.3 Landing, #FR-10] — preset tool names
- [Source: 4-2-value-pillars.md#Task 4] — fade-up technique this story reuses

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
