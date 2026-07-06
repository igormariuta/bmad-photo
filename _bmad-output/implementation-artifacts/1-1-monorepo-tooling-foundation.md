---
baseline_commit: 138c1a7d9ffbe8f2766b3a11c97073321b1bbcf2
---

# Story 1.1: Monorepo & Tooling Foundation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a working pnpm+Turborepo monorepo scaffold with pinned tooling and a CI gate,
so that all subsequent feature work builds on a consistent, enforced foundation.

## Acceptance Criteria

1. **Given** an empty repo, **when** the scaffold is applied, **then** `apps/{gallery,landing}` and `packages/{theme,ui,eslint-config,tsconfig}` exist per the Architecture structural seed, with `turbo.json` and `pnpm-workspace.yaml` wiring them into one workspace; **and** pnpm 11.10.0, Turborepo 2.10.3, and TypeScript 6.0.3 are pinned exactly as specified in the Architecture stack table. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Stack, #Structural Seed]
2. **Given** the monorepo scaffold exists, **when** a PR is opened, **then** CI runs `turbo lint` + `turbo test` + `turbo build`; **and** the PR fails if any of those commands fail. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Consistency Conventions (Lint / CI gate row)]

## Tasks / Subtasks

- [x] Task 1: Initialize the pnpm workspace root (AC: #1)
  - [x] Create root `package.json` (private, `"packageManager": "pnpm@11.10.0"`)
  - [x] Create `pnpm-workspace.yaml` with `packages: ["apps/*", "packages/*"]`
  - [x] Add root devDependencies: `turbo@2.10.3`, `typescript@6.0.3` (pinned exactly — not `^`/`~`)
- [x] Task 2: Wire Turborepo pipeline (AC: #1, #2)
  - [x] Create `turbo.json` defining `lint`, `test`, `build` pipeline tasks (and `dev` if useful), with `build` depending on `^build`
  - [x] Add root scripts `"lint": "turbo lint"`, `"test": "turbo test"`, `"build": "turbo build"`
- [x] Task 3: Scaffold `packages/tsconfig` (AC: #1)
  - [x] Base `tsconfig.json` (strict mode) other packages/apps extend
- [x] Task 4: Scaffold `packages/theme` (AC: #1, #2)
  - [x] `package.json` with **zero internal workspace dependencies** (AD-1, AD-5 — this package must never depend on `ui` or an app)
  - [x] Add `lint` and `build` scripts to its `package.json` — Turborepo only runs a task in a package that defines that script itself; the root `turbo.json` pipeline does not cascade a script into packages that lack it (see Task 10 note)
  - [x] Minimal placeholder entry point only — do not implement the actual token set here; that is Story 1.2's scope
- [x] Task 5: Scaffold `packages/ui` (AC: #1, #2)
  - [x] `package.json` depending only on `packages/theme` (AD-1: `apps/* → packages/ui → packages/theme`, never the reverse)
  - [x] Add `lint` and `build` scripts to its `package.json` (same reason as Task 4)
  - [x] Minimal placeholder entry point only — real components arrive in Stories 1.4/1.5
- [x] Task 6: Scaffold `packages/eslint-config` (AC: #1, #2)
  - [x] `package.json` + a base flat ESLint config consumable by both apps and `packages/ui` — no version is pinned upstream for ESLint itself; pick a current flat-config-compatible release
  - [x] Add a `lint` script (even if it only lints its own source) so `turbo lint` has something to run here too
  - [x] Do **not** implement `no-arbitrary-value` or the AD-1/AD-3 import-boundary rule here — that is Story 1.3's scope; this story only needs `turbo lint` to run and pass with a baseline ruleset
- [x] Task 7: Scaffold `apps/gallery` (AC: #1, #2)
  - [x] Vite + React SPA, pinned `react@19.2.7`, `vite@8.1.3`
  - [x] Depends on `packages/ui` + `packages/theme` per AD-1 (even though both are placeholders at this point)
  - [x] Add `lint` and `build` scripts to its `package.json` (same reason as Task 4)
  - [x] `src/` follows the Architecture structural seed's feature-sliced layout as empty placeholder folders (`app-shell/`, `features/{ingest,insights,browse,photo-detail}/`, `store/`, `worker/`) so later stories drop code into pre-agreed locations — do not implement feature logic here
- [x] Task 8: Scaffold `apps/landing` (AC: #1, #2)
  - [x] Astro SSG, pinned `astro@7.0.6`
  - [x] Depends on `packages/ui` + `packages/theme` per AD-1
  - [x] Add `lint` and `build` scripts to its `package.json` (same reason as Task 4)
  - [x] `src/{pages,components}` placeholder structure per the structural seed
- [x] Task 9: Add CI workflow (AC: #2)
  - [x] Create `.github/workflows/ci.yml` (no workflow file exists yet — `.github/agents` is unrelated BMAD tooling, do not confuse the two) triggered on pull_request
  - [x] Steps, in order: `actions/checkout` → enable pnpm at the pinned version (`corepack enable` + `corepack prepare pnpm@11.10.0 --activate`, or `pnpm/action-setup@v4` pinned to version `11.10.0`) → `actions/setup-node` (see Dev Notes on Node version — pnpm is not available on a stock runner without one of these steps) → `pnpm install --frozen-lockfile` → `turbo lint` → `turbo test` → `turbo build`, in that order
  - [x] Pipeline fails the check if any command fails (default `exit code != 0` behavior — no special handling needed)
- [x] Task 10: Verify the scaffold end-to-end (AC: #1, #2)
  - [x] `pnpm install` succeeds and produces a committed `pnpm-lock.yaml`
  - [x] `turbo build` and `turbo lint` actually execute in every package/app (each defines the script per Tasks 4–8) — a package silently missing the script makes the CI gate a no-op for that workspace member, which defeats AC #2
  - [x] `turbo test` runs clean locally; packages/apps with no `test` script yet are simply skipped by Turborepo — this one is not a failure, unlike `build`/`lint` above

## Dev Notes

- This is the **first story in the project** — the repo currently contains no `apps/` or `packages/` directories, no `turbo.json`, and no `pnpm-workspace.yaml`. There is nothing to preserve or avoid regressing; this story creates the structure from nothing.
- **No separate starter template/CLI is used.** The Architecture explicitly provides the structural seed as this story's scaffold instead of a generated template — follow the seed's tree exactly, do not substitute a `create-vite`/`create-astro` default layout that diverges from it. [Source: planning-artifacts/epics.md#Additional Requirements — "Starter Template"]
- **AD-1 (one-way package dependency)** is the one architectural rule this story must physically establish, even before any real component/token code exists: dependency direction is strictly `apps/* → packages/ui → packages/theme`; `packages/theme` has zero internal deps. Get the `package.json` `dependencies`/workspace-protocol wiring right now — later stories (1.2–1.5) will add real content into these packages without needing to restructure dependencies.
- **Scope discipline:** this story is scaffolding + CI only. Do not implement the design tokens (Story 1.2), the `no-arbitrary-value`/import-boundary lint rules (Story 1.3), or any shared component (Stories 1.4/1.5). Placeholder/empty entry points in `packages/theme` and `packages/ui` are correct and expected here.
- **Versions are pinned exactly**, not range-based (`^`/`~`), per the Architecture Stack table: pnpm 11.10.0, Turborepo 2.10.3, React 19.2.7, Vite 8.1.3, Astro 7.0.6, TypeScript 6.0.3. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Stack]
- Vitest (4.1.10) and Storybook (10.4.6) are also pinned in the Stack table for later stories (test suite in 1.2+/Epic 2's normalization layer; Storybook in 1.4/1.5) — no need to wire actual test files or Storybook config in this story, but if a root/devDependency placement is convenient to add now, pin the exact version.
- Hosting/CI: Vercel deployment wiring (preview + production) is **Story 1.6's scope**, not this one — this story's CI workflow only needs to run the `turbo lint`/`test`/`build` gate on PRs.
- **`[ASSUMPTION]` Node.js engine version:** not specified anywhere in the PRD, Architecture, or epics — pin **Node 22 (Active LTS)** via an `engines` field in the root `package.json` and `actions/setup-node` in CI, matched by a matching local `.nvmrc`/`.node-version`. Confirm with the team if a different LTS is intended; nothing downstream depends on a specific minor version yet.
- **CI runner needs pnpm enabled before `pnpm install` will work** — a stock GitHub Actions runner does not ship pnpm. Use `corepack enable` + `corepack prepare pnpm@11.10.0 --activate` (or `pnpm/action-setup@v4` pinned to `11.10.0`) ahead of the install step, matching the `packageManager` field from Task 1.
- **Package naming convention (not specified in Architecture):** name every workspace package under the `@bmad/<name>` npm scope — `@bmad/theme`, `@bmad/ui`, `@bmad/eslint-config`, `@bmad/tsconfig` (matches `project_name: BMAD`). Established here so Story 1.2 onward can rely on it consistently.

### Project Structure Notes

Structural seed to create exactly (placeholders where noted; do not add speculative files beyond this list):

```text
apps/
  gallery/                  # Vite + React SPA
    src/
      app-shell/            # placeholder — populated in Epic 2/3
      features/
        ingest/
        insights/
        browse/
        photo-detail/
      store/                # placeholder — Zustand store arrives in Epic 2 (AD-3)
      worker/                # placeholder — EXIF worker arrives in Epic 2 (AD-2)
  landing/                  # Astro SSG
    src/
      pages/
      components/
packages/
  theme/                    # zero internal deps (AD-1/AD-5) — placeholder entry only
  ui/                       # depends only on theme (AD-1) — placeholder entry only
  eslint-config/            # baseline flat config; no-arbitrary-value rule is Story 1.3
  tsconfig/                 # shared base tsconfig.json
turbo.json
pnpm-workspace.yaml
.github/workflows/ci.yml    # new — no existing workflow file to conflict with
```

No conflicts/variances detected against the Architecture structural seed — this story reproduces it verbatim as the initial scaffold. `.github/agents/*.agent.md` (BMAD agent definitions) already exists and is unrelated to the CI workflow being added.

### References

- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Stack] — exact version pins
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Structural Seed] — directory tree this story must produce
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-1 — One-way package dependency] — dependency direction rule
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Consistency Conventions] — Lint/CI gate row (`turbo lint` + `turbo test` + `turbo build` on every PR)
- [Source: planning-artifacts/epics.md#Additional Requirements] — "no separate starter template" decision; CI gate description
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#12. Platform] — Gallery = Vite+React SPA mobile-first; Landing = Astro SSG

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

- `pnpm install` initially hit `[ERR_PNPM_IGNORED_BUILDS]` for `esbuild`'s postinstall script (pnpm's new supply-chain build-approval gate); resolved by setting `allowBuilds.esbuild: true` in `pnpm-workspace.yaml`.
- `turbo lint` initially failed with `eslint: command not found` in `theme`/`ui`/`gallery`/`landing` — pnpm workspaces don't hoist a sibling workspace package's devDependency binaries, so each consumer of `@bmad/eslint-config` needs its own `eslint` devDependency to run the `eslint` CLI. Added `eslint@10.6.0` directly to each.
- `turbo build` initially failed with TS5011 (`rootDir` must be explicit) once `theme`/`ui` switched from `tsc --noEmit` to real declaration emission; fixed by adding `"rootDir": "src"` to both tsconfigs.
- Verified end-to-end: `pnpm install` (lockfile committed), `turbo build` (4/4 packages with a build script succeed, no warnings), `turbo lint` (5/5 packages with a lint script succeed), `turbo test` (0 tasks — no package defines `test` yet, expected per Task 10 note).

### Completion Notes List

- Scaffolded the full Architecture structural seed from an empty repo: `apps/{gallery,landing}`, `packages/{theme,ui,eslint-config,tsconfig}`, `turbo.json`, `pnpm-workspace.yaml`, `.github/workflows/ci.yml`.
- All Stack versions pinned exactly as specified: pnpm 11.10.0 (via `packageManager` + corepack), Turborepo 2.10.3, TypeScript 6.0.3, React 19.2.7, Vite 8.1.3, Astro 7.0.6.
- AD-1 one-way dependency direction physically wired: `packages/theme` has zero internal workspace deps; `packages/ui` depends only on `@bmad/theme`; both apps depend on `@bmad/ui` + `@bmad/theme`.
- `packages/eslint-config` ships a baseline flat config (ESLint 10.6.0 + typescript-eslint 8.62.1) with no import-boundary or `no-arbitrary-value` rule — that's explicitly Story 1.3's scope.
- `packages/theme` and `packages/ui` contain placeholder entry points only (`export {}`), per scope discipline — no tokens or components implemented here.
- Node 22 pinned via root `package.json` `engines`, `.nvmrc`, `.node-version`, and CI's `actions/setup-node` — this is an `[ASSUMPTION]` per the story's Dev Notes since no LTS version was specified upstream; flag to the team if a different version is intended.
- All workspace packages use the `@bmad/<name>` npm scope per the story's naming convention.
- CI workflow (`.github/workflows/ci.yml`) runs on `pull_request`: checkout → corepack-enable pnpm 11.10.0 → setup-node 22 → `pnpm install --frozen-lockfile` → `turbo lint` → `turbo test` → `turbo build`, failing the check on any non-zero exit.

### File List

- `.github/workflows/ci.yml`
- `.gitignore`
- `.node-version`
- `.nvmrc`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `turbo.json`
- `apps/gallery/package.json`
- `apps/gallery/tsconfig.json`
- `apps/gallery/eslint.config.js`
- `apps/gallery/vite.config.ts`
- `apps/gallery/index.html`
- `apps/gallery/src/app-shell/main.tsx`
- `apps/gallery/src/app-shell/App.tsx`
- `apps/gallery/src/features/ingest/.gitkeep`
- `apps/gallery/src/features/insights/.gitkeep`
- `apps/gallery/src/features/browse/.gitkeep`
- `apps/gallery/src/features/photo-detail/.gitkeep`
- `apps/gallery/src/store/.gitkeep`
- `apps/gallery/src/worker/.gitkeep`
- `apps/landing/package.json`
- `apps/landing/tsconfig.json`
- `apps/landing/eslint.config.js`
- `apps/landing/astro.config.mjs`
- `apps/landing/src/pages/index.astro`
- `apps/landing/src/components/.gitkeep`
- `packages/theme/package.json`
- `packages/theme/tsconfig.json`
- `packages/theme/eslint.config.js`
- `packages/theme/src/index.ts`
- `packages/ui/package.json`
- `packages/ui/tsconfig.json`
- `packages/ui/eslint.config.js`
- `packages/ui/src/index.ts`
- `packages/eslint-config/package.json`
- `packages/eslint-config/index.js`
- `packages/eslint-config/eslint.config.js`
- `packages/tsconfig/package.json`
- `packages/tsconfig/base.json`

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-06 | Initial implementation: full monorepo scaffold (apps/gallery, apps/landing, packages/theme, packages/ui, packages/eslint-config, packages/tsconfig), turbo.json + pnpm-workspace.yaml wiring, CI gate (turbo lint/test/build on PR). All ACs satisfied; verified end-to-end. |
