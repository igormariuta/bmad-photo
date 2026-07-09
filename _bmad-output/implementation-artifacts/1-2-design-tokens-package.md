---
baseline_commit: 00d3680e4562128633889a9323fa86c838b843fa
---

# Story 1.2: Design Tokens Package

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a single-source design-tokens package,
so that both apps render identical visual primitives and a token change propagates everywhere.

## Acceptance Criteria

1. **Given** `packages/theme`, **when** it is built, **then** it exports the 10 Brutalist-mono color tokens (`bg`, `fg`, `accent`, `line`, `panel`, `card`, `muted`, `muted2`, `dim`, `error`) with light/dark values as CSS custom properties (`--m-*`); **and** it exports the full typography scale (`display`/`h1`/`h3`/`prose`/`body`/`caption`/`eyebrow`/`data-label`) across the Space Grotesk and JetBrains Mono families; **and** it exports the 4px-base spacing scale with named rhythm values (`section-rhythm`, `item-gap`, `card-padding`, `control-height`, `header-height`) and `rounded.DEFAULT = 0` as the only radius value; **and** it ships a Tailwind preset built on these tokens. [Source: ux-designs/ux-BMAD/DESIGN.md front-matter (colors/typography/spacing/rounded)]
2. **Given** the token package is published to the workspace, **when** an app imports its CSS once at its root entry point (`main.tsx` / the Astro base layout), **then** no per-component re-import is required. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-5]

## Tasks / Subtasks

