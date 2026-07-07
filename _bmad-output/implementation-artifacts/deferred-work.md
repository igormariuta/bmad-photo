# Deferred Work

## Deferred from: code review of 1-1-monorepo-tooling-foundation (2026-07-06)

- **`turbo test` is a permanently-green no-op** [turbo.json] — no workspace defines a `test` script, so the CI Test gate matches zero tasks and passes without verifying anything. Accepted for now per Story 1.1 Task 10; wire a real Vitest task + at least one test once Story 1.2+ introduces testable code.
- **Lint coverage skips `.astro` files** [packages/eslint-config/index.js] — the shared flat config registers no `.astro` parser/plugin, so `eslint .` in `apps/landing` never lints `.astro` sources. Expand the flat config (astro-eslint-parser + plugin) when lint rules are hardened in Story 1.3.
- **`apps/landing/tsconfig.json` declares `jsx: react-jsx` with no React dependency** — latent: the first real `.tsx` in landing will fail type-check for missing JSX runtime types. Either add React types to landing or drop the `jsx` option to match the app's actual (Astro) stack.
- **CI runs only on `pull_request`, not on push/merge to `main`** [.github/workflows/ci.yml] — a green PR that goes stale against main can land broken with no post-merge signal. Add a `push: branches: [main]` trigger (or a merge-queue check) if/when this becomes a priority; no deployment pipeline is planned for this test project, so the urgency is lower than originally noted.
