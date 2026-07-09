---
baseline_commit: 3d29931f1650fb7265adcbd0f26123f3b00ed621
---

# Story 4.4: Coming Soon Close & Cross-cutting Compliance

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Maya,
I want to leave informed rather than pressured,
so that I trust the brand's honesty even without signing up.

## Acceptance Criteria

1. **Given** the page footer, **when** it renders, **then** it ends on a passive "coming soon" note, with no form, email field, waitlist, purchase, or App Store link anywhere on the page. [Source: planning-artifacts/epics.md#Story 4.4]
2. **Given** all Landing copy, **when** it is written, **then** it follows the plain, non-editorializing voice/tone contract (e.g. "The stock look is harsh. This is how you escape it.") — no marketing fluff or exclamation-point energy, across both Gallery and Landing copy. [Source: planning-artifacts/epics.md#Story 4.4]
3. **Given** different viewport widths, **when** the page renders, **then** it shows single-column full-width sections below `sm`, wider gutters `sm`–`lg`, and content capped at the 1240px container at `≥lg`. [Source: planning-artifacts/epics.md#Story 4.4]
4. **Given** the page's heading structure, **when** assessed for accessibility, **then** heading order (H1 hero → H3 pillars) is correct, and the theme-toggle is the only interactive control beyond standard links. [Source: planning-artifacts/epics.md#Story 4.4, #UX-DR15]
5. **Given** the theme-toggle, **when** used, **then** it persists to `localStorage`, respects `prefers-color-scheme` on first visit, and shows no flash-of-wrong-theme. [Source: planning-artifacts/epics.md#Story 4.4]
6. **Given** JavaScript is disabled or slow, **when** the page loads, **then** it remains fully legible top to bottom (static SSG), with only the theme-toggle depending on JS. [Source: planning-artifacts/epics.md#Story 4.4]

## Dev Notes — read this first

**This story is mostly a cross-cutting close-out sweep, not a big new component** — Stories 4.1–4.3 already built Header/Hero, Pillars, and Preset-showcase. This story adds the footer and then audits the *whole* page against ACs #2–#6, which span everything already built.

- **Depends on Stories 4.1, 4.2, 4.3 all implemented.**
- **Footer copy is confirmed, not drafted — an earlier version of this story missed it.** No mockup covers the footer, but `EXPERIENCE.md`'s Voice and Tone table states it exactly: **`"Coming soon."`** — and explicitly annotates it `(Landing footer, no more)`, meaning that line *is* the whole footer message, not an opening for additional embellished copy. Use it verbatim; do not draft alternate phrasing or pad it with more sentences.
- **Gap-fill: the theme-flash-prevention inline `<script>` (Story 1.5, Task 14) was assigned generically to "both apps' HTML shell," but Landing's actual page/layout wasn't built until Story 4.1 — and Story 4.1's own tasks didn't explicitly include wiring this script into Landing's base layout `<head>`.** Verify it's actually there; if not, add it now — this story's AC #5 ("no flash-of-wrong-theme") is exactly what that script exists to guarantee, so this is the natural place to close the gap if 4.1 missed it.
- **AC #2's "across both Gallery and Landing copy" is broader than just this story's own footer text** — it's auditing the voice/tone contract across everything written in Epic 4 (and implicitly Gallery's copy from Epic 2, e.g. Story 2.1's empty-state line, though that's Gallery not Landing and already confirmed via its own mockup). Treat this AC as a final copy-consistency pass across Stories 4.1–4.4, not license to rewrite anything already confirmed by a mockup.
- **AC #4's "theme-toggle is the only interactive control beyond standard links"** is a real constraint on scope creep — if any of Stories 4.1–4.3 accidentally introduced a button/form beyond the theme-toggle and plain anchor links, that's a defect to fix here, not something to wave through.
- **AC #6 requires no special mechanism to build** — Astro's static-by-default rendering (Story 4.1's Dev Notes already established this) means all page content is server-rendered HTML with no client JS required to be legible; only components explicitly given a client directive (`GlitchText`, `ThemeToggle`) depend on JS. Verify this holds, don't add new no-JS fallback code.
- **Responsive audit (AC #3) is a check against what 4.1–4.3 already built**, not new layout code, unless an inconsistency turns up — all three sections used the same `--m-space-container-max` (1240px) container and the same gutter tokens from Story 1.2, so this should already hold; confirm rather than assume.

## Tasks / Subtasks

- [x] Task 1: Footer (AC: #1, #2)
  - [x] Render the confirmed copy verbatim: **`"Coming soon."`** — nothing more added to it (per `EXPERIENCE.md`'s explicit "no more" annotation)
  - [x] Confirm no form, email field, waitlist, purchase, or App Store link anywhere on the page (not just the footer)
- [x] Task 2: Verify the theme-flash-prevention script is wired on Landing (AC: #5)
  - [x] Check Story 4.1's actual base-layout `<head>` for the inline blocking script from Story 1.5, Task 14 — add it now if missing
- [x] Task 3: Cross-page audits (AC: #2, #3, #4, #6)
  - [x] Voice/tone: re-read all Landing copy (Hero, Pillars, Preset, Footer) for marketing fluff or exclamation-point energy — fix any that slipped through
  - [x] Responsive: confirm single-column below `sm`, wider gutters `sm`–`lg`, 1240px cap at `≥lg`, consistently across all sections
  - [x] Accessibility: confirm exactly one `<h1>` (Hero) and `<h3>`s (Pillars) with no skipped levels, and no interactive control beyond the theme-toggle and plain anchor links anywhere on the page
  - [x] No-JS: disable JavaScript in devtools, reload — confirm all content is legible; only the theme-toggle (and GlitchText's animation, which degrades to static text without JS per Story 4.1) should visibly not work
- [x] Task 4: Verify (AC: #1–#6)
  - [x] Full page walkthrough at mobile/desktop widths, with and without JS, with and without a stored theme preference, checking each AC explicitly

## Project Structure Notes

Touches `apps/landing/src/` — adds a footer section/component and audits existing Stories 4.1–4.3 output. No new packages.

### References

- [Source: planning-artifacts/epics.md#Story 4.4, #UX-DR15, #UX-DR16, #UX-DR20, #UX-DR21] — acceptance criteria, accessibility/responsive/voice-tone/theme-toggle requirements
- [Source: ux-designs/ux-BMAD/EXPERIENCE.md#Voice and Tone, #Key Flows UJ-2] — confirmed exact footer copy ("Coming soon.", explicitly "no more"), Maya's resolution beat this story implements
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#11. Aesthetic & Tone] — voice/tone contract
- [Source: 1-5-shared-component-library-display-feedback-navigation-primitives.md#Task 14] — theme-flash-prevention script this story verifies/completes for Landing
- [Source: 4-1-header-hero.md, 4-2-value-pillars.md, 4-3-preset-showcase.md] — the sections this story audits

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

### Completion Notes List

- New `Footer.astro` (Landing-local, no client directive — pure static SSG) renders the confirmed copy verbatim, `"Coming soon."`, nothing added; wired into `index.astro` after `PresetComparison`. Confirmed zero forms/inputs/links anywhere on the page (Playwright: `forms: 0, linkCount: 0`).
- Task 2 audit: theme-flash-prevention inline `<script>` was already wired into `apps/landing/src/layouts/Layout.astro`'s `<head>` (added during Story 4.1) — verified present and correct, no gap to close, no code change needed.
- Task 3 audit found and fixed one real defect: `PresetComparison.tsx` rendered its heading as `<h2>`, which — per `deferred-work.md`'s own note from the 4.3 review — compounded Story 4.2's already-deferred heading-hierarchy gap (three `<h3>` pillar titles under the `<h1>` with no `<h2>` between). AC #4's literal wording ("heading order H1 hero → H3 pillars") defines the correct target page-wide, and the stray `<h2>` was the one heading that broke it. Changed to `<h3>` — page heading sequence is now `H1, H3, H3, H3, H3` (verified live), matching the AC exactly; no other component introduced a stray level.
- Voice/tone re-read across Hero/Pillars/Preset/Footer copy: all lines already match `EXPERIENCE.md`'s Do column (plain statements, no exclamation-point energy) — no changes needed.
- Responsive audit: all sections already share the same `px-gutter`/`max-w-container-max` design tokens (Story 1.2); grids collapse to a single column below `md` (stricter than the `sm` floor required by AC #3, which is a valid superset). No inconsistency found — confirmed, not modified, per Dev Notes' guidance not to redesign a pre-existing systemic token.
- Accessibility audit: after the `<h2>`→`<h3>` fix, exactly one `<button>` exists on the page (`aria-label="Switch to dark theme"` / `"Switch to light theme"`), zero other interactive controls, zero `<a>` tags.
- No-JS audit: confirmed via a JS-disabled Playwright context — `<h1>`, all four `<h3>`s, and the footer's exact text all render; `GlitchText` degrades to its static `<span>` text (CSS animation is not JS-gated); only the theme-toggle is visibly non-functional (SSR default icon/state, no click handler attached), as expected.
- Live-verified end-to-end via a headless Playwright script against the production build (`astro build` output served statically, not `astro dev`, to rule out dev-toolbar contamination — an early run against a stray pre-existing `astro dev` server on the same port produced false failures from its dev toolbar/HMR overlay, corrected by serving `dist/` on its own port): desktop 1280px light+dark, mobile 390px light, `prefers-color-scheme: dark` on first visit (no stored preference), persisted `localStorage` theme applied pre-hydration (no flash), theme-toggle click-and-persist, zero unexpected console errors, and JS-disabled legibility. A full-page screenshot with the default (non-reduced) motion setting showed a rendering artifact (missing pillar 3, ghosted header) caused by Chromium's full-page capture interacting with `animation-timeline: view()` scroll-driven CSS — a known class of limitation already flagged in `deferred-work.md` for Story 4.2's `.scroll-reveal`, not a functional regression; re-captured with `prefers-reduced-motion: reduce` (which `app.css` already collapses to the final visible state) to confirm the actual mobile layout is correct — all 3 pillar cards and both split-compare blocks render correctly, single-column, footer at the bottom.
- `turbo lint build test` clean across all 8 tasks (`@bmad/ui`, `@bmad/theme`, `@bmad/gallery`, `@bmad/landing`); Gallery's 113/113 Vitest tests unaffected; Landing has no unit-test framework (established precedent since Story 4.1) — verification is via the live Playwright pass above.

### File List

- apps/landing/src/components/Footer.astro (new)
- apps/landing/src/pages/index.astro (modified — import + render Footer)
- apps/landing/src/components/PresetComparison.tsx (modified — heading `<h2>` → `<h3>`, fixes AC #4 heading-order defect)

### Review Findings

3-layer adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 0 decisions, 1 patch applied, 0 deferred, 13 dismissed as noise (incl. two independent flags of the `<h1>`→`<h3>` heading jump, refuted: the Acceptance Auditor confirmed this is AC #4's own explicit target structure and the diff fixes a worse pre-existing non-monotonic H1→H3→H2 order; a duplicate-`<footer>`-landmark concern and an import-order concern were also refuted on inspection).

- [x] [Review][Patch] Footer skips the shared `div.mx-auto.max-w-container-max` wrapper convention used by every other section (AC #3 consistency) [apps/landing/src/components/Footer.astro:11]

## Change Log

- 2026-07-09: Story 4.4 implemented — Footer ("Coming soon.", verbatim) + cross-cutting compliance audit of Stories 4.1–4.3. Found and fixed one real defect (PresetComparison's stray `<h2>` breaking the H1→H3 heading order required by AC #4); confirmed the theme-flash-prevention script, voice/tone, responsive tokens, and no-JS legibility all already held. `turbo lint/build/test` clean (8/8 tasks); live-verified via headless Playwright against the production build (desktop/mobile, light/dark, first-visit OS preference, persisted preference, no-JS).
- 2026-07-09: Code review (3-layer adversarial: Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 1 patch applied (Footer's `<p>` now wrapped in the shared `div.mx-auto.max-w-container-max` convention, matching every other section), 13 dismissed as noise. `turbo lint/build` re-verified clean.
