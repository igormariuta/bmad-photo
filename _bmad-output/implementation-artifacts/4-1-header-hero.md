---
baseline_commit: a8435d10913a09af33c3f5ef938db2f5235cd6d9
---

# Story 4.1: Header & Hero

Status: done

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

- [x] Task 1: Page shell + Header-bar (AC: #1)
  - [x] `apps/landing`'s base layout renders `<HeaderBar wordmark="LAZY " wordmarkAccent="CAM" />` (`@bmad/ui`, Story 2.4) at the top, with its `ThemeToggle` hydrated via a client directive
- [x] Task 2: Hero section markup (AC: #2)
  - [x] Eyebrow + `<h1>` display headline + one-line body, type-only, inside the `--m-space-container-max` (1240px) container
- [x] Task 3: `GlitchText` (AC: #3, #4) — `apps/landing/src/components/GlitchText.tsx` (Landing-local, single-consumer)
  - [x] Adapt `mockups/landing-hero.html`'s `heroGlitchSettle` keyframe (Dev Notes) — jitter + accent/error chromatic ghost, resolving to static type after 900ms, **never repeating**
  - [x] Wrap the headline in this component, mounted via a client directive (e.g. `client:load`) since Astro won't hydrate it otherwise
  - [x] Under `prefers-reduced-motion: reduce`: render the final static text immediately, no jitter/ghost frames at all — implement via the mockup's CSS media-query pattern, not a JS `matchMedia` branch, so it degrades correctly even if JS is slow to hydrate
- [x] Task 4: Eyebrow/body fade-up (AC: #3, #4)
  - [x] Adapt `mockups/landing-hero.html`'s `revealUp`/`scrollRevealUp` keyframes and `.reveal`/`.reveal-delay` classes for the eyebrow/body fade-up shortly after the headline settles, respecting the same `prefers-reduced-motion` collapse-to-final-state rule
- [x] Task 5: Hero copy (AC: #2)
  - [x] Use the confirmed copy from `mockups/landing-hero.html` (Dev Notes) verbatim: eyebrow, `<h1>` headline, body
- [x] Task 6: Verify (AC: #1–#4)
  - [x] Load the page — confirm Header-bar renders, GlitchText plays once (not looping) and settles, eyebrow/body fade up after
  - [x] Enable `prefers-reduced-motion: reduce` in devtools — confirm everything renders in its final state instantly, no animation frames
  - [x] Confirm the Hero content is capped at 1240px and the whole section is legible on both mobile and desktop widths

### Review Findings

- [x] [Review][Patch] `client:only="react"` on HeaderBar drops all SSR fallback markup, violating AC #1 under no-JS/slow-JS and going broader than the actual bug required [apps/landing/src/layouts/Layout.astro:37] — 3 independent review layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) converged on this. `client:only` means the built page ships an empty `<astro-island>` for the whole HeaderBar (confirmed in `dist/index.html`) — the wordmark and theme-toggle render nothing at all until JS loads/hydrates, a functional violation of "the shared Header-bar... appears at the top" for no-JS, blocked-JS, or slow-hydration visitors, and a guaranteed flash-of-missing-header/layout shift even under normal JS. The actual bug (ThemeToggle's icon/aria-label wrong on first paint) only affected `ThemeToggle`'s own state-derived attributes, not the static wordmark/markup — demoting the entire `HeaderBar` to `client:only` is a broader fix than the bug required. **Fixed:** reverted `Layout.astro` to `client:load` (full SSR fallback restored, confirmed non-empty `<astro-island>` in `dist/index.html`) and fixed the true root cause in `packages/ui/src/ThemeToggle/ThemeToggle.tsx` instead — initial render now always starts at the SSR-safe default (`"light"`, never reading `document`) so it matches server markup exactly (no hydration mismatch), then a `useIsomorphicLayoutEffect` (real `useLayoutEffect` on the client, a no-op `useEffect` during Astro's build-time SSR pass to avoid the React SSR warning) corrects to the real theme via a genuine post-mount render, which — unlike the hydration commit itself — reliably patches the DOM. Live-verified via Playwright: both dark-start and light-start cases now show the correct icon/`aria-label` on first paint with zero console warnings/errors, and Gallery's pure-CSR `ThemeToggle` usage is unaffected (`useLayoutEffect` there runs synchronously before first paint, same as before this change).
- [x] [Review][Patch] Missing `<meta name="viewport">` makes Task 6's "legible on mobile widths" verification unreliable [apps/landing/src/layouts/Layout.astro head] — Acceptance Auditor: pre-existing gap from Story 1.1's scaffold (confirmed via `git show` at baseline), but this story's own Task 6 subtask ("Confirm... legible on both mobile and desktop widths", checked `[x]`) was specifically responsible for catching it. Without the viewport tag, real mobile browsers (notably iOS Safari) fall back to a ~980px virtual viewport and scale down, so the page won't actually be legible on a physical phone regardless of the CSS — Playwright's `setViewportSize` bypasses this exact quirk, so the reported live verification passed without catching it. **Fixed:** added `<meta name="viewport" content="width=device-width, initial-scale=1.0">` to `Layout.astro`'s `<head>`, matching Gallery's existing convention (`apps/gallery/index.html`). Confirmed present in the built `dist/index.html`.
- [x] [Review][Defer] `GlitchText`'s one-shot animation has no guard against remounts [apps/landing/src/components/GlitchText.tsx] — deferred, pre-existing limitation of the component design, not currently reachable. Blind Hunter: the "never loops" guarantee holds only within a single mount (no `infinite` in the keyframe); if a future change causes `GlitchText` to remount (a key change, a prop-driven remount, etc.), the settle-in would replay. Not reachable by any code path in this story (`Hero.astro` is fully static, nothing causes a remount), so not actionable now — revisit if `GlitchText` ever gains props/state that could trigger a remount.

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

claude-sonnet-5

### Debug Log References

- `npx turbo lint build test` — full monorepo, clean (10/10 tasks, no regressions)
- `npx turbo lint build --filter=@bmad/landing` — clean before and after each fix pass
- Live verification via headless Playwright (chromium, installed ephemerally for this session — not a project dependency) against `astro preview` on the production build: golden-path desktop, `prefers-reduced-motion: reduce`, and a 390px mobile viewport; screenshots of light/dark theme

### Completion Notes List

- First real `apps/landing` content and the first Astro page in the project. Added `@astrojs/react` + `react`/`react-dom` (pinned to `19.2.7`, matching `packages/ui`'s peer dependency) so React islands (`HeaderBar`, `GlitchText`) can be hydrated via client directives — required infrastructure implied by the story's own Dev Notes (Astro renders zero client JS by default), not a scope addition.
- `GlitchText` (`apps/landing/src/components/GlitchText.tsx`) is a thin wrapper applying the `.hero-glitch` class; the keyframes/timing are adapted directly from `mockups/landing-hero.html` per Dev Notes, unchanged, and are inherently one-shot (no `infinite` iteration count) — satisfying the "never a continuous auto-beat loop" override without extra logic.
- `Hero.astro` is a static (non-hydrated) component — only the `<h1>`'s `GlitchText` child needs a client directive; the eyebrow/body fade-up is pure CSS (`.reveal`/`.reveal-delay`), matching the mockup's own CSS-only approach.
- All Tailwind classes use existing `packages/theme` tokens (`text-eyebrow`, `text-display`, `max-w-container-max`, `px-gutter`, `py-hero-padding`, `mt-6` for the mockup's 24px rhythm, etc.) — no arbitrary values, consistent with the repo's `tailwindcss/no-arbitrary-value` lint rule and `stylelint-declaration-strict-value` token enforcement.
- **Real bug found and fixed (live verification, not caught by lint/build/typecheck):** dark mode never reached the page background outside the Header-bar — same root cause and same fix as Story 3.1's Gallery-app bug (`html`/`body` base `background-color`/`color` rule using `var(--m-bg)`/`var(--m-fg)`, since neither `packages/theme` nor `Layout.astro` paints a page background on its own). Added to `apps/landing/src/styles/app.css`.
- **Real bug found and fixed (live verification):** `ThemeToggle`'s `useState` initializer correctly computed the theme from `document.documentElement.classList` (confirmed via instrumentation — it read the correct value), but with `client:load`, Astro's build-time SSR pass pre-renders the button with `document` undefined (defaulting to "light"), and React's `hydrateRoot` + immediate `root.render()` (as used internally by `@astrojs/react`'s client runtime) does not patch that attribute mismatch — the icon/`aria-label` stayed wrong (backwards) until the user's first click, in both the dark-start and light-start cases tested. Initial fix (`client:only="react"` on `HeaderBar`, scoped to `apps/landing`) was itself flagged and superseded during code review — see Review Findings; the surviving fix is in `packages/ui/src/ThemeToggle/ThemeToggle.tsx` itself (SSR-safe deterministic default + `useIsomorphicLayoutEffect` correction), preserving full SSR fallback markup and benefiting any future server-pre-rendered consumer, with zero behavior change for Gallery's pure-CSR usage.
- No unit/component test infra exists for `apps/landing` (no Vitest config, consistent with this app having no prior real content) and no Playwright suite is committed anywhere in the repo; verification followed the project's established pattern (turbo lint/build clean + live browser verification) since this story is markup/CSS/motion with no unit-testable logic.

### File List

- apps/landing/package.json (added `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom`)
- apps/landing/astro.config.mjs (added `@astrojs/react` integration)
- apps/landing/src/layouts/Layout.astro (renders `HeaderBar` via `client:load`; added viewport meta tag)
- apps/landing/src/pages/index.astro (assembles `Layout` + `Hero`)
- apps/landing/src/components/Hero.astro (new)
- apps/landing/src/components/GlitchText.tsx (new)
- apps/landing/src/styles/app.css (hero glitch-settle/reveal-up keyframes + reduced-motion collapse; html/body dark-mode background base rule)
- packages/ui/src/ThemeToggle/ThemeToggle.tsx (SSR-safe deterministic default + `useIsomorphicLayoutEffect` correction — code-review fix)
- pnpm-lock.yaml (dependency install)

## Change Log

- 2026-07-08: Implemented Story 4.1 — first real `apps/landing` content and the first Astro page in the project. Added `@astrojs/react` so `HeaderBar`/`GlitchText` can be hydrated as client islands; `Hero.astro` (eyebrow + `<h1>` + body, confirmed copy from `mockups/landing-hero.html`) with the GlitchText one-shot settle-in (`apps/landing/src/components/GlitchText.tsx`) and CSS-only eyebrow/body fade-up, both collapsing to their final static state under `prefers-reduced-motion: reduce`. Found and fixed two real bugs during live verification: dark mode not reaching the page background outside Header-bar (same fix as Story 3.1's Gallery bug); `HeaderBar`'s `ThemeToggle` rendering the wrong icon/`aria-label` on first paint because `client:load`'s SSR pre-render (built with `document` undefined) wasn't corrected by hydration — switched to `client:only="react"`, scoped to `apps/landing`'s `Layout.astro` only. turbo lint/build/test clean (10/10 tasks, no regressions); live-verified via headless Playwright (golden path, `prefers-reduced-motion: reduce`, 390px mobile viewport, light/dark theme screenshots).
- 2026-07-08: Code review (3-layer adversarial: Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 0 decision-needed, 2 patches applied, 1 deferred, 8 dismissed as noise. Patches: (1) the `client:only="react"` fix above was itself a regression — it drops all SSR fallback for the entire `HeaderBar`, so no-JS/slow-JS visitors get no header at all, a broader and worse violation of AC #1 than the bug it fixed; reverted to `client:load` and fixed the true root cause in `packages/ui/src/ThemeToggle/ThemeToggle.tsx` instead (SSR-safe deterministic default + `useIsomorphicLayoutEffect` post-mount correction — real `useLayoutEffect` on the client, so Gallery's pure-CSR usage keeps its original flash-free behavior; a no-op `useEffect` during Astro's build-time SSR pass to avoid a React SSR warning); (2) added the missing `<meta name="viewport">` tag (pre-existing gap from Story 1.1's scaffold that this story's own Task 6 mobile-legibility check should have caught but didn't, since Playwright's viewport emulation bypasses the real-mobile-browser quirk it causes). Deferred: `GlitchText`'s one-shot animation has no remount guard — not reachable by any current code path (`Hero.astro` is static), see deferred-work.md. turbo lint/build/test clean (10/10 tasks, forced no-cache); live-verified via headless Playwright — both dark-start and light-start cases now show the correct `ThemeToggle` icon/`aria-label` on first paint with zero console warnings/errors, full HeaderBar SSR markup confirmed present in `dist/index.html`, viewport meta tag confirmed present.
