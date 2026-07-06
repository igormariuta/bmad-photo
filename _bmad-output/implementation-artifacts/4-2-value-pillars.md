# Story 4.2: Value Pillars

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Maya,
I want to see the three value pillars explained plainly,
so that I understand exactly what makes this camera app different.

## Acceptance Criteria

1. **Given** the three-pillars section, **when** it renders, **then** three Pillar-card components show (stacked on mobile, side-by-side on desktop) with Panel-identical chrome, each with a numbered eyebrow (`"01"`/`"02"`/`"03"`), an H3 title, and body copy. [Source: planning-artifacts/epics.md#Story 4.2]
2. **Given** the pillar content, **when** it renders, **then** it states: kill forced HDR; strip native processing/over-sharpening; own preset system framed as the durable moat (the reason to stay even if iOS later allows disabling HDR natively). [Source: planning-artifacts/epics.md#Story 4.2]
3. **Given** each card enters the viewport, **when** it is scrolled into view, **then** it fades up once, staggered ~90ms apart from adjacent cards, and does not re-trigger on scrolling back up; **and** all three cards carry equal visual weight — no "featured" pillar. [Source: planning-artifacts/epics.md#Story 4.2]

## Dev Notes

- **Depends on Story 4.1** (page shell) and Story 2.4's `Panel` (`@bmad/ui`) — `Pillar-card` composes `Panel` with `bordered` set (`caption="01"` etc., `tone="accent"`, `bordered`) wrapping an `H3` + body — it doesn't need to reimplement card chrome from scratch. **Note:** Panel's default is borderless (matching Insights' real mockup, `.hist-panel`) — Pillar-card is the one consumer that opts into the border via the `bordered` prop, not the other way around.
- **`Pillar-card` is Landing-local** (single consumer, FR-2).
- **Pillar copy is now confirmed, not drafted** — `mockups/landing-hero.html` gives the real content for all three pillars verbatim (Dev Notes doesn't repeat it in full; see Task 2), already consistent with the PRD §11 voice/tone contract Story 4.1 also draws from.
- **`[ASSUMPTION]`/known limitation — "fades up once... does not re-trigger on scrolling back up" via pure CSS scroll-linked animation (`animation-timeline: view()`) is an honest approximation, not a perfect guarantee.** DESIGN.md is explicit this must be "CSS-only (scroll-linked, no JS)." CSS scroll-driven animations are inherently tied to current scroll position, not a "has this played once" flag — if a user deliberately scrolls back up past a card's entry range and back down again, a strict `animation-timeline: view()` implementation may visually replay the entry portion. For normal one-directional scrolling (the overwhelmingly common case) this reads correctly as "fades up once." Flag this nuance for the PM rather than silently either violating the no-JS constraint (with an Intersection Observer) or overclaiming the CSS-only approach is flawless in every scroll pattern.
- **Stagger:** `animation-delay` of `0ms`/`90ms`/`180ms` across the three cards.
- **Equal visual weight:** all three `Panel` instances use identical props/sizing — no card gets a different `tone`, size, or extra emphasis.
- **`prefers-reduced-motion: reduce`** collapses this fade-up to the final visible state instantly, same rule as Story 4.1's motion.

## Tasks / Subtasks

- [ ] Task 1: `Pillar-card` (AC: #1) — `apps/landing/src/components/PillarCard.tsx` (or `.astro`)
  - [ ] Composes `Panel` (`@bmad/ui`) with `bordered` set and `caption` set to the numbered eyebrow (`"01"`/`"02"`/`"03"`), containing an `H3` title + body paragraph
- [ ] Task 2: Pillar content (AC: #2)
  - [ ] Use the confirmed copy from `mockups/landing-hero.html` verbatim:
    1. **Kill forced HDR** — "iOS forces HDR into every frame the moment you tap the shutter. Lazy Cam starts from a clean base — no fighting the system after the fact."
    2. **Strip native processing** — "No aggressive sharpening, no synthetic smoothing pass on faces. What the sensor saw is what you get to work with."
    3. **Own preset system** — "Shadow-to-highlight tone curves and a per-color mixer. Even if iOS lets you disable HDR one day, presets are still the reason to stay."
- [ ] Task 3: Layout (AC: #1, #3)
  - [ ] Stacked on mobile, side-by-side on desktop; identical sizing/chrome across all three (no featured pillar)
- [ ] Task 4: Scroll-triggered fade-up (AC: #3)
  - [ ] Adapt `mockups/landing-hero.html`'s `scrollRevealUp` keyframe + `.scroll-reveal` class (`animation-timeline: view()`, `animation-range: entry 0% cover 25%`, `animation-delay: calc(var(--stagger, 0) * 90ms)`) directly — set `--stagger` to `0`/`1`/`2` per card, matching the mockup's own pattern
  - [ ] Add a `@supports` fallback rendering the final visible state directly on browsers without scroll-timeline support (progressive enhancement, never invisible content) — not shown in the mockup but consistent with its "content is present in the DOM regardless of motion support" comment
  - [ ] Respects `prefers-reduced-motion: reduce`, matching the mockup's media-query block
- [ ] Task 5: Verify (AC: #1–#3)
  - [ ] Confirm layout at mobile and desktop widths, exact pillar copy, and the fade-up stagger on scroll

## Project Structure Notes

```text
apps/landing/src/components/PillarCard.tsx   # new — Landing-local
```

### References

- [Source: planning-artifacts/epics.md#Story 4.2, #UX-DR13] — acceptance criteria, component spec
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — pillar-card] — "Panel-identical chrome" wording motivating Panel's `bordered` prop
- [Source: ux-designs/ux-BMAD/mockups/landing-hero.html] — confirmed pillar copy, exact scroll-reveal CSS
- [Source: 2-4-insights-dashboard.md] — `Panel` component and its `bordered` prop
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#4.3 Landing, #11 Aesthetic & Tone] — pillar content origin, voice/tone contract

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
