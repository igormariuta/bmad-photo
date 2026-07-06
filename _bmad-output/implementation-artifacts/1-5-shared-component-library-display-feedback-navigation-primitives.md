# Story 1.5: Shared Component Library — Display, Feedback & Navigation Primitives

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the remaining inherited display/feedback/navigation components built and documented,
so that the full shared library is ready before feature epics consume it.

## Acceptance Criteria

1. **Given** `packages/theme` (Story 1.2), **when** Avatar, Metric, Dot, Category, StatusBadge, Modal, ModalHeader, ConfirmModal, Menu, Console, Loading, Spinner, InfoBox, ErrorMessage, Stat, Sparkline, UnderlineTabs, TabNav, Toaster, and Theme-toggle are implemented in `packages/ui`, **then** each is token-only styled and ships a co-located Storybook story. [Source: planning-artifacts/epics.md#Story 1.5]
2. **Given** Theme-toggle is implemented, **when** it is toggled, **then** it persists its state to `localStorage` and respects `prefers-color-scheme` on first render, independent of any app wiring it into a header later. [Source: planning-artifacts/epics.md#Story 1.5]

## Dev Notes — read this first

Same reference material as Story 1.4: `planning-artifacts/ux-designs/ux-BMAD/imports/notlazy-design-guide.tsx` (demo usage — this story's components are at lines 939–1417 and 1470–1519), `notlazy-mono-layer.css`, `notlazy-tokens.css`. **Read them before starting.**

- **Depends on Stories 1.1–1.4 implemented first.** Storybook is already configured (Story 1.4, Task 1) — this story only adds stories, it doesn't set up tooling again.
- **Package/file conventions** (name scope `@bmad/ui`, one folder per component under `packages/ui/src/<Name>/` with a co-located `.stories.tsx`, barrel export) carry over unchanged from Story 1.4.
- **`[ASSUMPTION]` Icon library:** continues to use `@heroicons/react` (established in Story 1.4) — this story additionally needs `StarIcon`/`EyeIcon` (24/solid, for `Stat`'s `subIcon`), `PencilSquareIcon`/`EyeSlashIcon`/`TrashIcon` (24/outline, for `Menu` items), and `SunIcon`/`MoonIcon` (24/solid, inferred for Theme-toggle — not shown in the reference file, but consistent with the same icon set and DESIGN.md's "sun/moon glyph swap" description).
- **Gap-fill addition — `StatBar` is not in this story's stated AC list, but is required and unbuilt:** neither `epics.md` Story 1.4 nor 1.5 lists `StatBar`, yet Story 2.3's AC explicitly requires "a determinate StatBar" for Ingest-progress, and it's clearly an *inherited* component (block-cell bar in the reference source, not something Story 2.3 builds fresh). Building it here, in the same "feedback primitives" bucket as the rest of this story, rather than leaving it for Story 2.3 to discover missing. `ProgressBar` (its indeterminate sibling, same reference section) is **not** added — nothing downstream in this project actually consumes it, and PRD's SM-C1 counter-metric explicitly warns against growing the design system beyond what Gallery/Landing consume.
- **Flagged conflict — `ErrorMessage`'s reference implementation composes `GlitchText`, but this suite has no error/404-page requirement anywhere in the PRD/epics, and Story 4.1 places `GlitchText` as Landing-local specifically *because* it assumed a single consumer (the Landing hero).** If `ErrorMessage` also used `GlitchText`, that assumption breaks. Resolution: build `ErrorMessage` per this story's AC (the component must exist), but with a **plain static heading** instead of `GlitchText` — simpler, avoids the shared-vs-single-consumer conflict, and consistent with SM-C1 since nothing currently triggers this component to render in either app. Flag for confirmation if an actual error page is added later.
- **Portal theming — Modal and Menu render outside their normal DOM subtree** (the reference portals into a `.mono-portal` node). Story 1.2's simpler global `:root`/`.dark` token approach still works here **only if the `.dark` class is applied on `<html>` (or `<body>`) directly**, not an inner wrapper div — because a React portal to `document.body` remains a descendant of `<html>`/`<body>` either way. This is a hard requirement, not a suggestion: verify wherever Story 1.5's Theme-toggle (Task 14) sets `.dark`, it does so on `documentElement`.
- **`Sparkline`'s `buildMonthlySeries` helper seen in the reference file is app/demo-specific, not part of this shared component** — `Sparkline` itself only needs a plain numeric `series` prop; don't port that helper.

## Tasks / Subtasks

- [ ] Task 1: Avatar (AC: #1) — `packages/ui/src/Avatar/`
  - [ ] Props: `size: 'sm' | 'lg'`, `name: string` (used for the first-initial fallback and accessible naming), `src?: string`. Square 2px-border tile — sm 40px tile / 16px initial letter (bylines, comments); lg 128px tile / 44px initter (profile header). Renders the image when `src` is set, else the first initial of `name` on the panel surface
  - [ ] Stories: sm+image, sm+letter-fallback, lg+image, lg+letter-fallback
- [ ] Task 2: Metric, Dot (AC: #1) — `packages/ui/src/Metric/`, `packages/ui/src/Dot/`
  - [ ] `Metric`: `kind: 'likes' | 'views' | 'posts' | 'comments' | 'rating'` (each kind pairs a fixed icon with the number), `value: number`, `accent?: boolean` (highlights a just-changed value, e.g. a fresh up-vote). One caption size (12px), icons 14px, one color (muted, unless `accent`). `kind="rating"`: icon is a neutral star that never changes with the value's sign — only the adjoining number communicates +/-
  - [ ] `Dot`: no props — a bare separator glyph threading meta rows (`@handle · date · metric · metric`)
  - [ ] Stories: one per `kind`, the `accent` variant, and a "meta row" composition story showing `Dot` used as a separator between two `Metric`s
- [ ] Task 3: Category, StatusBadge (AC: #1) — `packages/ui/src/Category/`, `packages/ui/src/StatusBadge/`
  - [ ] `Category`: children = topic label (e.g. `ai`), renders as a bracketed tag (`[ x ]` visual convention), 11px/0.12em
  - [ ] `StatusBadge`: `status: string` (e.g. `"LATEST DROP"`, `"PINNED"`) — a terminal-style flag marker
  - [ ] Stories: `Category` default, `StatusBadge` with two different status strings
- [ ] Task 4: StatBar (AC: #1 — gap-fill, see Dev Notes) — `packages/ui/src/StatBar/`
  - [ ] Props: `label: string`, `value: number` (0–100), `cells: number` (block-cell resolution, e.g. `48`). Determinate `████░░░░`-style bar: filled cells (`--m-accent`) up to `value`%, dotted remainder (`--m-dim`), right-aligned percentage
  - [ ] `[ASSUMPTION]` Exact "low value" threshold for the `--m-error` color flip isn't numerically specified anywhere upstream — pick a sensible threshold (e.g. below 10%) and note the choice; this only matters for generic StatBar reuse, Story 2.3's Ingest-progress use is always a rising 0→100 count and unlikely to linger in the "low" band long enough for this to matter visually
  - [ ] Story: default mid-value, a low value (to show the error-color flip), a near-100 value
- [ ] Task 5: Stat, Sparkline (AC: #1) — `packages/ui/src/Stat/`, `packages/ui/src/Sparkline/`
  - [ ] `Stat`: `label: string` (muted data-label tier — names the number, never the accent section-eyebrow), `value: string` (pre-formatted display string, e.g. `"1,240"`), `signOf: number` (drives color only: positive → accent, negative → error, zero → muted — independent of how `value` is formatted), `sub?: string`, `subIcon?: ComponentType` (e.g. `StarIcon`/`EyeIcon`)
  - [ ] `Sparkline`: `series: number[]`, `gradientId: string` (must be unique per instance — used for an SVG gradient def id so multiple sparklines on one page don't collide), `ariaLabel: string`. An all-zero series renders a muted flat baseline with no accent/gradient; any non-zero point renders the accent curve + dots + gradient fill
  - [ ] Stories: `Stat` positive/negative/zero (matching the sign-color rule); `Sparkline` with data and with an all-zero series
- [ ] Task 6: TabNav, UnderlineTabs (AC: #1) — `packages/ui/src/TabNav/`, `packages/ui/src/UnderlineTabs/`
  - [ ] `TabNav`: `tabs: { id: string; label: string; icon: ComponentType }[]`, `current: string`, `onSelect: (id: string) => void`, `className?: string`. Square box-language (shared visual family with the out-of-scope `Stepper`, not built here): only the active box highlights, connector is a **static** `--m-dim` rule (never accent, no completion layer). Tab names are **aria-label only** — the box shows the icon, not visible text
  - [ ] `UnderlineTabs`: `ariaLabel: string`, `current: string`, `onSelect: (id: string) => void`, `tabs: { id: string; label: string }[]`, `baseline?: boolean` (default `true` — draws its own 2px `--m-dim` baseline rule with an accent underline on the active tab; set `false` when nesting under a container that already has its own bottom rule, e.g. inside Header-bar). Roving-tablist keyboard nav (arrow keys move focus, matching standard ARIA tablist pattern)
  - [ ] Stories: `TabNav` default; `UnderlineTabs` default (`baseline` true) and `baseline={false}`
- [ ] Task 7: Modal, ModalHeader, ConfirmModal (AC: #1) — `packages/ui/src/Modal/`, `packages/ui/src/ModalHeader/`, `packages/ui/src/ConfirmModal/`
  - [ ] `Modal`: `isOpen: boolean`, `onOpenChange: (open: boolean) => void`, `labelledBy: string` (an id matching `ModalHeader`'s `titleId`, wired to `aria-labelledby`), children as a **render-prop function** `(close: () => void) => ReactNode` (not plain children — callers need the `close` callback to dismiss from inside, e.g. after a successful form submit). Focus-trapped, closes on Esc or backdrop click, locks body scroll, renders via a React portal — see Dev Notes on `.dark` placement
  - [ ] `ModalHeader`: `eyebrow?: string`, `title: string`, `titleId: string`, `subtitle?: string`, `onClose: () => void` — the header slot used inside `Modal`'s render-prop body
  - [ ] `ConfirmModal`: `isOpen: boolean`, `onOpenChange: (open: boolean) => void`, `tone?: 'danger' | 'default'` (**default value is `'danger'`** — the reference's own default-tone usage was a delete confirmation, and it omitted the `tone` prop entirely), `title: string`, `description: string`, `confirmLabel: string`, `onConfirm: () => void`. Built on `Modal`; button order is Cancel (implicit, always present) on the left, the confirm action on the right
  - [ ] Stories: `Modal` open with a form body (mirroring the "Save changes?" reference example); `ConfirmModal` `tone="danger"` and `tone="default"` (or the default) variants
- [ ] Task 8: Menu (AC: #1) — `packages/ui/src/Menu/`
  - [ ] Props: `triggerLabel: string` (aria-label for the kebab/ellipsis trigger button), `items: { id: string; label: string; icon: ReactNode; danger?: boolean; onSelect: () => void }[]`. Trigger opens an inline icon-row (not a dropdown list) to the left of the trigger; a `danger: true` item is styled distinctly and typically calls back into a `ConfirmModal` open-state setter rather than acting immediately
  - [ ] Story: three items (a couple of neutral actions + one `danger` item) matching the reference's edit/hide/delete pattern
- [ ] Task 9: Console (AC: #1) — `packages/ui/src/Console/`
  - [ ] Props: `title: string` (filename shown in a traffic-light-square title bar, e.g. `"stacktrace.log"`), children (monospace body content)
  - [ ] Story: a short error-style body line (e.g. an error message in `--m-error`, rest in `--m-fg`)
- [ ] Task 10: Toaster (AC: #1) — `packages/ui/src/Toaster/`
  - [ ] A singleton `<Toaster />` mounted once at each app's root, rendering a module-level toast store bottom-right — single card surface, 2px type-stripe (`--m-accent` success / `--m-error` error) + a status icon, dismisses on click, auto-dismisses after a timeout
  - [ ] Export the store's trigger functions alongside the component (e.g. `addToastSuccess(message: string)`, `addToastError(message: string)`) — other packages/apps call these, they don't reach into the store directly
  - [ ] Story: render `<Toaster />` plus a button that fires each trigger function, so Storybook can demonstrate both toast types interactively
- [ ] Task 11: Loading, Spinner (AC: #1) — `packages/ui/src/Loading/`, `packages/ui/src/Spinner/`
  - [ ] `Spinner`: bare ASCII-style glyph cycling `│ / ─ \` at 100ms, accent-colored by default, `className?` override (used both standalone and inside `SubmitButton`'s pending state from Story 1.4 — if 1.4 stubbed a placeholder spinner there, swap this real one in now)
  - [ ] `Loading`: wraps `Spinner`; `inline?: boolean` — `true` centers it in-flow (e.g. beside other content), default (block) form centers spinner + a "LOADING" label in the viewport (route-level fallback use case)
  - [ ] Stories: bare `Spinner`, `Loading inline`, `Loading` block form
- [ ] Task 12: InfoBox (AC: #1) — `packages/ui/src/InfoBox/`
  - [ ] Props: children, `className?`. 2px accent left edge over a faint accent-tinted background wash, 12px muted body text. This is the one component every other story in this project should reach for when it needs a "note" surface (e.g. the unreadable-count note in Story 2.4) — not a one-off per-feature treatment
  - [ ] Story: a short note
- [ ] Task 13: ErrorMessage (AC: #1 — see Dev Notes for the GlitchText simplification) — `packages/ui/src/ErrorMessage/`
  - [ ] Props: `error: Error`, `status: number`. Full-viewport layout: a status eyebrow (e.g. `"500"`), a **plain static heading** (not `GlitchText` — see Dev Notes), the message, a stacktrace-style `Console` body, and a go-home `Button`
  - [ ] Story: contained preview (height-capped box, same pattern as the reference) with a sample `Error` and `status={500}`
- [ ] Task 14: Theme-toggle (AC: #1, #2) — `packages/ui/src/ThemeToggle/`
  - [ ] Icon-only button, `mono-icon-btn`-equivalent styling (pure border, no fill — same visual family as Story 1.4's plain icon-button pattern), 36px square (`--m-space-control-height`), sun/moon glyph swap (`SunIcon`/`MoonIcon`)
  - [ ] On click: toggles a `.dark` class on `document.documentElement` (must be `documentElement`, not an inner wrapper — see Dev Notes on portal theming) and writes the resulting theme to `localStorage` (e.g. key `theme`, value `'light' | 'dark'`)
  - [ ] On first render (no stored preference yet): read `window.matchMedia('(prefers-color-scheme: dark)').matches` to decide the initial theme (AC #2's "respects `prefers-color-scheme` on first render")
  - [ ] **Flash-of-wrong-theme prevention is a separate, non-component piece of work**: a small inline (non-deferred, non-module) `<script>` in each app's HTML shell (`apps/gallery/index.html`'s `<head>`, `apps/landing`'s base layout `<head>`) that runs before first paint — reads `localStorage.getItem('theme')`, falls back to the `prefers-color-scheme` media query if unset, and sets `.dark` on `documentElement` synchronously. This can't be a React component (it must execute before hydration); write it once and note in dev notes that both apps need the same snippet inlined, not imported as a module (a deferred/module script would still flash)
  - [ ] Story: default (light) and a `.dark`-wrapped variant showing the sun/moon swap
- [ ] Task 15: Verify (AC: #1, #2)
  - [ ] Story 1.3's lint gate passes for all components in this story — zero arbitrary-value violations
  - [ ] Manually toggle Theme-toggle in Storybook, confirm `localStorage` is written and a page reload preserves the choice; clear `localStorage` and confirm the OS-level `prefers-color-scheme` is honored on first load

## Project Structure Notes

Adds to the same `packages/ui/src/` layout Story 1.4 established — one new folder per component (`Avatar/`, `Metric/`, `Dot/`, `Category/`, `StatusBadge/`, `StatBar/`, `Stat/`, `Sparkline/`, `TabNav/`, `UnderlineTabs/`, `Modal/`, `ModalHeader/`, `ConfirmModal/`, `Menu/`, `Console/`, `Toaster/`, `Loading/`, `Spinner/`, `InfoBox/`, `ErrorMessage/`, `ThemeToggle/`), each re-exported from the same `index.ts` barrel. No new packages or apps. Theme-toggle's flash-prevention script touches `apps/gallery/index.html` and `apps/landing`'s base layout — both already exist from Story 1.1.

### References

- [Source: planning-artifacts/ux-designs/ux-BMAD/imports/notlazy-design-guide.tsx (lines 939–1417, 1470–1519)] — exact prop usage for every component in this story
- [Source: planning-artifacts/ux-designs/ux-BMAD/imports/notlazy-tokens.css] — `.mono-portal` portal-theming pattern (informs the Modal/Menu Dev Note); z-index scale (already ported to Story 1.2) applies to Modal (`--m-z-modal`) and Toaster (`--m-z-toast`)
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — theme-toggle] — "toggles the .dark class; persists to localStorage; inline blocking script prevents flash-of-wrong-theme on load" (the only source for Theme-toggle, since it has no usage example in the reference demo file)
- [Source: planning-artifacts/epics.md#Story 1.5, #Story 2.3] — acceptance criteria origin; Story 2.3's explicit StatBar dependency (motivating this story's gap-fill addition)
- [Source: planning-artifacts/epics.md#Story 4.1] — GlitchText's Landing-local, single-consumer placement decision (context for the ErrorMessage flag)
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#SM-C1] — counter-metric against growing the design system beyond what's actually consumed (basis for excluding ProgressBar)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
