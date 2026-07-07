# Deferred Work

## Deferred from: code review of 2-2-in-browser-metadata-extraction-web-worker (2026-07-07)

- **No `worker.onerror` handler in `ingestPhotos.ts`** [apps/gallery/src/features/ingest/ingestPhotos.ts] — an uncaught worker-level exception would leave `fileCount` flipped with no `complete` ever arriving, stranding the UI in Loading forever. Low-probability given current code has no unguarded throw path outside `parseFile`'s try/catch; belongs with Story 2.3's progress/error UX.
- **No `URL.revokeObjectURL` anywhere** [apps/gallery/src/features/ingest/ingestPhotos.ts] — `thumbnailUrl`s would accumulate once a session re-ingests. Unreachable in this story (no repeat-ingest entry point exists yet); AD-4 ties revocation to a "full-session reset" trigger that Story 2.5 will introduce.
- **`ingestPhotos()` has no in-flight guard** [apps/gallery/src/features/ingest/ingestPhotos.ts] — concurrent invocations would race on `commitPhotos()`, last `complete` silently wins. Unreachable today (EmptyState unmounts after the first pick, no "Add more" entry point yet); Story 2.5 will reuse this function from a live repeat-ingest control and needs this guard.
- **The 100-photo cap is checked only in `EmptyState.tsx`, not re-checked inside `ingestPhotos()` itself** [apps/gallery/src/features/ingest/EmptyState.tsx, apps/gallery/src/features/ingest/ingestPhotos.ts] — correct for this story's single call site (satisfies AD-2's "before any file reaches the worker"); Story 2.5's cumulative cap will need the check at the ingest-orchestration boundary.
- **`exif-worker.ts`'s `catch` silently discards ExifReader's actual thrown error with no logging** [apps/gallery/src/worker/exif-worker.ts] — conflates "corrupt file" with "valid file, no EXIF" into the same `error` message, matching the spec's explicit instruction to treat both cases identically; losing diagnostic signal for genuine parse bugs is a real but minor hardening gap.
- **`parseCapturedAt`'s regex validates only digit-grouping shape, not semantic date correctness** [apps/gallery/src/worker/normalize.ts] — e.g. month `13` would pass through unchanged. Out of this story's stated scope (format conversion only); worth a note for Story 2.4's hour-of-day bucketing.
- **No automated test exercises `exif-worker.ts` itself or the `progress`/`error`/`complete` message sequence** [apps/gallery/src/worker/exif-worker.ts] — all 13 Vitest tests target only `normalize.ts`'s pure helpers. Spec-compliant (Task 6 explicitly scoped unit tests to `normalize.ts` only); real coverage gap resting on one manual Playwright session, worth a future Vitest+jsdom worker test.

## Deferred from: code review of 2-1-empty-state-client-side-photo-ingest (2026-07-07)

- **Non-image files aren't filtered before reaching `ingestFiles`/the store** [apps/gallery/src/features/ingest/EmptyState.tsx] — `accept="image/*"` isn't OS-enforced, so a non-image file can be selected and land in `rawFiles` unfiltered. This is Story 2.2's EXIF-worker job (AD-2 marks unreadable files via `error`/`readable:false`), not this story's.
- **No path back from the transitional `Loading` placeholder to `EmptyState`** [apps/gallery/src/app-shell/App.tsx] — once a valid selection is made, there's no reset/cancel affordance. Intentional given this story's stub scope: Story 2.2/2.3 replace this branch entirely with the real worker pipeline/progress UI, so building a reset path now would be throwaway work.

## Deferred from: code review of 1-1-monorepo-tooling-foundation (2026-07-06)

