---
baseline_commit: 00fe4b3d8d9ccf9008285b8330b7eb183973e032
---

# Story 4.2: Value Pillars

Status: done

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

- [x] Task 1: `Pillar-card` (AC: #1) — `apps/landing/src/components/PillarCard.tsx` (or `.astro`)
  - [x] Composes `Panel` (`@bmad/ui`) with `bordered` set and `caption` set to the numbered eyebrow (`"01"`/`"02"`/`"03"`), containing an `H3` title + body paragraph
- [x] Task 2: Pillar content (AC: #2)
  - [x] Use the confirmed copy from `mockups/landing-hero.html` verbatim:
    1. **Kill forced HDR** — "iOS forces HDR into every frame the moment you tap the shutter. Lazy Cam starts from a clean base — no fighting the system after the fact."
    2. **Strip native processing** — "No aggressive sharpening, no synthetic smoothing pass on faces. What the sensor saw is what you get to work with."
    3. **Own preset system** — "Shadow-to-highlight tone curves and a per-color mixer. Even if iOS lets you disable HDR one day, presets are still the reason to stay."
- [x] Task 3: Layout (AC: #1, #3)
  - [x] Stacked on mobile, side-by-side on desktop; identical sizing/chrome across all three (no featured pillar)
- [x] Task 4: Scroll-triggered fade-up (AC: #3)
  - [x] Adapt `mockups/landing-hero.html`'s `scrollRevealUp` keyframe + `.scroll-reveal` class (`animation-timeline: view()`, `animation-range: entry 0% cover 25%`, `animation-delay: calc(var(--stagger, 0) * 90ms)`) directly — set `--stagger` to `0`/`1`/`2` per card, matching the mockup's own pattern
  - [x] Add a `@supports` fallback rendering the final visible state directly on browsers without scroll-timeline support (progressive enhancement, never invisible content) — not shown in the mockup but consistent with its "content is present in the DOM regardless of motion support" comment
  - [x] Respects `prefers-reduced-motion: reduce`, matching the mockup's media-query block
- [x] Task 5: Verify (AC: #1–#3)
  - [x] Confirm layout at mobile and desktop widths, exact pillar copy, and the fade-up stagger on scroll

### Review Findings

3-layer adversarial code review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) against the uncommitted working-tree diff (baseline `00fe4b3d`, matching this story's own `baseline_commit`).

- [x] [Review][Decision] Pillar-grid breakpoint diverges from the confirmed mockup (Tailwind default `md:` 768px vs. mockup's `900px`) — Dev Notes lean on `mockups/landing-hero.html` as verbatim source of truth, but the mockup's `.pillar-grid` breakpoint is `@media (max-width: 900px)` (`mockups/landing-hero.html:284-285`) while `Pillars.astro` uses `grid-cols-1 md:grid-cols-3`. Between 768–899px viewport width the page shows 3-column side-by-side where the mockup showed a stacked single column. Neither AC #1 nor #3 specify an exact pixel, and Gallery's own 900px `--breakpoint-lg` override is explicitly scoped to Gallery only (per its own comment) — so it wasn't a simple copy-paste precedent either way; this was a genuine open choice the dev disclosed in Completion Notes but didn't flag as `[ASSUMPTION]` in Dev Notes the way the story's other ambiguous point (scroll-reveal replay) was. [apps/landing/src/components/Pillars.astro:23] — **Resolved by user (2026-07-09): keep the default Tailwind `md:` (768px), no code change.** AC doesn't mandate an exact pixel value.
- [x] [Review][Defer] Pillars section has no accessible name / heading-hierarchy skip — three `<h3>` titles sit directly under Hero's `<h1>` with no `<h2>` in between, and the wrapping `<section>` has no `aria-label`/`aria-labelledby`. This is the first multi-heading page in the project (previously only Hero's `<h1>` existed), so the skip is newly introduced here, not inherited. The confirmed mockup also had a `// THREE PILLARS` section-eyebrow (`mockups/landing-hero.html:24`) that wasn't ported — AC #1 doesn't literally require it and DESIGN.md's pillar-card component note doesn't mention it either. [apps/landing/src/components/Pillars.astro, apps/landing/src/components/PillarCard.tsx:22] — **Deferred by user (2026-07-09):** out of this story's explicit 5-task list; revisit at the next Landing story or a systemic a11y audit rather than as a one-off scope addition here.
- [x] [Review][Patch] `stagger` prop typed as bare `number` instead of the `0 | 1 | 2` union it's actually constrained to [apps/landing/src/components/PillarCard.tsx:10] — fixed: `stagger: 0 | 1 | 2`; `Pillars.astro`'s `PILLARS` array now carries its own literal `stagger` per pillar instead of deriving it from `.map()`'s index
- [x] [Review][Patch] `index` prop name (holds the display string `"01"`) reads confusingly next to the array index `i` used alongside it in `Pillars.astro`'s `.map()` [apps/landing/src/components/PillarCard.tsx:12] — fixed: renamed to `eyebrow`
- [x] [Review][Patch] Missing `key` prop on `PillarCard` elements in `Pillars.astro`'s `.map()` render [apps/landing/src/components/Pillars.astro:23] — fixed: `key={pillar.eyebrow}`; `PillarCardProps` gained an unused `key?: string` field since `astro check`'s stricter typing of framework components inside `.astro` files doesn't otherwise recognize `key` as React-special the way plain JSX/TSX does
- [x] [Review][Defer] `stagger` has no runtime bounds guard (`NaN`/`Infinity`/negative would produce an invalid/negative `animation-delay`) [apps/landing/src/components/PillarCard.tsx:18] — deferred, pre-existing pattern; not reachable via any current code path, `Pillars.astro`'s `PILLARS` is a static 3-item literal
- [x] [Review][Defer] `PILLARS` array growth beyond 3 items has no cap on `stagger`, so later cards would get an ever-larger, uncapped `animation-delay` [apps/landing/src/components/Pillars.astro:23] — deferred, pre-existing pattern; not reachable today, same static 3-item literal
- [x] [Review][Defer] `.scroll-reveal` cards already within the viewport on initial page load may stay stuck at `opacity: 0` on browser engines that only resolve `animation-timeline: view()` progress on a scroll event [apps/landing/src/styles/app.css] — deferred; matches this story's own already-disclosed "honest approximation, not a perfect guarantee" limitation for the CSS-only scroll-linked approach (see Dev Notes)

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

Claude Sonnet 5

### Debug Log References

### Completion Notes List

- `PillarCard.tsx` (Landing-local, FR-2) composes `@bmad/ui`'s `Panel` with `bordered` — no changes needed to `Panel` itself, its `bordered` prop was already added in anticipation of this story (Story 2.4 Dev Notes). Numbered eyebrow via `caption`, `H3` title (`font-display text-h3 text-fg`, matching `PhotoDetailModal`'s existing usage) + body (`text-body text-muted`).
- `Pillars.astro` wires the three confirmed-copy pillars into a `grid-cols-1 md:grid-cols-3 gap-item-gap` layout (equal weight — identical props/sizing on every `PillarCard`, no featured pillar) and is rendered statically with **no client directive** — `PillarCard`/`Panel` are non-interactive, so Astro renders them to plain HTML at build time and ships zero extra JS, which is stricter than DESIGN.md's "CSS-only, no JS" motion requirement even needs. Confirmed via the built `dist/index.html`: no additional `<script src>` beyond Layout's existing inline theme-flash-prevention script.
- Scroll-reveal (`app.css`): ported the mockup's `scrollRevealUp`/`.scroll-reveal` verbatim (`animation-timeline: view()`, `animation-range: entry 0% cover 25%`, `animation-delay: calc(var(--stagger, 0) * 90ms)`), plus the `@supports not (animation-timeline: view())` fallback and `prefers-reduced-motion: reduce` collapse the story's Dev Notes/Task 4 called for (neither shown in the mockup itself). `--stagger` is set via each card's own inline style (not a tokenized property per the repo's `no-arbitrary-style-value`/`stylelint-declaration-strict-value` lint rules, so no design-token violation).
- No `md:` breakpoint precedent existed in `apps/landing` (Gallery's 900px `--breakpoint-lg` override is explicitly scoped to Gallery only, per its own comment); used Tailwind's default `md` (768px) for the mobile/desktop split since neither the AC nor Dev Notes specify an exact pixel value.
- turbo lint/build clean (9/9 tasks, forced no-cache) across all packages; turbo test 113/113 (Gallery's suite, unaffected — Landing has no unit tests, matching Story 4.1's precedent). Live-verified via headless Playwright against the production build (`astro build` + static serve): all three pillars render with exact copy/numbered eyebrows at desktop (1280px, light+dark) and mobile (390px, stacked) viewports, dark-mode background reaches the full page, zero console errors, and `prefers-reduced-motion: reduce` collapses every card to `opacity: 1` with no scroll needed.

### File List

- `apps/landing/src/components/PillarCard.tsx` (new)
- `apps/landing/src/components/Pillars.astro` (new)
- `apps/landing/src/pages/index.astro` (modified — mounts `Pillars`)
- `apps/landing/src/styles/app.css` (modified — scroll-reveal keyframes/class, `@supports` fallback, reduced-motion collapse)

## Change Log

- 2026-07-09: Story 4.2 implemented — `Pillar-card` (Panel `bordered` composition) + confirmed three-pillar copy + stacked/side-by-side layout + CSS-only scroll-reveal stagger. Status → review.
- 2026-07-09: 3-layer adversarial code review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 2 decisions resolved by user (breakpoint kept at Tailwind default `md:` 768px, no code change; Pillars section accessible-name/heading-hierarchy gap deferred to a future Landing story or systemic a11y audit), 3 patches applied (`stagger` typed as `0 | 1 | 2` instead of bare `number`; `index` prop renamed to `eyebrow` to stop reading as an array index; `key` prop added to the `PillarCard` list render), 3 deferred (`stagger`/array-growth have no runtime bounds guard, both unreachable via the current static 3-item literal; `.scroll-reveal` cards already in the initial viewport may not resolve `animation-timeline: view()` on all engines without a scroll event — matches this story's own disclosed CSS-only-approximation limitation), 8 dismissed as noise (self-reported QA claims already independently verified this session, a verified-compliant `Panel.bordered` dependency claim, and other low-value nits). turbo lint/build/test re-verified clean (10/10 tasks, forced no-cache; 113/113 Gallery tests unaffected); live-verified via Playwright after the patches (exact copy, numbered eyebrows, zero console errors). Status → done.
