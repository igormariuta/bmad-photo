# Story 1.6: Vercel Deployment Pipeline & Privacy-safe Monitoring

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want both apps deploying automatically with privacy-safe monitoring wired in from the start,
so that later feature epics ship straight to a live preview without infra work blocking them.

## Acceptance Criteria

1. **Given** the monorepo scaffold (Story 1.1), **when** a PR is opened, **then** both `apps/gallery` and `apps/landing` deploy as static builds to a Vercel Preview Deployment; **and** merges to `main` deploy both apps to production. [Source: planning-artifacts/epics.md#Story 1.6]
2. **Given** the Vercel deployments exist, **when** Vercel Analytics + Speed Insights are configured on both apps, **then** monitoring is page-view-only, and no custom event may include a `Photo` field value or file content (AD-8). [Source: planning-artifacts/epics.md#Story 1.6; architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-8]

## Dev Notes

- **Depends on Story 1.1's scaffold existing** (pnpm workspace, `apps/gallery`, `apps/landing`, `turbo.json`). Does not depend on 1.2–1.5 — the placeholder apps from 1.1 already build/lint, which is all Vercel needs to deploy something.
- **This story has a step no dev agent can complete autonomously: connecting the GitHub repo to a Vercel account/team.** Everything below that's a repo file (`vercel.json`, env-safe SDK wiring) is buildable directly. But creating two Vercel Projects and linking them to this GitHub repository happens in the Vercel dashboard (or via `vercel link` against an authenticated account) — that requires the human operator (Igor)'s Vercel account/team and explicit action. Flag this clearly rather than assuming it's done; do the file-based parts and hand off the account-linking step.
- **App package naming (not specified upstream):** unlike `packages/*` (scoped `@bmad/*`, per Story 1.1/1.2), `apps/gallery` and `apps/landing` use plain unscoped `name` fields (`gallery`, `landing`) in their `package.json` — they're private deployables, not published/shared packages. This is what Turborepo's `--filter` targets below rely on.
- **Both apps build to static output** — Gallery (Vite SPA) outputs to `dist/` by default; Landing (Astro, static/SSG output mode) also outputs to `dist/` by default. Neither needs a Vercel serverless function runtime (matches NFR4: no server-side runtime).
- **Turborepo remote caching / CI-runner-to-Vercel cache wiring is explicitly Deferred** per the Architecture — don't set up `TURBO_TOKEN`/`TURBO_TEAM` here; a plain `turbo build --filter=<app>` per project is sufficient for this story's ACs.
- **AD-8 compliance is a discipline rule, not a mechanism this story builds:** the default Vercel Analytics + Speed Insights integration only auto-tracks page views — as long as this story (and everything after it) never calls their custom-event `track()` API with anything `Photo`-derived, AD-8 holds by omission. There's no automated lint gate for this (a lint rule that understands "does this track() call reference Photo data" isn't practically enforceable); the guardrail is: **don't introduce custom `track()` calls at all**, in this story or later ones, without revisiting AD-8 first.

## Tasks / Subtasks

- [ ] Task 1: Configure per-app Vercel project settings (AC: #1)
  - [ ] Add a `vercel.json` in each app's root (`apps/gallery/vercel.json`, `apps/landing/vercel.json`). **Do not use `turbo run build --filter=<app>` as the build command as-is** — with Root Directory set to the app folder, Vercel's working directory is already inside that folder, so a bare `--filter` command runs from the wrong cwd; either use plain `turbo run build` (Vercel's automatic workspace-scoping infers the right package from Root Directory) or explicitly prefix with `cd ../.. &&` before the filtered command, per Vercel's own Turborepo monorepo docs
  - [ ] Set each app's output directory (`dist`) in the same `vercel.json`
  - [ ] In the Vercel dashboard (manual step, see Dev Notes): create two Projects from this GitHub repo, Root Directory = `apps/gallery` and `apps/landing` respectively, Production Branch = `main`
- [ ] Task 2: Confirm PR preview + production deploy behavior (AC: #1)
  - [ ] With the two Projects linked (Task 1's manual step done), opening a PR against the repo auto-triggers a Preview Deployment for both apps; merging to `main` auto-triggers a Production deploy for both — this is Vercel's default Git integration behavior once Projects are linked, no extra config needed beyond Task 1
  - [ ] Verify by opening a throwaway PR and confirming both a gallery and a landing Preview Deployment URL appear on it
- [ ] Task 3: Wire Vercel Analytics + Speed Insights into both apps (AC: #2)
  - [ ] Add `@vercel/analytics` and `@vercel/speed-insights` as dependencies of both `apps/gallery` and `apps/landing`
  - [ ] `apps/gallery` (React/Vite): mount `<Analytics />` (from `@vercel/analytics/react`) and `<SpeedInsights />` (from `@vercel/speed-insights/react`) once at the app root, alongside the Story 1.2 root CSS import
  - [ ] `apps/landing` (Astro): use the Astro-specific integration entry points (`@vercel/analytics/astro`, `@vercel/speed-insights/astro`) in the base layout — `[ASSUMPTION]` exact Astro integration API isn't independently verifiable here for the specific package versions in use; follow whichever integration shape those installed versions document if this has changed
  - [ ] `[ASSUMPTION]` No version is pinned upstream for either `@vercel/analytics` or `@vercel/speed-insights` — pick current stable
- [ ] Task 4: Confirm page-view-only, no Photo data (AC: #2)
  - [ ] Do not add any custom `track()` call anywhere in this story's scope
  - [ ] Add an ESLint `no-restricted-imports` rule (in `packages/eslint-config`, applied to both apps) banning the `track` named export from `@vercel/analytics` — makes the "no custom events" guardrail mechanically enforced rather than discipline-only; if a real need for a custom event arises later, that's the point where AD-8 should be revisited, not silently worked around
  - [ ] After deploying, check the Vercel dashboard's Analytics tab shows page-view data only (no custom events registered)
- [ ] Task 5: Verify (AC: #1, #2)
  - [ ] `turbo build --filter=gallery` and `turbo build --filter=landing` both succeed locally, producing each app's `dist/`
  - [ ] PR preview deployment succeeds for both apps (Task 2)
  - [ ] Merge to `main` (or a dry run of the same config) produces a production deploy for both apps

## Project Structure Notes

```text
apps/gallery/vercel.json     # new
apps/landing/vercel.json     # new
```

Plus each app's root entry (Gallery `main.tsx`, Landing's base layout) gaining the Analytics/Speed Insights mount alongside the existing Story 1.2 CSS import. No new packages.

### References

- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Stack] — Hosting: Vercel (both apps; `main` → production, PR branches → Preview); Monitoring: Vercel Analytics + Speed Insights, page-view only
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-8] — photo data never crosses a network boundary; monitoring is page-view-only; no custom event may include a `Photo` field value or file content
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#Deferred] — Turborepo remote caching / CI-runner specifics explicitly left to implementation, not required here
- [Source: planning-artifacts/epics.md#Story 1.1 Additional Requirements — NFR4] — static hosting, no server-side runtime (PRD's own Cross-Cutting NFRs section is unnumbered prose; epics.md is where this is labeled NFR4)
- [Source: planning-artifacts/epics.md#Story 1.6] — acceptance criteria origin

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
