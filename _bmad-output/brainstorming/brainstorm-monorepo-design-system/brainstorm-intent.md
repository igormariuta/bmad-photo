# Monorepo + Shared Design System — Brainstorm Intent

**Intent:** Build a monorepo with a shared design system powering two products, to nail the technical foundation. It's a pet project whose real purpose is to exercise BMAD architecture end-to-end.

## Products in Scope
1. **Landing** — Astro SSG marketing page for an iOS camera app.
2. **Gallery** — Vite + React SPA: EXIF photo gallery/sorter with filtering.
3. **Design system** — shared component library consumed by both.

## Key Constraint
- Pet project to exercise BMAD architecture. Sharpen the tooling, but minimize friction and avoid deep rabbit holes.

## Architecture Decisions (the spine)
- **Monorepo:** pnpm workspaces + Turborepo.
- **Structure:** feature-based everywhere.
- **Packages:** `packages/{theme, ui, eslint-config, tsconfig}`.
- **Apps:** `apps/{landing (Astro SSG, zero-JS, React islands consuming shared ui), gallery (Vite React SPA)}`.
- **Sharing:** workspace-internal only (latest-internal via symlink). **NO versioning/publishing at this stage** — explicitly reversed from an earlier "publishable + changesets" decision to keep friction low.
- **Component loop:** Storybook-driven — build component + states, verify in Storybook, import into app, use.
- **Toolchain:** homogeneous Vite (Astro + Vite gallery) — one toolchain, fits the minimal-friction goal.

## Core Design-System Principle (session's key insight)
- **One UI system, not two.** Consistency is guaranteed by **tokens** (enforced, by construction). Lib-membership is a **pure reuse decision**, orthogonal to consistency: 2+ places → lib; one-off → lives in the app but still token-driven.
- Result: "two UI systems" is impossible by design. Even one-off landing elements consume the same tokens.
- **Enforcement:** Tailwind theme + ESLint `no-arbitrary-value` — bans bracket/arbitrary values (`bg-[#hex]`, `mt-[13px]`), but ALL standard token-mapped utility classes stay allowed.

## Aesthetic — Brutalist Mono
- Raw, high-contrast, monospace type, visible structure, hard edges, minimal ornament.
- **Why it matters architecturally:** the rigid token scale IS the aesthetic, so `no-arbitrary-value` becomes style, not just discipline. Single mono typeface simplifies the theme. Minimal-JS brutalism justifies Astro zero-JS islands. Constraint and style agree.

## Build Order (from Backcasting)
1. **Theme tokens first** — colors / fonts / spacing / rhythm / style, seeded from user's existing drafted theme.
2. **First primitives** — Button, Input, Header + nav.
3. **Gallery.**
4. **Landing last.**

## Design-System Inventory
**Foundations:** colors, typography, geometry, layout tokens (spacing + rhythm, letter-spacing, line-height).

**Primitives**
- **Buttons:** variants primary / outline / danger; states default + disabled; icon-only (no text); button-with-loader.
- **Forms:** input, textarea, select, switch, checkbox, radio; labels + field errors.
- **Data:** progressbar, EXIF categories, possibly charts.
- **Nav/layout:** shared Header; ~unified content width across platforms.
- **Overlays/feedback:** modals, notification toasts (default + danger), global spinner/loader; ~shared 404/error page look.

## Deferred / Open
- Exact spacing scale, precise component specs and states → handed to UX design (`bmad-ux`).
- Gallery/EXIF-specific components decided later as needs emerge.