- [x] Task 1: Define the 10 color tokens as CSS custom properties (AC: #1)
  - [x] In `packages/theme`, create a CSS entry (e.g. `src/tokens.css`) defining exactly these 10 tokens on `:root`, no more, no fewer: `--m-bg`, `--m-fg`, `--m-accent`, `--m-line`, `--m-panel`, `--m-card`, `--m-muted`, `--m-muted2`, `--m-dim`, `--m-error`
  - [x] Light values (default, on `:root`): `bg=#f4f4f4`, `fg=#161616`, `accent=#4d7c0f`, `line=#161616`, `panel=#e4e4e4`, `card=#eaeaea`, `muted=#6b6b6b`, `muted2=#8c8c8c`, `dim=#d6d6d6`, `error=#b91c1c`
  - [x] Dark overrides (under a `.dark` class selector — matches the inherited Theme-toggle's documented "toggles the `.dark` class" behavior, ported in Story 1.5): `bg=#181818`, `fg=#dcdcdc`, `accent=#cdff48`, `line=#e6e6e6`, `panel=rgba(42,42,42,0.70)`, `card=rgba(35,35,35,0.70)`, `muted=#9a9a9a`, `muted2=#7a7a7a`, `dim=#383838`, `error=#ff6b6b`
  - [x] These literal hex/rgba values belong here and only here — this file **is** the single source; Story 1.3's `no-arbitrary-value` lint rule targets *consumers* hand-rolling a competing value, not this token definition itself
- [x] Task 2: Define the typography scale (AC: #1)
  - [x] Two font-family custom properties: `--m-font-display` → `'Space Grotesk'`, `--m-font-body` → `'JetBrains Mono'`
  - [x] Per-role tokens (font-size / font-weight / line-height / letter-spacing) for all 8 roles — values exactly as specified:
    | Role | Family | Size | Weight | Line-height | Letter-spacing |
    |---|---|---|---|---|---|
    | `display` | display | 40px | 700 | 1.04 | -0.02em |
    | `h1` | display | 32px | 700 | 1.04 | -0.02em |
    | `h3` | display | 18px | 600 | 1.18 | 0 |
    | `prose` | body | 14px | 400 | 1.85 | 0 |
    | `body` | body | 14px | 400 | 1.6 | 0 |
    | `caption` | body | 12px | 400 | 1.4 | 0 |
    | `eyebrow` | body | 11px | 500 | 1.2 | 0.12em |
    | `data-label` | body | 11px | 500 | 1.2 | 0.12em |
  - [x] `eyebrow` and `data-label` are byte-for-byte identical scale entries (only their *applied color* differs by usage — `accent` for eyebrow, `muted2` for data-label — which is a component-level concern for Stories 1.4/1.5, not a separate token here); do not invent a second token to distinguish them
  - [x] All 8 roles named in the AC (`display/h1/h3/prose/body/caption/eyebrow/data-label`) are covered in the table above — every value is source-confirmed in DESIGN.md's front-matter
- [x] Task 3: Define the spacing scale and the radius token (AC: #1)
  - [x] 4px-base numeric scale: `--m-space-1=4px` … `--m-space-8=32px`, `--m-space-10=40px` (steps: 1,2,3,4,5,6,7,8,10 — no gaps invented, this matches DESIGN.md exactly, it is not a continuous 1–10)
  - [x] Named rhythm tokens (AC-required): `--m-space-section-rhythm=40px`, `--m-space-item-gap=28px`, `--m-space-card-padding=20px`, `--m-space-control-height=36px`, `--m-space-header-height=64px`
  - [x] Additional named tokens present in the design source (include for completeness — later stories depend on them): `--m-space-gutter=40px`, `--m-space-container-max=1240px`, `--m-space-article-max=780px`, `--m-space-hero-padding=34px`
  - [x] Radius: `--m-radius-default=0px` — the **only** radius value in the system; do not define any other radius token
  - [x] **Z-index scale (not in DESIGN.md, discovered in the NOT LAZY reference `imports/notlazy-tokens.css` — needed by Select's dropdown in Story 1.4 and by Modal/Toaster in Story 1.5, so centralize it here rather than each component inventing its own):** `--m-z-content=10`, `--m-z-dropdown=40`, `--m-z-header=50`, `--m-z-modal=60`, `--m-z-toast=70`. (The reference source also has a `--m-z-rain=65` for a NOT LAZY-specific easter egg — intentionally omitted, not applicable to this suite.)
- [x] Task 4: Ship a Tailwind preset built on the tokens above (AC: #1)
  - [x] Export a Tailwind preset from `packages/theme` at a fixed subpath — `@bmad/theme/tailwind-preset` (declared in the package's `exports` map) — mapping colors → `theme.colors` (referencing the CSS vars, e.g. `bg: 'var(--m-bg)'`), font families/sizes → `theme.fontFamily`/`fontSize`, spacing → `theme.spacing`, and `borderRadius.DEFAULT` → `0px`. Each consuming app/package imports this fixed subpath rather than inventing its own import path.
  - [x] `[ASSUMPTION]` No Tailwind CSS version is pinned anywhere in the Architecture Stack table despite this AC requiring a preset — pick current stable Tailwind and note the choice. If Tailwind v4+ is used, its CSS-first `@theme` config largely replaces the JS-preset pattern; adapt the mechanism to whatever major version is actually installed rather than assuming the v3 `tailwind.config.js` `presets` array shape
  - [x] `[ASSUMPTION]` Web font loading/hosting is not specified anywhere upstream — self-host Space Grotesk + JetBrains Mono (e.g. via `@fontsource` packages) so no runtime call to a font CDN is introduced; this keeps the "no photo/Metadata network egress" spirit of the suite's privacy stance intact even though fonts carry no user data. Flag for confirmation if a different approach is preferred
- [x] Task 5: Wire the single root-level CSS import (AC: #2)
  - [x] `packages/theme` exports one consolidated CSS entry point (e.g. `packages/theme/dist/index.css` via package `exports`)
  - [x] `apps/gallery`: import it exactly once, at the app's root entry point (standard Vite/React convention: `main.tsx`) — Story 1.1's structural seed doesn't literally name this file, but it's the standard entry Vite scaffolds
  - [x] `apps/landing`: import it exactly once, in the Astro base layout (standard Astro convention: a shared `Layout.astro` under `src/layouts/` or equivalent) — likewise not literally named in Story 1.1's tree, follow whatever base-layout file Story 1.1's actual Astro scaffold produced
  - [x] No other file in either app imports `packages/theme`'s CSS — components style themselves via Tailwind classes / the preset, never a second raw CSS import
- [x] Task 6: Verify (AC: #1, #2)
  - [x] `turbo build` and `turbo lint` still pass across the workspace with real token content in place of Story 1.1's placeholders
  - [x] Visually spot-check (e.g. a throwaway test page) that toggling a `.dark` class on a root ancestor swaps all 10 color tokens correctly

### Review Findings

_Code review 2026-07-06 — workflow-backed high-effort review (finder + independent verifier per finding). Result: 3/3 findings confirmed and fixed._

- [x] [Review][Fix] Tailwind v4 preset was shipped but never actually wired into either app — no `tailwindcss` dependency, no Vite/PostCSS plugin, no `@import "tailwindcss"` anywhere in `apps/gallery`/`apps/landing`, so any future component using a utility class like `bg-bg` would render unstyled. **Fixed:** added `@tailwindcss/vite` + `tailwindcss` to both apps, wired the plugin into `apps/gallery/vite.config.ts` and `apps/landing/astro.config.mjs`, and created one app-level CSS entry per app (`apps/gallery/src/app-shell/app.css`, `apps/landing/src/styles/app.css`) that `@import`s the raw tokens, `tailwindcss`, and the preset together — so each app's root entry point still performs exactly one CSS import (AC #2), but Tailwind now actually compiles against real app content. Verified: `turbo build` succeeds and Tailwind's preflight (`box-sizing: border-box`) plus the raw `--m-*` tokens are both present in the compiled output of both apps.
- [x] [Review][Fix] `packages/theme/package.json`'s `main`/`types` fields duplicated the new `exports` map's `.` entry, risking silent drift if only one is updated later. **Fixed:** removed the redundant top-level `main`/`types` fields; `exports` alone now defines the package entry point (consistent with the project's `moduleResolution: "Bundler"` tsconfig base).
- [x] [Review][Dismiss] Stray untracked `summaty.txt` at repo root (a Russian-language scratch summary of Story 1.1) — predates this story's session and isn't part of its File List; flagged to the user rather than deleted unilaterally.

## Dev Notes

- **Story 1.1 must be implemented first.** This story fills in real content where 1.1 left placeholder entry points in `packages/theme`; if `1-1-monorepo-tooling-foundation.md`'s Dev Agent Record / File List is still empty when this story starts, halt and implement 1.1 first — there is no scaffold to build on top of otherwise.
- **Package naming convention (not specified in Architecture — established here for consistency across all packages):** use the `@bmad/<name>` npm scope for every workspace package, e.g. `@bmad/theme`, `@bmad/ui`, `@bmad/eslint-config`, `@bmad/tsconfig` (matches `project_name: BMAD`). Apply this retroactively to whatever Story 1.1 actually named `packages/theme`'s `package.json` if it differs.
- **AD-1 still applies:** `packages/theme` has zero internal workspace dependencies — this story only adds CSS/token content and a Tailwind preset export, never a dependency on `packages/ui` or an app.
- **AD-5 is this story's core binding rule:** one token source, CSS custom properties (`--m-*`) + Tailwind preset, each app imports the CSS once at its root. `packages/eslint-config`'s `no-arbitrary-value` rule (enforcing that nothing downstream hand-rolls a competing value) is **Story 1.3's scope, not this one** — this story only needs to *exist and export* the tokens correctly.
- **Scope discipline:** do not build any component here (Stories 1.4/1.5) — `components:` entries in DESIGN.md's front-matter (button-primary, field, histogram-bar, etc.) describe how *later* components will consume these tokens; they are not additional primitives this story must export.
- Exactly **10** color tokens, **no more** — DESIGN.md is explicit that these are "ten tokens per theme, unchanged from NOT LAZY"; do not add an 11th for convenience.
- Radius is a **hard identity constraint**, not a default: `rounded.DEFAULT = 0px` is the only radius value that may ever exist in this token set — DESIGN.md calls a single rounded corner anywhere in the suite "a defect, not a stylistic variant."

### Project Structure Notes

- Touches only `packages/theme` (content) and one line each in `apps/gallery/src/main.tsx` and `apps/landing`'s Astro base layout (the single CSS import) — both files/locations already exist as placeholders from Story 1.1.
- No new packages or apps are created in this story.

### References

- [Source: ux-designs/ux-BMAD/DESIGN.md front-matter — colors, typography, spacing, rounded] — exact token values (this is the authoritative machine-readable source, more precise than the prose sections below it)
- [Source: ux-designs/ux-BMAD/DESIGN.md#Colors] — token usage rules (`accent` never decorative, `error` never decorative, etc.)
- [Source: ux-designs/ux-BMAD/DESIGN.md#Typography] — eyebrow vs data-label distinction, heading tracking rule
- [Source: ux-designs/ux-BMAD/DESIGN.md#Layout & Spacing] — 4px grid rule, section-rhythm vs item-gap usage rule
- [Source: ux-designs/ux-BMAD/DESIGN.md#Shapes] — square-corners hard constraint
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-5] — one-source-of-truth + single root CSS import rule
- [Source: planning-artifacts/epics.md#Story 1.2] — acceptance criteria origin

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

- `apps/gallery`'s `tsc --noEmit` build failed with TS2882 (`Cannot find module or type declarations for side-effect import of '@bmad/theme/index.css'`) after adding the CSS import in `main.tsx` — Vite's ambient `ImportMeta`/asset-import types weren't referenced anywhere in the app. Fixed by adding `apps/gallery/src/vite-env.d.ts` with `/// <reference types="vite/client" />` (standard Vite scaffold file Story 1.1 omitted).
- Verified the Tailwind v4 `@theme` mapping actually compiles: ran the real `@tailwindcss/cli@4.3.2` engine against `tailwind-preset.css` with a probe HTML file referencing `bg-bg`, `text-h1`, `font-display`, `p-section-rhythm`, `rounded`. First pass showed `.rounded { border-radius: 0.25rem }` — Tailwind's own default `--radius` value was winning because I'd named the override `--radius-DEFAULT` instead of the v4-correct bare `--radius` key (confirmed against `tailwindcss/theme.css` source). Fixed the key name; recompiled and confirmed `.rounded { border-radius: var(--radius) }` with `--radius: var(--m-radius-default)` correctly wired. All temp verification files removed after the check.
- Verified light/dark token swap programmatically (parsed `colors.css`, confirmed all 10 `--m-*` tokens exist in both `:root` and `.dark` with differing values) rather than leaving a permanent throwaway HTML page in the repo — AC's "e.g." wording doesn't require a persisted test page, and this is a more exact/repeatable check.
- `pnpm build` (4/4), `pnpm lint` (5/5), and `pnpm test` (0 tasks, unchanged no-op per Story 1.1) all pass end-to-end.

### Completion Notes List

- Implemented all 10 color tokens (`colors.css`), the full 8-role typography scale + 2 font families (`typography.css`), and the spacing/radius/z-index scale (`spacing.css`) as CSS custom properties in `packages/theme/src`, composed into a single `index.css` entry point.
- Self-hosted Space Grotesk (700/600) and JetBrains Mono (400/500) via `@fontsource/*` packages imported from `typography.css` — no font CDN call, per the story's privacy-stance ASSUMPTION.
- Shipped a Tailwind v4 preset at the fixed subpath `@bmad/theme/tailwind-preset` (declared in `package.json` `exports`), using v4's CSS-first `@theme` block (no `tailwind.config.js` preset object — v4 replaces that mechanism, per the story's ASSUMPTION about adapting to whatever major version is installed). Picked Tailwind 4.3.2 (current stable at implementation time) since no version was pinned upstream.
- Mapped colors → `--color-*`, font families → `--font-*`, all 8 typography roles → `--text-*` (+ line-height/letter-spacing/font-weight companion vars), spacing (numeric + named) → `--spacing-*`, and the radius identity constraint → `--radius` (0px) — all referencing the raw `--m-*` tokens so there is exactly one source of truth.
- Wired the single root CSS import: `apps/gallery/src/app-shell/main.tsx` imports `@bmad/theme/index.css` once; for `apps/landing`, Story 1.1 had not actually created a base-layout file (only a single `index.astro` with inline `<html>`), so this story adds the standard Astro `src/layouts/Layout.astro` (accepting a `title` prop) that performs the one CSS import, and updates `index.astro` to render through it — matching the AC's literal "Astro base layout" wording and standard Astro convention, and giving Epic 4's landing-page stories a shared layout to build on.
- `packages/theme`'s own `src/index.ts` (JS placeholder export) is untouched — this story's ACs only require CSS custom properties + a Tailwind preset, no JS token API, so no scope was added there.
- Full workspace verification: `turbo build` 4/4 packages succeed (theme, ui, gallery, landing), `turbo lint` 5/5 succeed, `turbo test` remains a 0-task no-op (unchanged from Story 1.1 — no test framework introduced, matching this story's own Task 6 verification method of build/lint + token-swap check rather than unit tests).

### File List

- `packages/theme/src/colors.css` (new)
- `packages/theme/src/typography.css` (new)
- `packages/theme/src/spacing.css` (new)
- `packages/theme/src/index.css` (new)
- `packages/theme/src/tailwind-preset.css` (new)
- `packages/theme/package.json` (modified — `exports` map, `@fontsource/*` dependencies, `tailwindcss` devDependency; `main`/`types` removed as redundant per review)
- `apps/gallery/src/app-shell/main.tsx` (modified — single root CSS import)
- `apps/gallery/src/app-shell/app.css` (new — bundles raw tokens + `tailwindcss` + preset behind one import, per review fix)
- `apps/gallery/src/vite-env.d.ts` (new — Vite client types, needed for the CSS side-effect import to type-check)
- `apps/gallery/vite.config.ts` (modified — added `@tailwindcss/vite` plugin, per review fix)
- `apps/gallery/package.json` (modified — added `tailwindcss` + `@tailwindcss/vite` devDependencies, per review fix)
- `apps/landing/src/layouts/Layout.astro` (new — base layout with the single root CSS import)
- `apps/landing/src/pages/index.astro` (modified — renders through `Layout.astro`)
- `apps/landing/src/styles/app.css` (new — bundles raw tokens + `tailwindcss` + preset behind one import, per review fix)
- `apps/landing/astro.config.mjs` (modified — added `@tailwindcss/vite` plugin, per review fix)
- `apps/landing/package.json` (modified — added `tailwindcss` + `@tailwindcss/vite` devDependencies, per review fix)
- `pnpm-lock.yaml` (modified — new dependencies)

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-06 | Implemented the full design-tokens package: 10 color tokens (light/dark), 8-role typography scale with self-hosted fonts, spacing/radius/z-index scale, and a Tailwind v4 `@theme` preset at `@bmad/theme/tailwind-preset`. Wired the single root CSS import into `apps/gallery` (`main.tsx`) and `apps/landing` (new `Layout.astro`). All ACs satisfied; `turbo build`/`turbo lint` pass across the workspace; dark-mode token swap and Tailwind preset compilation verified. |
| 2026-07-06 | Addressed code review findings (2 fixed, 1 dismissed as pre-existing/out-of-scope): actually wired the Tailwind engine into both apps via `@tailwindcss/vite` (previously the preset was exported but never compiled against real app content); removed redundant `main`/`types` fields from `packages/theme/package.json` now that `exports` covers them. |
