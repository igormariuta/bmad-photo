# Story 4.1: Header & Hero

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Maya (secondary persona — an iPhone shooter who rejects the stock look),
I want to land on the page and immediately understand the app's promise,
so that I recognize my own frustration within seconds.

## Acceptance Criteria

1. **Given** the Landing page loads, **when** it renders, **then** the shared Header-bar (wordmark + theme-toggle, reused from `packages/ui`) appears at the top. [Source: planning-artifacts/epics.md#Story 4.1]
2. **Given** the Hero section, **when** it renders, **then** it shows an eyebrow + display headline + one-line body, type-only (no imagery), inside the 1240px container. [Source: planning-artifacts/epics.md#Story 4.1]
3. **Given** the headline, **when** the page loads, **then** it plays a one-shot GlitchText settle-in (~900ms: jitter + accent/error chromatic ghost, then resolves to static type) — ported as a Landing-local component (single-consumer, per the FR-2 assumption) rather than into `packages/ui`; **and** the eyebrow/body fade up shortly after, CSS-only. [Source: planning-artifacts/epics.md#Story 4.1]
4. **Given** `prefers-reduced-motion: reduce`, **when** the page loads, **then** all motion collapses to its final static state instantly. [Source: planning-artifacts/epics.md#Story 4.1]

## Dev Notes — read this first

- **Depends on Epic 1 fully implemented**, specifically Story 2.4's `Header-bar` (`@bmad/ui`) — this story is its second consumer, exactly as anticipated. Render `<HeaderBar wordmark="LAZY " wordmarkAccent="CAM" />` (per the real mockup, `mockups/landing-hero.html` — Gallery uses `"EXIF "`/`"GALLERY"` instead, per Story 2.4), nothing passed to `actions` (that slot is Gallery-only, per Story 2.5's patch).
- **This is the first Astro page in the whole project** — no prior story built any real `apps/landing` content beyond Story 1.1's placeholder scaffold. Astro renders to static HTML by default with **zero client-side JS unless explicitly hydrated** — this matters concretely for `GlitchText`, which needs a timed animation. It must be mounted as a client "island" with an explicit client directive (e.g. `client:load` or `client:idle`) inside the `.astro` page/layout — dropping a React component into an `.astro` file without a client directive silently renders it statically with no animation at all. Same applies to the `ThemeToggle` inside Header-bar (it already needs JS for its click handler and `prefers-color-scheme` read, from Story 2.4/1.5) — confirm it's also hydrated, not just Header-bar's static markup.
- **`GlitchText` has a real, concrete reference implementation — `mockups/landing-hero.html` — don't build this from prose alone.** That mockup ships a complete, working CSS-only glitch-settle keyframe, exactly matching "jitter + accent/error chromatic ghost, 900ms":
  ```css
  @keyframes heroGlitchSettle {
    0%   { opacity: 0; transform: translateY(10px); text-shadow: none; }
    8%   { opacity: 1; transform: translate(-2px, 0); text-shadow: 2px 0 var(--m-accent), -2px 0 var(--m-error); }
    16%  { transform: translate(2px, 0); text-shadow: -2px 0 var(--m-accent), 2px 0 var(--m-error); }
    24%  { transform: translate(0, 0); text-shadow: none; }
    100% { opacity: 1; transform: translateY(0); text-shadow: none; }
  }
  .hero-glitch { animation: heroGlitchSettle 900ms steps(1, end) both; }
  ```
  Adapt this directly (translate jitter + dual accent/error `text-shadow` offsets = the chromatic ghost) rather than inventing a different jitter technique. The same mockup's `.reveal`/`.scroll-reveal` classes (`revealUp`/`scrollRevealUp` keyframes, `animation-delay`) are the reference for Task 4's fade-up — reuse those too.
- **The one required behavioral change from the reference's own GlitchText component (the actual ported React primitive, distinct from this mockup's illustrative CSS):** one-shot on load (~900ms, per the keyframe above), never a continuous auto-beat loop. This suite's "motion is a single restrained gesture" rule (DESIGN.md) overrides whatever the original component's default was.
- **`prefers-reduced-motion: reduce` must collapse *all* of this story's motion** — the GlitchText settle-in AND the eyebrow/body fade-up — to their final static state instantly, via a CSS media query (the mockup's own `@media (prefers-reduced-motion: reduce)` block zeroes out `animation`, `opacity`, `transform`, and `text-shadow` together — mirror that pattern), not a JS branch.
- **The Hero headline must render as a real `<h1>`** — UX-DR15's accessibility floor ("heading order H1 hero → H3 pillars," checked again in Story 4.4) depends on this story's markup using a genuine heading element, not a styled `<div>`/`<p>`.
- **Hero copy is now confirmed, not drafted** — `mockups/landing-hero.html` gives the real eyebrow (`"// LAZY CAM — iOS CAMERA APP"`), headline (`"Clean, honest pixels."`), and body (`"The stock iPhone look is harsh and over-processed. This is how you escape it — creative control on a clean base, not a fight against Apple's forced HDR."`) — use this copy directly rather than drafting new text; it already matches the voice/tone contract (§11 of the PRD).

## Tasks / Subtasks

- [ ] Task 1: Page shell + Header-bar (AC: #1)
  - [ ] `apps/landing`'s base layout renders `<HeaderBar wordmark="LAZY " wordmarkAccent="CAM" />` (`@bmad/ui`, Story 2.4) at the top, with its `ThemeToggle` hydrated via a client directive
- [ ] Task 2: Hero section markup (AC: #2)
  - [ ] Eyebrow + `<h1>` display headline + one-line body, type-only, inside the `--m-space-container-max` (1240px) container
- [ ] Task 3: `GlitchText` (AC: #3, #4) — `apps/landing/src/components/GlitchText.tsx` (Landing-local, single-consumer)
  - [ ] Adapt `mockups/landing-hero.html`'s `heroGlitchSettle` keyframe (Dev Notes) — jitter + accent/error chromatic ghost, resolving to static type after 900ms, **never repeating**
  - [ ] Wrap the headline in this component, mounted via a client directive (e.g. `client:load`) since Astro won't hydrate it otherwise
  - [ ] Under `prefers-reduced-motion: reduce`: render the final static text immediately, no jitter/ghost frames at all — implement via the mockup's CSS media-query pattern, not a JS `matchMedia` branch, so it degrades correctly even if JS is slow to hydrate
- [ ] Task 4: Eyebrow/body fade-up (AC: #3, #4)
  - [ ] Adapt `mockups/landing-hero.html`'s `revealUp`/`scrollRevealUp` keyframes and `.reveal`/`.reveal-delay` classes for the eyebrow/body fade-up shortly after the headline settles, respecting the same `prefers-reduced-motion` collapse-to-final-state rule
- [ ] Task 5: Hero copy (AC: #2)
  - [ ] Use the confirmed copy from `mockups/landing-hero.html` (Dev Notes) verbatim: eyebrow, `<h1>` headline, body
- [ ] Task 6: Verify (AC: #1–#4)
  - [ ] Load the page — confirm Header-bar renders, GlitchText plays once (not looping) and settles, eyebrow/body fade up after
  - [ ] Enable `prefers-reduced-motion: reduce` in devtools — confirm everything renders in its final state instantly, no animation frames
  - [ ] Confirm the Hero content is capped at 1240px and the whole section is legible on both mobile and desktop widths

## Project Structure Notes

```text
apps/landing/src/
  layouts/                # base layout gains HeaderBar
  components/
    GlitchText.tsx          # new — Landing-local, single consumer
    Hero.astro (or .tsx)    # new
  pages/                   # gains the home page assembling Header + Hero
```

### References

- [Source: planning-artifacts/epics.md#Story 4.1, #UX-DR3, #UX-DR12, #UX-DR15] — acceptance criteria, component specs, GlitchText's one-shot override, H1 heading-order requirement
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — hero, #Brand & Style] — Hero layout spec, "motion is a single restrained gesture" rule
- [Source: ux-designs/ux-BMAD/mockups/landing-hero.html] — real reference CSS for the glitch-settle and fade-up keyframes, confirmed Hero copy, wordmark two-part text
- [Source: 2-4-insights-dashboard.md#Task 1] — `Header-bar`, this story's second consumer, `wordmark`/`wordmarkAccent` props
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#11. Aesthetic & Tone] — voice/tone contract, confirming the mockup's copy already fits it

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
