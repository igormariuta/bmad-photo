# Story 1.3: Token-usage Lint Enforcement

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want CI to fail when a hardcoded style value is used instead of a token,
so that visual drift between Gallery and Landing never lands on `main`.

## Acceptance Criteria

1. **Given** `packages/eslint-config`'s `no-arbitrary-value` rule and the token set from Story 1.2, **when** a literal color or spacing value is introduced where a token exists — in a Tailwind class string, an inline `style` prop, or CSS-in-JS — **then** `turbo lint` fails in CI. [Source: planning-artifacts/epics.md#Story 1.3]
2. **Given** the rule is applied in both apps and in `packages/ui`, **when** any of those three consumers introduces an arbitrary value, **then** the same failure is triggered, with no exemptions. [Source: planning-artifacts/epics.md#Story 1.3]
3. **Given** the AD-1 one-way dependency direction (`apps/* → packages/ui → packages/theme`), **when** `packages/theme` or `packages/ui` imports from an app, or an app bypasses `packages/ui` to import another workspace member's internal `src` path directly, **then** `turbo lint` fails via an import-boundary rule in the same `packages/eslint-config`. This AC is not explicitly written in `epics.md`'s Story 1.3 text, but Story 1.1 (Task 6) already assigned "the AD-1/AD-3 import-boundary rule" to this story, and the Architecture's Consistency Conventions table bundles it into the same CI lint-gate line as `no-arbitrary-value` — added here to resolve that cross-story assignment rather than leave it unowned. [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-1; 1-1-monorepo-tooling-foundation.md Task 6]

## Tasks / Subtasks

- [ ] Task 1: Enforce token usage in Tailwind class strings (AC: #1, #2)
  - [ ] Add `eslint-plugin-tailwindcss` to `packages/eslint-config` and enable its rule literally named `no-arbitrary-value` — the Architecture's rule name is not a coincidence; this plugin rule already flags Tailwind's bracket arbitrary-value syntax (`bg-[#fff]`, `p-[13px]`, `text-[22px]`, etc.) in class strings
  - [ ] Because Story 1.2's Tailwind preset maps every needed color/spacing/radius value into the theme scale, **no legitimate arbitrary-bracket usage should ever be required** — this rule can be a flat ban with no per-case exemption list
  - [ ] `[ASSUMPTION]` No version is pinned upstream for `eslint-plugin-tailwindcss` — pick a release compatible with whatever ESLint major (flat config, per Story 1.1) and Tailwind major (per Story 1.2) were actually installed; the rule is syntactic (scans class-string literals) so it is expected to work the same regardless of Tailwind v3 vs v4, but confirm once the actual installed version is known
  - [ ] If `packages/ui`'s components (Story 1.4/1.5) compose variant classes through a helper (e.g. `clsx`/`cva`/a local `cn()`), configure the plugin's `callees` option to include that helper's name — otherwise arbitrary values passed through it won't be scanned
- [ ] Task 2: Enforce token usage in inline `style` props (AC: #1, #2)
  - [ ] Author a local ESLint rule (no off-the-shelf rule exists for this) — embed it directly in `packages/eslint-config`'s flat config via `plugins: { local: { rules: { 'no-arbitrary-style-value': <ruleObject> } } }`; no need to publish a separate plugin package
  - [ ] Rule algorithm: visit every JSX attribute named `style` whose value is an object expression; for each property whose key is in the **color property list** (`color`, `background`, `backgroundColor`, `borderColor`, `fill`, `stroke`) or the **spacing property list** (`margin`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`, `padding`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `gap`, `rowGap`, `columnGap`, `top`, `right`, `bottom`, `left`) or is `borderRadius` — report an error if the property's value is a string or numeric literal instead of a `var(--m-*)` reference (e.g. via a template literal `` `var(--m-accent)` ``)
  - [ ] This is deliberately scoped to properties that have a corresponding token domain (color, spacing, radius) — do not flag unrelated inline-style properties (e.g. `zIndex`, `transform`, `opacity`) that have no token equivalent
- [ ] Task 3: Enforce token usage in raw CSS / CSS-in-JS surfaces (AC: #1, #2)
  - [ ] `[ASSUMPTION]` The Architecture Stack has no dedicated CSS-in-JS library (no styled-components/emotion) — the FR-4/AD-5 "CSS-in-JS" clause most plausibly maps to: (a) inline `style` props (Task 2, already covered) and (b) any literal CSS written in Astro's scoped `<style>` blocks in `apps/landing`, which ESLint's JS/JSX-based rule engine cannot see inside
  - [ ] For (b), add **Stylelint** + `stylelint-declaration-strict-value` to the toolchain, configured to require `var(--m-*)` for the `color`, `background`, `background-color`, `border-color`, `margin*`, `padding*`, `gap`, `border-radius` declarations, with `postcss-html`/`stylelint-config-html` syntax so it can parse `.astro` file `<style>` blocks
  - [ ] **Exempt `packages/theme`'s own token-definition CSS file** (`src/tokens.css` from Story 1.2) from this Stylelint rule via an `ignoreFiles` entry — that file legitimately contains the literal hex/rgba values as the single source; every other file must consume `var(--m-*)`, never redefine a competing literal
  - [ ] Wire Stylelint into each affected package's `lint` script (e.g. `eslint . && stylelint "**/*.{css,astro}"`) so `turbo lint` picks it up per Story 1.1's per-package script convention
- [ ] Task 4: Apply the rule set to all three consumers, no exemptions (AC: #2)
  - [ ] `apps/gallery`, `apps/landing`, and `packages/ui` all extend `packages/eslint-config`'s ruleset (Tailwind + inline-style rules) with zero per-file/per-line disables baked in
  - [ ] `packages/theme` is **not** one of the three consumers this AC names — it is the token source, not a token consumer, and keeps its literal values (already exempted for Stylelint in Task 3; it has no JSX so the Tailwind/inline-style rules don't apply to it anyway)
- [ ] Task 5: Verify the gate actually fails (AC: #1, #2)
  - [ ] Temporarily introduce one arbitrary value in each of the three consumers (a Tailwind bracket value, an inline `style` hex color, and — if `apps/landing` has any `.astro` file yet — a literal CSS declaration) and confirm `turbo lint` fails for each, then revert the temporary changes before finishing
  - [ ] Confirm a legitimate non-arbitrary Tailwind utility class from the Story 1.2 preset (e.g. `bg-bg`) passes cleanly
- [ ] Task 6: Build the AD-1 import-boundary rule (AC: #3)
  - [ ] Add `eslint-plugin-boundaries` (or `dependency-cruiser` wired into the `lint` script) to `packages/eslint-config`, configured with element types matching the workspace: `theme` (`packages/theme`), `ui` (`packages/ui`), `app` (`apps/*`)
  - [ ] Rule: `theme` may depend on nothing internal; `ui` may depend only on `theme`; `app` may depend on `ui` and `theme`; no element may import an app, and no package may import another workspace member's `src` by relative/deep path — only through its published package entry
  - [ ] This only needs the workspace's package boundaries (already real after Story 1.1) — it does **not** need Epic 2/3's `insights/`/`browse/` feature-folder split to exist yet; that finer-grained AD-3 selector-only boundary (`insights/` may import only `useReadablePhotos`/`useUnreadableCount`, never `browse/`) is **Story 3.1's scope**, once those selectors and folders have real content, and should be added there as its own rule rather than assumed covered here
  - [ ] Apply to all three consumers (Task 4's list), verify it fails on a deliberately-introduced violation (e.g. a throwaway import from `apps/gallery` into `packages/ui/src/internal-thing` bypassing the package entry point), then revert

## Dev Notes

- **Depends on Story 1.2 being implemented first** — this story enforces usage of the token set 1.2 defines; without real tokens to check against, there is nothing for the rule to allow as the "correct" alternative.
- **Package naming:** `packages/eslint-config` ships as `@bmad/eslint-config` per the convention established in Story 1.1's Dev Notes.
- **This story only builds the enforcement mechanism** — it does not touch any component or app UI beyond the throwaway verification snippets in Task 5 (which must be reverted, not left in place).
- **Naming is intentional, not coincidental:** the Architecture explicitly calls this "the `no-arbitrary-value` rule," matching `eslint-plugin-tailwindcss`'s actual rule name — use that plugin rather than hand-rolling Tailwind-class detection from scratch.
- **Cross-story resolution:** Story 1.1 already named this story as the owner of "the AD-1/AD-3 import-boundary rule," and the Architecture bundles it with `no-arbitrary-value` on the same CI lint-gate line — this story (AC #3/Task 6) now owns the AD-1 package-direction half of that. The AD-3 half (the `insights/`/`browse/` selector-only boundary) is deliberately left to **Story 3.1**, since the folders exist as empty placeholders only until then and there is nothing real to write an enforceable rule against yet — this is a scope split, not an unresolved gap.

### Project Structure Notes

- Touches only `packages/eslint-config` (new rules/plugins) plus each consumer's existing `lint` script wiring (`apps/gallery`, `apps/landing`, `packages/ui` — all already scaffolded by Story 1.1).
- No new packages or apps.

### References

- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-5] — "no-arbitrary-value rule... covers inline `style` props and CSS-in-JS, not just Tailwind class strings — a hex value smuggled through `style={{color: '#fff'}}` is exactly the escape hatch this rule exists to close"
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-1] — cross-reference to the same eslint-config package also carrying the (separately-scoped, see Dev Notes) import-boundary rule
- [Source: planning-artifacts/epics.md#Story 1.3] — acceptance criteria origin
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#FR-4] — token-usage enforcement requirement, original wording

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
