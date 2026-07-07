---
baseline_commit: 241b21e0ef3ccc6f5d29f5d6180755a35217feeb
---

# Story 1.4: Shared Component Library — Core Interactive Primitives

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the core form/input components built once and demonstrated in Storybook,
so that Gallery and Landing consume one implementation instead of duplicating it.

## Acceptance Criteria

1. **Given** `packages/theme` (Story 1.2), **when** Button (primary/outline/danger + href/Submit/Icon forms), Field, Textarea, Select, Switch, Checkbox, RadioGroup, Label, and FieldError are implemented in `packages/ui`, **then** each renders exclusively via tokens — no arbitrary values (verifiable by Story 1.3's lint rule). [Source: planning-artifacts/epics.md#Story 1.4]
2. **Given** the above, **then** each component ships at least one co-located `.stories.tsx` file rendering its primary states. [Source: planning-artifacts/epics.md#Story 1.4]

## Dev Notes — read this first

**This story has a real reference implementation, not just a prose spec.** The suite's whole component set is "inherited wholesale" from a production system called NOT LAZY (`lazy-blog-front`). Its actual `.tsx` component source is not in this repo, but three files under `planning-artifacts/ux-designs/ux-BMAD/imports/` capture its exact consumer-facing API and CSS: `notlazy-design-guide.tsx` (a Storybook-like demo page that *uses* every component — this is where every prop shape below was extracted from, lines 573–934), `notlazy-tokens.css`, and `notlazy-mono-layer.css` (the actual Tailwind `@layer components` utility classes each component is built from). **Read all three before starting** — this Dev Notes section summarizes what's needed, but the source files have more surrounding context.

- **Depends on Stories 1.1, 1.2, and 1.3 being implemented first, in that order.** 1.3's lint gate should already be active while building these components, so any accidental arbitrary value is caught immediately instead of discovered later.
- **Package naming:** `packages/ui` ships as `@bmad/ui`, depending only on `@bmad/theme` (AD-1) per the convention in Story 1.1's Dev Notes.
- **File layout convention (established here, not specified upstream):** one folder per component under `packages/ui/src/<ComponentName>/`, containing `<ComponentName>.tsx` + a co-located `<ComponentName>.stories.tsx`; every component re-exported from a single `packages/ui/src/index.ts` barrel.
- **`[ASSUMPTION]` Icon library:** no icon package is pinned anywhere in the Architecture Stack table. The NOT LAZY reference imports `@heroicons/react` (`/24/solid` and `/24/outline`), including `CheckIcon`, `EyeIcon`, and `EyeSlashIcon` — these are never shown wired directly to Field's password toggle or Checkbox's checkmark within the specific usage lines this story cites, but they're the only icons in the file's import list that semantically fit those two jobs. Treat the *library choice* as solid (adopt `@heroicons/react` for parity) and the *exact icon-for-checkmark/eye-toggle pairing* as a reasonable inference, not a directly-observed fact — confirm visually once built.
- **Storybook is not configured yet anywhere in the repo.** This is the first story that needs it. Set it up once, in `packages/ui` (the shared library, per FR-3 "developed in isolation via Storybook") — pinned version **10.4.6** per the Architecture Stack table, Vite-based builder (matches the pinned Vite 8.1.3), importing `@bmad/theme`'s CSS globally in `.storybook/preview.ts` so every story renders themed. `[ASSUMPTION]` the exact `@storybook/react-vite` framework package/config shape for this specific pinned major version isn't independently verifiable here — follow whatever that version's own scaffolding/docs specify at implementation time if the shape below has drifted.
- **Z-index tokens** (`--m-z-dropdown` etc.) were added to Story 1.2 as a follow-up correction once this research surfaced them — confirm Story 1.2 was implemented with that addition before building Select here.
- **The danger Button variant's exact CSS isn't in the provided reference files** — only `.mono-cta` (primary) and `.mono-btn-outline` (outline) are defined in `notlazy-mono-layer.css`; no `.mono-cta-danger` class exists there. Derive it by analogy: same visual treatment as `.mono-cta` (filled border+background by default, hollowing out on hover — matches the documented hover behavior "danger hollows out") but with `--m-error` substituted for `--m-accent` throughout.
- **Scope discipline:** this story is exactly the 9 named components. Avatar, Modal, Menu, and everything else "inherited as-is" is Story 1.5's scope — do not build them here even though they appear in the same reference file.

## Tasks / Subtasks

- [x] Task 1: Set up Storybook in `packages/ui` (AC: #2)
  - [x] Install and configure Storybook 10.4.6 with a Vite-based React framework integration
  - [x] `.storybook/preview.ts` imports `@bmad/theme`'s CSS once, globally, so every story is themed (mirrors the "import once at root" rule from Story 1.2, applied to the Storybook preview root)
  - [x] Add a `storybook` dev script; a `build-storybook` script is optional polish, not required by either AC
- [x] Task 2: Button family (AC: #1, #2) — `packages/ui/src/Button/`
  - [x] `Button`: `variant?: 'primary' | 'outline' | 'danger'` (default `'primary'`), `disabled?: boolean`, `href?: string` (renders an `<a>` with identical chrome instead of a `<button>` when present), children as label. 36px height (`--m-space-control-height`), Space Grotesk (`display` type). Primary → `.mono-cta`-equivalent (accent fill, hollows to accent-outline on hover); Outline → `.mono-btn-outline`-equivalent (dim border, muted text, accent on hover); Danger → same treatment as primary with `--m-error` substituted for `--m-accent` (see Dev Notes)
  - [x] `SubmitButton`: full-width, submits its ancestor `<form>`, props `pending?: boolean`, `pendingLabel?: string` (shown in place of children while pending, alongside a spinner — reuses the Spinner from Story 1.5; if 1.5 isn't built yet, stub a minimal inline spinner and note the TODO to swap it in once 1.5 lands)
  - [x] `IconSubmitButton`: icon-only submit button, props `label: string` (required, becomes the `aria-label` — there is no visible text), `icon?: ComponentType` (a heroicon component; reference default context suggests a "publish" affordance — pick a sensible default, e.g. a paper-airplane/rocket icon, and allow override via the `icon` prop as shown: `<IconSubmitButton label="Save draft" icon={CheckIcon} />`), `pending?: boolean`
  - [x] Plain (non-form) icon button pattern for reference/reuse by Theme-toggle (Story 1.5): `<button type="button" aria-label="..." className="mono-icon-btn size-9"><Icon className="size-4" /></button>` — pure border, no fill, accent on hover; this is a CSS-class pattern, not a packaged component of its own, but document it since 1.5 needs it
  - [x] Stories: default (primary/outline/danger), disabled, href-as-anchor, SubmitButton default/pending, IconSubmitButton default/with custom icon/pending
- [x] Task 3: Field & Textarea (AC: #1, #2) — `packages/ui/src/Field/`, `packages/ui/src/Textarea/`
  - [x] `Field`: `id: string` (required), `label: string`, `type?: string` (native input type, e.g. `email`/`password`/`text`), `required?: boolean`, `value`+`onChange` (controlled, standard `ChangeEvent`) or `defaultValue` (uncontrolled), `error?: string`, `disabled?: boolean`. Underline style (`border-bottom: 2px solid`), floating label (11px/0.12em uppercase — the `data-label` type role — that only animates *position*, not size), required asterisk when `required` is set, error text below via the same treatment as `FieldError` (Task 5) when `error` is set
  - [x] `type="password"` gets a **built-in show/hide eye toggle** — `EyeIcon` (24/solid, "show") / `EyeSlashIcon` (24/outline, "hide") from `@heroicons/react`, an icon button inside the field toggling the native input's `type` between `password`/`text`
  - [x] `Textarea`: same prop shape as `Field` minus `type` (always multi-line text), auto-grows with content (height adjusts to content, no fixed rows)
  - [x] Stories per component: empty (required asterisk visible), filled (controlled), error, disabled; `Field` additionally: password (eye toggle)
- [x] Task 4: Select (AC: #1, #2) — `packages/ui/src/Select/`
  - [x] Custom listbox (not a native `<select>`) — props: `id: string`, `label: string`, `placeholder?: string`, `options: SelectOption[]` (export this type — shape `{ value: string; label: string }`), `value: string | string[]` (array when `multiple`), `onChange: (value) => void` (receives the resolved value directly, not an event), `multiple?: boolean`, `required?: boolean`, `disabled?: boolean`, `error?: string`
  - [x] Behavior: click (or Enter/Space while focused) opens the listbox; `ArrowUp`/`ArrowDown` move the active option; `Enter`/`Space` toggles the active option's selection (single-select also closes and commits); `Escape` closes without committing further changes; type-ahead (typing letters jumps to the first matching option label) is supported
  - [x] The open listbox panel uses `var(--m-z-dropdown)` (Story 1.2's z-index token) so it layers correctly above surrounding content
  - [x] Shares the same floating-label/underline/error/required-asterisk visual language as `Field` for its trigger row
  - [x] Stories: empty/placeholder, filled single-select, error + required multiple-select, disabled
- [x] Task 5: Switch, Checkbox, RadioGroup, Label, FieldError (AC: #1, #2) — one folder each under `packages/ui/src/`
  - [x] **Square selection controls, no circles anywhere** — this system's `rounded.DEFAULT = 0` applies to these too; `Switch`'s track/thumb are square-cornered, not an iOS-style rounded pill
  - [x] `Switch`: `id`, `label`, `checked: boolean`, `onChange: (checked: boolean) => void` (receives the boolean directly, not a native event — wraps a native `<input type="checkbox" role="switch">` under the hood for a11y, per the reference's "all wrap native inputs for a11y"), `disabled?: boolean`
  - [x] `Checkbox`: `id`, `label`, `checked`, `onChange: (checked: boolean) => void`, `required?: boolean`, `error?: string`, `disabled?: boolean`. Checked state fills `--m-accent` with a checkmark (`CheckIcon`, `@heroicons/react/24/solid`)
  - [x] `RadioGroup`: `name`, `label`, `required?: boolean`, `value: string`, `onChange: (value: string) => void`, `options: { value: string; label: string }[]`. Selected option renders an inner filled square (not a dot/circle) inside the outer square outline
  - [x] All three: accent focus ring (matches the reference's `.mono-focus`-equivalent utility), required asterisk rendered the same way `Field` does it, `error` reddens the control's border/fill and shows a message using the same treatment as standalone `FieldError`
  - [x] `Label`: renders `children` as-is; `caret?: boolean` shows a blinking caret after the text — **no ready-made CSS utility for this exists in the reference files provided**, so add a small new CSS keyframe (e.g. a `▎`/`_` character blinking via `@keyframes` opacity 0↔1) rather than searching for one that isn't there; `className?: string` allows a full style override (used in the reference for a muted2-colored variant)
  - [x] `FieldError`: `error: string` (required), standalone-usable component — `!` prefix, `role="alert"`, 11px/0.12em, `--m-error` color. This is the **one** error-message treatment in the system; `Field`/`Textarea`/`Select`/`Switch`/`Checkbox`/`RadioGroup` all reuse it internally rather than each rendering their own error markup
  - [x] Stories: `Switch` on/off/disabled; `Checkbox` unchecked/checked/error+required/disabled; `RadioGroup` default selection; `Label` default/caret/muted-override; `FieldError` standalone
- [x] Task 6: Verify token-only styling (AC: #1)
  - [x] Run Story 1.3's lint gate against all 9 components — zero arbitrary-value violations
  - [x] Spot-check each component in Storybook in both light and dark mode (toggle the `.dark` class per Story 1.2's mechanism)

### Review Findings

_Code review 2026-07-07 — commit `241b21e` (uncommitted working tree), 3-layer adversarial (Blind Hunter · Edge Case Hunter · Acceptance Auditor) plus 2 manual reviewer notes. Result: 0 decision-needed (all 3 resolved), 8 patch (all fixed), 15 deferred, 6 dismissed as noise._

- [x] [Review][Patch] Collapse `SubmitButton`/`IconSubmitButton` into `Button` — resolved: merge confirmed. Keep `type?: 'button' | 'submit'` as the plain native HTML attribute (default `'button'`) — it must NOT control width. Add a separate `fullWidth?: boolean` (default `false`) for width, independent of `type`. Add `pending?`/`pendingLabel?` (meaningful with `type="submit"`) and `icon?`/`iconOnly?` (icon-only submit use case, `iconOnly` makes the label become `aria-label` instead of visible text). **Fixed:** `Button` absorbed both; `SubmitButton.tsx`/`IconSubmitButton.tsx` and their stories deleted, story states folded into `Button.stories.tsx` (`submit-full-width`, `submit-pending`, `icon-only-submit`, `icon-only-custom-icon`, `icon-only-pending`). Disable bug fixed as `Boolean(disabled) || pending` [packages/ui/src/Button/Button.tsx]
- [x] [Review][Patch] Fold `FieldError` into `Field` — resolved: keep `FieldError` as a shared *internal* helper (not exported from the public barrel, no standalone `.stories.tsx`), still reused internally by `Field`, `Textarea`, `Select`, `Checkbox`, and `RadioGroup`. **Fixed:** moved to `packages/ui/src/Field/FieldError.tsx`, all 5 consumers' imports updated, barrel export and standalone story removed [packages/ui/src/Field/FieldError.tsx]
- [x] [Review][Patch] `Switch` has no `required`/`error` props — resolved: add `required?: boolean` and `error?: string` to `Switch`, matching `Checkbox`/`RadioGroup`'s treatment (asterisk + border/fill reddening + shared `FieldError`). **Fixed**, plus an `ErrorRequired` story added [packages/ui/src/Switch/Switch.tsx]
- [x] [Review][Patch] Select crashes when `multiple` is true but `value` is passed as a non-array — `selectedValues.map`/`.filter` throws `TypeError`. **Fixed:** guarded with `Array.isArray(value)` [packages/ui/src/Select/Select.tsx]
- [x] [Review][Patch] Select's open listbox only closes on outside `mousedown` — tabbing focus away leaves it open and interactive. **Fixed:** added an `onBlur` handler on the container that closes the listbox when focus moves outside it [packages/ui/src/Select/Select.tsx]
- [x] [Review][Patch] `Field`/`Select`/`RadioGroup` labels use the `text-eyebrow` type role instead of the `text-data-label` token DESIGN.md specifies for the field-label role (and the Dev Notes call it "the `data-label` type role") — currently numerically identical so no visual regression, but the wrong semantic token to build on. **Fixed:** swapped to `text-data-label` in all three [packages/ui/src/Field/Field.tsx, packages/ui/src/Select/Select.tsx, packages/ui/src/RadioGroup/RadioGroup.tsx]
- [x] [Review][Patch] `@vitejs/plugin-react` added as a devDependency but never registered in `.storybook/main.ts`'s `viteFinal` — dead dependency. **Fixed:** removed from `package.json`; `pnpm install` confirms it's gone from `packages/ui`'s lockfile entry [packages/ui/package.json]
- [x] [Review][Patch] `SubmitButton`/`IconSubmitButton` don't disable while `pending` if caller explicitly passes `disabled={false}` — merged into the `Button` fix above [packages/ui/src/Button/Button.tsx]

Verified: `pnpm --filter @bmad/ui build` (tsc) and `pnpm --filter @bmad/ui lint` (eslint + stylelint) both clean after all patches; Storybook's dev server (already running, HMR) picked up the changes live — story index shows the new merged `Button` stories and `switch--error-required`, no `submitbutton--*`/`iconsubmitbutton--*`/`fielderror--*` entries remain, all sampled story iframes render 200.
- [x] [Review][Defer] No `forwardRef` on any component — blocks imperative focus / form-library (react-hook-form) integration [packages/ui/src/Button/Button.tsx] — deferred, out of this story's exact prop-shape scope
- [x] [Review][Defer] No `name`/rest-prop passthrough on `Field`/`Textarea`/`Select`/`Switch`/`Checkbox` (`RadioGroup` has `name`) — blocks native form participation and custom attributes [packages/ui/src/Field/Field.tsx] — deferred, exact prop shapes were spec'd without it
- [x] [Review][Defer] `Select` has no hidden mirrored `<input>`, so it can't participate in native form submission despite exposing `required`/`aria-required` [packages/ui/src/Select/Select.tsx] — deferred, same native-form-participation gap as above
- [x] [Review][Defer] Error text has no `aria-describedby` wiring back to its control (`FieldError` accepts no `id`) [packages/ui/src/FieldError/FieldError.tsx] — deferred, revisit alongside the `FieldError`→`Field` fold decision
- [x] [Review][Defer] Select's listbox options have no stable `id`s / `aria-activedescendant` wiring on the trigger — a11y gap in the custom combobox pattern [packages/ui/src/Select/Select.tsx] — deferred, beyond this story's ACs
- [x] [Review][Defer] `Field`/`Textarea` recompute `isControlled` from `value !== undefined` every render — if a consumer's `value` toggles between defined/undefined across renders, React warns about switching an input from uncontrolled to controlled [packages/ui/src/Field/Field.tsx, packages/ui/src/Textarea/Textarea.tsx] — deferred, foot-gun for misuse rather than a functional bug under intended usage
- [x] [Review][Defer] `Select`'s `clampIndex` clamps at the list ends instead of cycling — arrow-key nav stops dead instead of wrapping [packages/ui/src/Select/Select.tsx] — deferred, not required by the spec's behavior bullet
- [x] [Review][Defer] `Select` assumes unique `option.value`s — duplicate values produce duplicate React keys and ambiguous `.find()` resolution [packages/ui/src/Select/Select.tsx] — deferred, reasonable caller contract, not enforced defensively
- [x] [Review][Defer] Storybook config has an empty `addons: []` — no controls/actions/a11y/docs addon [packages/ui/.storybook/main.ts] — deferred, DX polish beyond AC #2's "stories exist" requirement
- [x] [Review][Defer] Storybook `backgrounds` parameter sets a swatch value to `var(--m-bg)`, which likely won't resolve in the manager/toolbar iframe (separate context from the themed preview) [packages/ui/.storybook/preview.ts] — deferred, cosmetic Storybook-only issue
- [x] [Review][Defer] Most story files' `meta.args` define dummy `onChange: () => {}` / placeholder props that every exported story immediately overrides via its own `render()` — dead boilerplate [packages/ui/src/Checkbox/Checkbox.stories.tsx and similar] — deferred, cosmetic cleanup
- [x] [Review][Defer] `react`/`react-dom` peer and dev dependencies are pinned to exact patch versions with no range — deferred, matches this repo's established exact-pin convention (Story 1.1), a monorepo-wide convention question rather than this story's to decide alone
- [x] [Review][Defer] `Button`'s anchor form (`href`) has no default `rel`/`target` safety net (e.g. auto `rel="noopener noreferrer"` when `target="_blank"`) [packages/ui/src/Button/Button.tsx] — deferred, minor hardening, not required by spec
- [x] [Review][Defer] `@heroicons/react` is a plain dependency baked directly into `Checkbox`/`Field`, with no override escape hatch (unlike `IconSubmitButton`, which accepts an `icon` prop) [packages/ui/src/Checkbox/Checkbox.tsx, packages/ui/src/Field/Field.tsx] — deferred, the Dev Notes' `[ASSUMPTION]` explicitly directs adopting `@heroicons/react` for parity; making it swappable is future work
- [x] [Review][Defer] `Select`'s type-ahead doesn't cycle matches when the same character is repeated (e.g. "w","w","w" for "Web") — the accumulated string stops matching after the first repeat [packages/ui/src/Select/Select.tsx] — deferred, spec only requires "typing letters jumps to the first matching option," not repeat-cycling
- [x] [Review][Dismiss] Field's password toggle uses `EyeIcon` (`/24/solid`) for "show" and `EyeSlashIcon` (`/24/outline`) for "hide" — **not a bug**, this exact solid/outline pairing is explicitly specified in the Dev Notes (line 49) [packages/ui/src/Field/Field.tsx]
- [x] [Review][Dismiss] `Checkbox`/`Switch`/`RadioGroup` are controlled-only (no `defaultChecked`) while `Field`/`Textarea` support both — **not a bug**, the Dev Notes specify each component's exact prop shape and Checkbox/Switch/RadioGroup were spec'd controlled-only
- [x] [Review][Dismiss] No automated test suite added for any of the 9 components — **already an explicit, justified decision**: Story 1.1's Dev Notes convention (Vitest scoped to Epic 2's normalization layer) is reiterated in this story's own Completion Notes as the reasoning
- [x] [Review][Dismiss] `Button`'s `variant` prop could resolve to `undefined` styling if a non-TypeScript caller passes an out-of-union value — **not applicable**, this is an internal TS-only monorepo package; the union is compile-time enforced and no such caller exists
- [x] [Review][Dismiss] Select's dropdown z-index set via inline `style={{ zIndex: "var(--m-z-dropdown)" }}` instead of a Tailwind class, questioned against Story 1.3's new strict-value lint rule — **verified non-issue**: `zIndex` isn't a tracked property in the ESLint/Stylelint strict-value rules (only color/spacing/radius are), confirmed against `packages/eslint-config/src/no-arbitrary-style-value.js`; matches the Dev Notes' own stated reasoning
- [x] [Review][Dismiss] `Spinner.css`/`Label.css` side-effect imports allegedly won't ship since the package's `build` script is plain `tsc` (which doesn't copy CSS) — **false positive**: `package.json`'s `main`/`types` point directly at `./src/index.ts` (raw source), so consumers resolve these packages via their own bundler (Vite/webpack), not via the unused `tsc` `dist` output

### Review Findings — Round 2 (manual, design fidelity)

_2026-07-07 — a second manual pass against screenshots and the actual reference implementation at `/Users/igormariuta/Code/lazy-team/lazy-blog-front/src/shared/ui` (the real NOT LAZY source, not just the design-guide excerpt this story originally cited). All 6 items fixed._

- [x] Icon-only `Button` with `pending` rendered a blank/invisible square instead of a spinner — root cause: the old `InlineSpinner`'s `border-bg` color assumed a filled (accent-background) button context, so on the unfilled icon-only variant the spinner border matched the transparent background and disappeared. **Fixed** as part of the full spinner replacement below (the new `Spinner` is a text glyph that inherits `currentColor`, so it's visible in every Button variant automatically) [packages/ui/src/Button/Button.tsx]
- [x] Pending-state spinner animation redesigned from the rotating-square-border stub to match the reference's actual terminal ASCII spinner exactly: `["│", "/", "─", "\\"]` cycling every 100ms via `setInterval` (not a CSS animation), accent-colored. Extracted as a real standalone primitive rather than an inline Button-only stub, per reviewer's request — `Spinner` (bare glyph) + `Loading` (wraps it, inline or full-viewport-block form with a "LOADING" label), matching the reference's `feedback/loading.tsx` 1:1. `Button`'s `pending` state now reuses the bare `Spinner`. This fulfills what Story 1.4's Dev Notes deferred to Story 1.5 ("reuses the Spinner from Story 1.5") ahead of schedule — Story 1.5 should reuse `packages/ui/src/Spinner/` rather than building its own [packages/ui/src/Spinner/Spinner.tsx, packages/ui/src/Spinner/Loading.tsx]
- [x] Removed the word "submit" from `Button`'s public API surface entirely, per reviewer's request — `type="submit"` remains as the plain native HTML attribute value (not a naming concept), but story names changed: `SubmitFullWidth`→`FullWidth`, `SubmitPending`→`Pending`, `IconOnlySubmit`→`IconOnly` [packages/ui/src/Button/Button.stories.tsx]
- [x] `Field`/`Textarea`/`Select` input padding was too cramped — ground-truthed against the reference's actual `forms/field.tsx` (not just the design-guide excerpt): input top/bottom padding corrected from `pt-4`(only) to `pt-5 pb-2` (20px/8px, matching reference exactly since both systems use plain untouched Tailwind spacing scale), unfocused label position corrected from `top-4` to `top-6` (24px, matching reference), removed the `h-control-height` fixed height that was constraining this (reference lets padding determine height natively). Password toggle right-padding aligned `pr-9`→`pr-8` and given `p-1` hit-target padding to match reference [packages/ui/src/Field/Field.tsx, packages/ui/src/Textarea/Textarea.tsx, packages/ui/src/Select/Select.tsx]
- [x] `Checkbox` was too small vs. the reference (`size-[18px]`, an arbitrary value not on any standard scale) — bumped from `size-4`(16px) to `size-5`(20px), the nearest value on BMAD's token-constrained scale in the "bigger" direction (an exact 18px match isn't achievable without introducing a new arbitrary/token value, which Story 1.3's lint bans outright); inner `CheckIcon` bumped `size-3`→`size-3.5` (14px, matching reference's inner-icon size exactly) and row `gap-2`→`gap-3` (12px, matching reference) [packages/ui/src/Checkbox/Checkbox.tsx]
- [x] `Select`'s listbox option padding corrected from `px-4 py-2` to `px-3 py-2` (12px/8px, matching reference's option row padding exactly) [packages/ui/src/Select/Select.tsx]

Verified: `tsc` build + `eslint`/`stylelint` clean; full workspace `pnpm lint`/`pnpm build` clean; live Storybook (HMR) screenshots via `npx playwright screenshot` confirm the spinner now animates and is visible in both the full-width and icon-only pending states, Field/Textarea/Select spacing has proper breathing room, and Checkbox is visibly larger. Note: `RadioGroup`'s option box stays at the original `size-4` — only `Checkbox` was flagged as too small; flag if you want `RadioGroup` matched too for family consistency.

### Review Findings — Round 3 (manual, design fidelity continued)

_2026-07-07 — reviewer supplied fresh reference screenshots (`design-guide.tsx`'s own `// SWITCH` / `// CHECKBOX` / `// RADIO` panels) plus a broken-label repro for Select. Fetched the actual `forms/switch.tsx` and `forms/radio.tsx` reference sources (not fetched in Round 2). All 4 items fixed._

- [x] **`Select`'s label rendered garbled/overlapping its own placeholder** (e.g. "CATEGORY" + "Pick one…" visually stacked into "PickEGORY") — root cause: Round 2 copied `Field`'s floating-label pattern onto `Select`, but unlike a native `<input>`, `Select`'s trigger always renders visible text (the selected value or the `placeholder`) regardless of focus state — so the "unfocused" floated-down label and the always-visible placeholder/value text both occupied the same space and rendered on top of each other. The actual reference `forms/select.tsx` doesn't use a floating label for `Select` at all — it uses a static label above the trigger (`mono-field-label`, `mb-2`), which is structurally why the reference never hits this bug. **Fixed** by matching the reference: replaced the floating label with a static label above the trigger, trigger padding simplified to `pt-1 pb-2` (no longer needs to reserve room for a floating label), and added the reference's `ChevronDownIcon` dropdown affordance (rotates 180° when open) which was missing entirely before [packages/ui/src/Select/Select.tsx]
- [x] **`Switch` didn't match the reference** — reviewer screenshots showed a bigger track with a more visible off-state thumb than what was built. Fetched the actual `forms/switch.tsx` (not available in Round 2): reference uses a single native `<button role="switch" aria-checked>` (not a hidden-checkbox-plus-label pattern), track `h-6 w-11` (not `h-5 w-9`), thumb `size-4` (not `size-3`), and — the actual bug — the reference gives the thumb a **distinct `bg-muted2` color when off** vs `bg-bg` when on, while the previous build used `bg-bg` for the thumb unconditionally, making it nearly invisible against the page background in the off state. **Fixed**: rebuilt `Switch` as a native `role="switch"` button matching the reference's structure, sizes, and off/on thumb coloring; kept the `required`/`error` support added in Round 1 (the reference's own `Switch` has neither, but that was an explicit, separately-confirmed decision) layered on top; label typography corrected to the reference's `text-eyebrow uppercase text-fg` (not body-text style) [packages/ui/src/Switch/Switch.tsx]
- [x] **`Checkbox`/`RadioGroup` disabled state only dimmed the box, not the label text** — the reference dims the *entire* control (box + text) via `disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"` on the wrapping `<label>` itself, not a `peer-disabled:opacity-60` CSS trick scoped to just the visual box. **Fixed** in both components; also switched `inline-flex`→`flex` to match the reference's row layout exactly [packages/ui/src/Checkbox/Checkbox.tsx, packages/ui/src/RadioGroup/RadioGroup.tsx]
- [x] **`RadioGroup`'s selected option didn't turn its outer box border accent-colored** — it only reacted to `error`, never to `checked`, so a selected radio's outline stayed `border-dim` (grey) instead of the reference's `border-accent` (green). **Fixed**: border is now `error ? border-error : checked ? border-accent : border-dim`. Also matched the reference's spacing exactly: per-option row `gap-2`→`gap-3`, between-option `gap-2`→`gap-4`, box `size-4`→`size-5` (matching `Checkbox`'s Round 2 size for family consistency, resolving the open question from Round 2) [packages/ui/src/RadioGroup/RadioGroup.tsx]

Verified: `tsc` build + `eslint`/`stylelint` clean; full workspace `pnpm lint`/`pnpm build` clean; Playwright screenshots of every affected story confirm pixel-level parity with the reference screenshots (Switch on/off/disabled track+thumb sizing and coloring, Select label no longer overlaps its placeholder/error text and shows the chevron, Checkbox/RadioGroup disabled rows fully dim, RadioGroup's selected option shows an accent border).

## Project Structure Notes

```text
packages/ui/
  .storybook/            # new — Storybook 10.4.6 config, Vite-based
  src/
    Button/
      Button.tsx
      Button.stories.tsx
    Field/
    Textarea/
    Select/
    Switch/
    Checkbox/
    RadioGroup/
    Label/
    FieldError/
    index.ts             # barrel re-exporting all of the above
```

No conflicts with Story 1.1's structural seed — `packages/ui` was scaffolded there as a placeholder; this story is the first to populate it with real content.

### References

- [Source: planning-artifacts/ux-designs/ux-BMAD/imports/notlazy-design-guide.tsx (lines 573–934)] — exact prop usage for every component in this story (Button/SubmitButton/IconSubmitButton lines 579–673; Field 682–724; Textarea 733–763; Select 772–816; Switch/Checkbox/RadioGroup 825–902; Label/FieldError 911–933)
- [Source: planning-artifacts/ux-designs/ux-BMAD/imports/notlazy-mono-layer.css] — `.mono-cta`, `.mono-btn-outline`, `.mono-input`, `.mono-error`, `.mono-icon-btn`, `.mono-focus`, `.mono-field-label` utility classes these components are built from
- [Source: planning-artifacts/ux-designs/ux-BMAD/imports/notlazy-tokens.css] — z-index scale (ported into Story 1.2), confirms `.dark` ancestor-class theming mechanism
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components, #Do's and Don'ts] — square-corners/no-circles hard rule, accent-usage rule
- [Source: planning-artifacts/epics.md#Story 1.4, #UX-DR2] — acceptance criteria and full inherited-component list origin

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `pnpm --filter @bmad/ui build` (tsc) — first pass failed: CSF3 `render`-only stories needed `args` on `meta` to satisfy `StoryObj<typeof meta>` typing when the component has required props (Storybook/TS quirk, not a runtime issue); side-effect `.css` imports needed `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) for ambient module typing. Both fixed; second pass clean.
- `pnpm --filter @bmad/ui lint` — clean on first run after the above fixes (zero `tailwindcss/no-arbitrary-value` / `no-arbitrary-style-value` / boundaries violations).
- `pnpm lint` / `pnpm build` (turbo, full workspace) — both green.
- Storybook 10.4.6 dev server + a scratch Playwright (chromium) script: navigated every story's `iframe.html?id=...` in both light and default (`.dark` class toggled) themes, asserted zero console/page errors, and screenshotted each for a visual spot-check (floating-label position, error/disabled states, Select dropdown `z-index`, Switch/Checkbox/RadioGroup square controls). Also drove Select's real keyboard/mouse behavior (open via click, `ArrowDown`×3 + `Enter` selected the correct option, type-ahead `"d"` jumped to "Design", `Escape` closed without committing) — all matched spec. Scratch script and screenshots discarded after verification; not part of the repo.

### Completion Notes List

- Implemented all 9 components (`Button`, `SubmitButton`, `IconSubmitButton`, `Field`, `Textarea`, `Select`, `Switch`, `Checkbox`, `RadioGroup`) plus the two shared primitives they depend on (`Label`, `FieldError`), each in its own `packages/ui/src/<Name>/` folder with a co-located `.stories.tsx`, re-exported from `packages/ui/src/index.ts`.
- Set up Storybook 10.4.6 (`@storybook/react-vite`, Vite 8.1.3) in `packages/ui/.storybook/`, wiring `@tailwindcss/vite` via `viteFinal` and importing `@bmad/theme/index.css` + `tailwindcss` + `@bmad/theme/tailwind-preset` once in `preview.css`, matching the app's CSS-wiring convention from Story 1.2. Added a themed `html,body { background-color: var(--m-bg); color: var(--m-fg); }` rule (Storybook-preview-only, not shipped in `packages/ui`'s built output) so the canvas itself reflects light/dark for spot-checking.
- **Token-only styling, verified, not just asserted:** every component is built exclusively from `@bmad/theme`'s named Tailwind scale (`text-eyebrow`/`text-body`/`text-h3` compound type utilities, `bg-accent`/`text-error`/`border-dim` etc. color utilities, `h-control-height`/`px-4`/`gap-2` spacing utilities) — zero bracket arbitrary-value classes anywhere, so Story 1.3's `tailwindcss/no-arbitrary-value` ban (which forbids *all* bracket syntax, not just off-scale values) and the JSX inline-style rule both pass clean with no exemptions. Confirmed the NOT LAZY reference's literal values (`text-[14px] leading-none`, `text-[11px] tracking-[0.12em] font-medium`, etc.) all have exact-match equivalents already baked into the theme's compound `--text-*` utilities (`text-body`, `text-eyebrow`), so no visual fidelity was traded for lint compliance.
- **Select's `z-dropdown` layering:** used an inline `style={{ zIndex: "var(--m-z-dropdown)" }}` on the listbox panel rather than a Tailwind class, since `zIndex` isn't a tracked property in either the ESLint or Stylelint strict-value rule (only color/spacing/radius are) and no `--z-index-*` Tailwind theme mapping exists yet for `--m-z-dropdown` in `packages/theme`'s preset — this avoided touching `packages/theme` (out of this story's scope) while still using the literal token var as the Dev Notes specify. Verified via Playwright that the computed `z-index` resolves to `40`.
- **Danger Button variant:** derived from `.mono-cta` by substituting `--m-error` for `--m-accent` throughout (fill → hollow-on-hover), per the Dev Notes' explicit guidance, since no `.mono-cta-danger` class exists in the reference CSS.
- **SubmitButton/IconSubmitButton pending spinner:** stubbed a minimal rotating-square `InlineSpinner` (`Button/Spinner.tsx` + co-located `.css` keyframe) instead of a circular spinner, to hold the system's hard "square corners, no circles anywhere" rule until Story 1.5's shared Spinner lands — `TODO(1.5)` comment left in place to swap it out.
- **IconSubmitButton default icon:** used `PaperAirplaneIcon` (`@heroicons/react/24/solid`) as the "publish" affordance default, per the Dev Notes' `[ASSUMPTION]`; confirmed visually reasonable in Storybook.
- **Field/Textarea floating label:** implemented via React state (`isFocused` + tracked value, not a CSS `:placeholder-shown` trick) so it works identically for controlled and uncontrolled usage; verified via DOM inspection that the label sits at `top-4` (resting, overlapping the input's own top edge) when empty/unfocused and `top-0` (docked in the reserved padding strip) when focused or filled.
- **Textarea auto-grow:** implemented with a `useLayoutEffect` + `scrollHeight` measurement (inline `style.height`, not a Tailwind class — `height` isn't a tracked property either) rather than the newer CSS `field-sizing: content`, for guaranteed cross-browser/Stylelint-known-property safety.
- **Select props:** kept the literal `value: string | string[]` / `onChange: (value: string | string[]) => void` shape from the Dev Notes (not a `multiple`-discriminated union) for fidelity to spec; callers narrow via the `multiple` flag they already pass.
- Per Story 1.1's established convention (confirmed in that story's Dev Notes), no Vitest unit-test suite was added for these components — Vitest is scoped there to the normalization layer (Epic 2), and this story's own ACs specify Storybook stories + the lint gate as the verification mechanism, which is what Task 6 exercises.
- All 9 components render correctly in both light and dark mode (Storybook + Playwright spot-check); `turbo lint` and `turbo build` pass clean across the whole workspace.

### File List

- `packages/ui/package.json` (modified — added Storybook/Vite/React/Heroicons deps, `storybook`/`build-storybook` scripts, `peerDependencies` for react/react-dom; `@vitejs/plugin-react` removed post-review as an unused dependency)
- `packages/ui/tsconfig.json` (modified — added `jsx: "react-jsx"` and DOM libs)
- `packages/ui/.storybook/main.ts` (new)
- `packages/ui/.storybook/preview.ts` (new)
- `packages/ui/.storybook/preview.css` (new)
- `packages/ui/src/vite-env.d.ts` (new)
- `packages/ui/src/index.ts` (modified — barrel exports for 8 components + Label; `SubmitButton`/`IconSubmitButton`/`FieldError` removed from the barrel post-review, absorbed into `Button`/`Field` respectively)
- `packages/ui/src/Label/Label.tsx` (new)
- `packages/ui/src/Label/Label.css` (new)
- `packages/ui/src/Label/Label.stories.tsx` (new)
- `packages/ui/src/Button/Button.tsx` (new — post-review, absorbed `SubmitButton`/`IconSubmitButton` as `type`/`fullWidth`/`pending`/`pendingLabel`/`icon`/`iconOnly` props; Round 2 swapped the old square `InlineSpinner` for the new `Spinner` primitive)
- `packages/ui/src/Button/Button.stories.tsx` (new — post-review, folded in the full-width/pending/icon-only story states; Round 2 renamed away from "Submit*" naming)
- `packages/ui/src/Field/Field.tsx` (new — Round 2: `pt-5 pb-2` input padding, `top-6`/`top-0` label float, removed fixed `h-control-height`)
- `packages/ui/src/Field/Field.stories.tsx` (new)
- `packages/ui/src/Field/FieldError.tsx` (new — post-review, moved from `packages/ui/src/FieldError/`; internal helper only, no public barrel export or standalone story)
- `packages/ui/src/Textarea/Textarea.tsx` (new — Round 2: same padding/label fix as `Field`)
- `packages/ui/src/Textarea/Textarea.stories.tsx` (new)
- `packages/ui/src/Select/Select.tsx` (new — post-review: `multiple` non-array `value` guard, blur-to-close listbox, `text-data-label` token; Round 2: same padding/label fix as `Field`, listbox option padding `px-4`→`px-3`; Round 3: replaced the floating label — which was overlapping its own placeholder/error text — with the reference's static label-above-trigger, added the `ChevronDownIcon` affordance)
- `packages/ui/src/Select/Select.stories.tsx` (new)
- `packages/ui/src/Switch/Switch.tsx` (new — post-review, added `required`/`error` props; Round 3: rebuilt as a native `role="switch"` button matching the reference's real source — bigger track/thumb, distinct off-state thumb color)
- `packages/ui/src/Switch/Switch.stories.tsx` (new — post-review, added `ErrorRequired` story)
- `packages/ui/src/Checkbox/Checkbox.tsx` (new — Round 2: `size-4`→`size-5` box, `size-3`→`size-3.5` check icon, `gap-2`→`gap-3` row gap; Round 3: disabled now dims the whole row, not just the box)
- `packages/ui/src/Checkbox/Checkbox.stories.tsx` (new)
- `packages/ui/src/RadioGroup/RadioGroup.tsx` (new — post-review, `text-data-label` token; Round 3: `size-4`→`size-5` box, `gap-2`→`gap-3`/`gap-4` spacing, accent border on the checked option, whole-row disabled dimming)
- `packages/ui/src/RadioGroup/RadioGroup.stories.tsx` (new)
- `packages/ui/src/Spinner/Spinner.tsx` (new — Round 2, replaces the old `Button/Spinner.tsx` stub with the reference's real ASCII spinner)
- `packages/ui/src/Spinner/Spinner.stories.tsx` (new — Round 2)
- `packages/ui/src/Spinner/Loading.tsx` (new — Round 2, the `Spinner`'s inline/block wrapper; fulfills what this story's Dev Notes deferred to Story 1.5)
- `packages/ui/src/Spinner/Loading.stories.tsx` (new — Round 2)
- `pnpm-lock.yaml` (modified — new dependencies installed; `@vitejs/plugin-react` removed from `packages/ui`'s entry post-review)

**Removed in Round 2:**
- `packages/ui/src/Button/Spinner.tsx`, `Spinner.css` (the old rotating-square stub, superseded by `packages/ui/src/Spinner/`)

**Removed post-review** (merged/relocated per Review Findings above):
- `packages/ui/src/Button/SubmitButton.tsx`, `SubmitButton.stories.tsx` (absorbed into `Button`)
- `packages/ui/src/Button/IconSubmitButton.tsx`, `IconSubmitButton.stories.tsx` (absorbed into `Button`)
- `packages/ui/src/FieldError/FieldError.tsx`, `FieldError.stories.tsx` (moved to `packages/ui/src/Field/FieldError.tsx`, no longer a standalone primitive)

## Change Log

| Date | Change |
| --- | --- |
| 2026-07-07 | Implemented Story 1.4: all 9 core interactive primitives (`Button`/`SubmitButton`/`IconSubmitButton`, `Field`, `Textarea`, `Select`, `Switch`, `Checkbox`, `RadioGroup`) plus `Label`/`FieldError`, in `packages/ui`, each with a co-located Storybook story. Set up Storybook 10.4.6 (Vite-based) for the first time in the repo. Every component renders exclusively via `@bmad/theme`'s named Tailwind scale — zero arbitrary-value violations; `turbo lint`/`turbo build` pass across the workspace. Verified all components render correctly in light and dark mode and that Select's keyboard/type-ahead/click behavior works as specified. |
| 2026-07-07 | Code review: merged `SubmitButton`/`IconSubmitButton` into `Button` (`type`/`fullWidth`/`pending`/`pendingLabel`/`icon`/`iconOnly` props, fixed a disabled-while-pending bug), folded `FieldError` into `Field` as a shared internal helper (no longer a public primitive), added `required`/`error` to `Switch`, fixed a `Select` crash on non-array `multiple` values and a listbox-doesn't-close-on-tab-away gap, corrected the field-label token to `text-data-label`, and dropped an unused `@vitejs/plugin-react` dependency. 15 items deferred, 6 dismissed as noise. Status → `done`. |
| 2026-07-07 | Code review round 2 (manual, design fidelity, ground-truthed against the real reference at `lazy-blog-front/src/shared/ui`): fixed the icon-only `Button`'s invisible-spinner bug by replacing the old rotating-square stub with a new `Spinner`/`Loading` primitive pair (`packages/ui/src/Spinner/`) matching the reference's real terminal ASCII spinner (`│ / ─ \` cycling at 100ms) — this doubles as an early delivery of the Spinner Story 1.5 was going to need. Removed "submit" from `Button`'s story naming. Corrected `Field`/`Textarea`/`Select` input padding/label-float position and `Checkbox` sizing to match the reference exactly. |
| 2026-07-07 | Code review round 3 (manual, design fidelity continued): fixed a real `Select` bug where its floating label overlapped/garbled its own placeholder or error text (root cause: forcing `Field`'s floating-label pattern onto a component that always shows visible trigger text) — replaced with the reference's actual static-label-above-trigger pattern and added the missing chevron icon. Rebuilt `Switch` to match the reference's real `forms/switch.tsx` (native `role="switch"` button, bigger `h-6 w-11` track/`size-4` thumb, distinct muted off-state thumb color fixing a low-contrast/near-invisible thumb). Fixed `Checkbox`/`RadioGroup` disabled state to dim the whole row (not just the box) and `RadioGroup`'s selected option to show an accent border, matching the reference exactly. |