- **`turbo test` is a permanently-green no-op** [turbo.json] — no workspace defines a `test` script, so the CI Test gate matches zero tasks and passes without verifying anything. Accepted for now per Story 1.1 Task 10; wire a real Vitest task + at least one test once Story 1.2+ introduces testable code.
- **Lint coverage skips `.astro` files** [packages/eslint-config/index.js] — the shared flat config registers no `.astro` parser/plugin, so `eslint .` in `apps/landing` never lints `.astro` sources. Expand the flat config (astro-eslint-parser + plugin) when lint rules are hardened in Story 1.3.
- **`apps/landing/tsconfig.json` declares `jsx: react-jsx` with no React dependency** — latent: the first real `.tsx` in landing will fail type-check for missing JSX runtime types. Either add React types to landing or drop the `jsx` option to match the app's actual (Astro) stack.
- **CI runs only on `pull_request`, not on push/merge to `main`** [.github/workflows/ci.yml] — a green PR that goes stale against main can land broken with no post-merge signal. Add a `push: branches: [main]` trigger (or a merge-queue check) if/when this becomes a priority; no deployment pipeline is planned for this test project, so the urgency is lower than originally noted.

## Deferred from: code review of 1-4-shared-component-library-core-interactive-primitives (2026-07-07)

- **No `forwardRef` on any component** [packages/ui/src/Button/Button.tsx] — blocks imperative focus / react-hook-form-style integration. Out of this story's exact prop-shape scope.
- **No `name`/rest-prop passthrough on `Field`/`Textarea`/`Select`/`Switch`/`Checkbox`** [packages/ui/src/Field/Field.tsx] — blocks native form participation and custom attributes (`RadioGroup` has `name`).
- **`Select` has no hidden mirrored `<input>`** [packages/ui/src/Select/Select.tsx] — can't participate in native form submission despite exposing `required`/`aria-required`.
- **Error text has no `aria-describedby` wiring** [packages/ui/src/FieldError/FieldError.tsx] — `FieldError` accepts no `id`. Revisit alongside any `FieldError`→`Field` fold.
- **Select's listbox options have no stable `id`s / `aria-activedescendant`** [packages/ui/src/Select/Select.tsx] — a11y gap in the custom combobox pattern.
- **`Field`/`Textarea` recompute `isControlled` every render** [packages/ui/src/Field/Field.tsx, packages/ui/src/Textarea/Textarea.tsx] — toggling `value` between defined/undefined across renders triggers React's uncontrolled→controlled warning. Foot-gun under misuse, not a bug under intended usage.
- **`Select`'s `clampIndex` clamps instead of cycling** [packages/ui/src/Select/Select.tsx] — arrow-key nav stops dead at list ends instead of wrapping.
- **`Select` assumes unique `option.value`s** [packages/ui/src/Select/Select.tsx] — duplicates produce duplicate React keys and ambiguous `.find()` resolution.
- **Storybook config has an empty `addons: []`** [packages/ui/.storybook/main.ts] — no controls/actions/a11y/docs addon configured.
- **Storybook `backgrounds` parameter uses `var(--m-bg)`** [packages/ui/.storybook/preview.ts] — likely won't resolve in the manager/toolbar iframe (separate context from the themed preview).
- **Most story files' `meta.args` define dead dummy props** [packages/ui/src/Checkbox/Checkbox.stories.tsx and similar] — every exported story immediately overrides them via its own `render()`.
- **`react`/`react-dom` peer/dev dependencies pinned to exact patch versions, no range** [packages/ui/package.json] — matches this repo's established exact-pin convention (Story 1.1); a monorepo-wide convention question, not this story's alone to decide.
- **`Button`'s anchor form has no default `rel`/`target` safety net** [packages/ui/src/Button/Button.tsx] — no auto `rel="noopener noreferrer"` when `target="_blank"` is passed.
- **`@heroicons/react` baked directly into `Checkbox`/`Field` with no override escape hatch** [packages/ui/src/Checkbox/Checkbox.tsx, packages/ui/src/Field/Field.tsx] — unlike `IconSubmitButton`, which accepts an `icon` prop. Dev Notes explicitly directed adopting `@heroicons/react` for parity; making it swappable is future work.
- **Select's type-ahead doesn't cycle matches on a repeated character** [packages/ui/src/Select/Select.tsx] — e.g. "w","w","w" for "Web" stops matching after the first repeat. Spec only requires jump-to-first-match, not repeat-cycling.
