# Story 1.4: Shared Component Library — Core Interactive Primitives

Status: ready-for-dev

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

- [ ] Task 1: Set up Storybook in `packages/ui` (AC: #2)
  - [ ] Install and configure Storybook 10.4.6 with a Vite-based React framework integration
  - [ ] `.storybook/preview.ts` imports `@bmad/theme`'s CSS once, globally, so every story is themed (mirrors the "import once at root" rule from Story 1.2, applied to the Storybook preview root)
  - [ ] Add a `storybook` dev script; a `build-storybook` script is optional polish, not required by either AC
- [ ] Task 2: Button family (AC: #1, #2) — `packages/ui/src/Button/`
  - [ ] `Button`: `variant?: 'primary' | 'outline' | 'danger'` (default `'primary'`), `disabled?: boolean`, `href?: string` (renders an `<a>` with identical chrome instead of a `<button>` when present), children as label. 36px height (`--m-space-control-height`), Space Grotesk (`display` type). Primary → `.mono-cta`-equivalent (accent fill, hollows to accent-outline on hover); Outline → `.mono-btn-outline`-equivalent (dim border, muted text, accent on hover); Danger → same treatment as primary with `--m-error` substituted for `--m-accent` (see Dev Notes)
  - [ ] `SubmitButton`: full-width, submits its ancestor `<form>`, props `pending?: boolean`, `pendingLabel?: string` (shown in place of children while pending, alongside a spinner — reuses the Spinner from Story 1.5; if 1.5 isn't built yet, stub a minimal inline spinner and note the TODO to swap it in once 1.5 lands)
  - [ ] `IconSubmitButton`: icon-only submit button, props `label: string` (required, becomes the `aria-label` — there is no visible text), `icon?: ComponentType` (a heroicon component; reference default context suggests a "publish" affordance — pick a sensible default, e.g. a paper-airplane/rocket icon, and allow override via the `icon` prop as shown: `<IconSubmitButton label="Save draft" icon={CheckIcon} />`), `pending?: boolean`
  - [ ] Plain (non-form) icon button pattern for reference/reuse by Theme-toggle (Story 1.5): `<button type="button" aria-label="..." className="mono-icon-btn size-9"><Icon className="size-4" /></button>` — pure border, no fill, accent on hover; this is a CSS-class pattern, not a packaged component of its own, but document it since 1.5 needs it
  - [ ] Stories: default (primary/outline/danger), disabled, href-as-anchor, SubmitButton default/pending, IconSubmitButton default/with custom icon/pending
- [ ] Task 3: Field & Textarea (AC: #1, #2) — `packages/ui/src/Field/`, `packages/ui/src/Textarea/`
  - [ ] `Field`: `id: string` (required), `label: string`, `type?: string` (native input type, e.g. `email`/`password`/`text`), `required?: boolean`, `value`+`onChange` (controlled, standard `ChangeEvent`) or `defaultValue` (uncontrolled), `error?: string`, `disabled?: boolean`. Underline style (`border-bottom: 2px solid`), floating label (11px/0.12em uppercase — the `data-label` type role — that only animates *position*, not size), required asterisk when `required` is set, error text below via the same treatment as `FieldError` (Task 5) when `error` is set
  - [ ] `type="password"` gets a **built-in show/hide eye toggle** — `EyeIcon` (24/solid, "show") / `EyeSlashIcon` (24/outline, "hide") from `@heroicons/react`, an icon button inside the field toggling the native input's `type` between `password`/`text`
  - [ ] `Textarea`: same prop shape as `Field` minus `type` (always multi-line text), auto-grows with content (height adjusts to content, no fixed rows)
  - [ ] Stories per component: empty (required asterisk visible), filled (controlled), error, disabled; `Field` additionally: password (eye toggle)
- [ ] Task 4: Select (AC: #1, #2) — `packages/ui/src/Select/`
  - [ ] Custom listbox (not a native `<select>`) — props: `id: string`, `label: string`, `placeholder?: string`, `options: SelectOption[]` (export this type — shape `{ value: string; label: string }`), `value: string | string[]` (array when `multiple`), `onChange: (value) => void` (receives the resolved value directly, not an event), `multiple?: boolean`, `required?: boolean`, `disabled?: boolean`, `error?: string`
  - [ ] Behavior: click (or Enter/Space while focused) opens the listbox; `ArrowUp`/`ArrowDown` move the active option; `Enter`/`Space` toggles the active option's selection (single-select also closes and commits); `Escape` closes without committing further changes; type-ahead (typing letters jumps to the first matching option label) is supported
  - [ ] The open listbox panel uses `var(--m-z-dropdown)` (Story 1.2's z-index token) so it layers correctly above surrounding content
  - [ ] Shares the same floating-label/underline/error/required-asterisk visual language as `Field` for its trigger row
  - [ ] Stories: empty/placeholder, filled single-select, error + required multiple-select, disabled
- [ ] Task 5: Switch, Checkbox, RadioGroup, Label, FieldError (AC: #1, #2) — one folder each under `packages/ui/src/`
  - [ ] **Square selection controls, no circles anywhere** — this system's `rounded.DEFAULT = 0` applies to these too; `Switch`'s track/thumb are square-cornered, not an iOS-style rounded pill
  - [ ] `Switch`: `id`, `label`, `checked: boolean`, `onChange: (checked: boolean) => void` (receives the boolean directly, not a native event — wraps a native `<input type="checkbox" role="switch">` under the hood for a11y, per the reference's "all wrap native inputs for a11y"), `disabled?: boolean`
  - [ ] `Checkbox`: `id`, `label`, `checked`, `onChange: (checked: boolean) => void`, `required?: boolean`, `error?: string`, `disabled?: boolean`. Checked state fills `--m-accent` with a checkmark (`CheckIcon`, `@heroicons/react/24/solid`)
  - [ ] `RadioGroup`: `name`, `label`, `required?: boolean`, `value: string`, `onChange: (value: string) => void`, `options: { value: string; label: string }[]`. Selected option renders an inner filled square (not a dot/circle) inside the outer square outline
  - [ ] All three: accent focus ring (matches the reference's `.mono-focus`-equivalent utility), required asterisk rendered the same way `Field` does it, `error` reddens the control's border/fill and shows a message using the same treatment as standalone `FieldError`
  - [ ] `Label`: renders `children` as-is; `caret?: boolean` shows a blinking caret after the text — **no ready-made CSS utility for this exists in the reference files provided**, so add a small new CSS keyframe (e.g. a `▎`/`_` character blinking via `@keyframes` opacity 0↔1) rather than searching for one that isn't there; `className?: string` allows a full style override (used in the reference for a muted2-colored variant)
  - [ ] `FieldError`: `error: string` (required), standalone-usable component — `!` prefix, `role="alert"`, 11px/0.12em, `--m-error` color. This is the **one** error-message treatment in the system; `Field`/`Textarea`/`Select`/`Switch`/`Checkbox`/`RadioGroup` all reuse it internally rather than each rendering their own error markup
  - [ ] Stories: `Switch` on/off/disabled; `Checkbox` unchecked/checked/error+required/disabled; `RadioGroup` default selection; `Label` default/caret/muted-override; `FieldError` standalone
- [ ] Task 6: Verify token-only styling (AC: #1)
  - [ ] Run Story 1.3's lint gate against all 9 components — zero arbitrary-value violations
  - [ ] Spot-check each component in Storybook in both light and dark mode (toggle the `.dark` class per Story 1.2's mechanism)

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

### Debug Log References

### Completion Notes List

### File List
