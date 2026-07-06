---
name: Brutalist-mono (Suite)
description: Shared visual identity for the EXIF Gallery, Landing and Design System packages — inherited wholesale from the NOT LAZY blog's production Brutalist-mono system, extended only where Insights/Facets/Ingest need new primitives.
status: final
updated: 2026-07-06
colors:
  bg: '#f4f4f4'
  bg-dark: '#181818'
  fg: '#161616'
  fg-dark: '#dcdcdc'
  accent: '#4d7c0f'
  accent-dark: '#cdff48'
  line: '#161616'
  line-dark: '#e6e6e6'
  panel: '#e4e4e4'
  panel-dark: 'rgba(42,42,42,0.70)'
  card: '#eaeaea'
  card-dark: 'rgba(35,35,35,0.70)'
  muted: '#6b6b6b'
  muted-dark: '#9a9a9a'
  muted2: '#8c8c8c'
  muted2-dark: '#7a7a7a'
  dim: '#d6d6d6'
  dim-dark: '#383838'
  error: '#b91c1c'
  error-dark: '#ff6b6b'
typography:
  display:
    fontFamily: 'Space Grotesk'
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.04'
    letterSpacing: -0.02em
  h1:
    fontFamily: 'Space Grotesk'
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.04'
    letterSpacing: -0.02em
  h3:
    fontFamily: 'Space Grotesk'
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.18'
  prose:
    fontFamily: 'JetBrains Mono'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.85'
  body:
    fontFamily: 'JetBrains Mono'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  caption:
    fontFamily: 'JetBrains Mono'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  eyebrow:
    fontFamily: 'JetBrains Mono'
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.12em
  data-label:
    fontFamily: 'JetBrains Mono'
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.12em
rounded:
  DEFAULT: 0px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '7': 28px
  '8': 32px
  '10': 40px
  gutter: 40px
  container-max: 1240px
  article-max: 780px
  control-height: 36px
  header-height: 64px
  section-rhythm: 40px
  item-gap: 28px
  card-padding: 20px
  hero-padding: 34px
components:
  button-primary:
    background: '{colors.accent}'
    foreground: '{colors.bg}'
    border: '2px solid {colors.accent}'
    height: '{spacing.control-height}'
    radius: '{rounded.DEFAULT}'
  button-outline:
    border: '2px solid {colors.dim}'
    foreground: '{colors.muted}'
    radius: '{rounded.DEFAULT}'
  field:
    border-bottom: '2px solid {colors.dim}'
    label: '{typography.data-label}'
    error-color: '{colors.error}'
  histogram-bar:
    note: 'New — extends StatBar. One row per FR-7 Insights dimension: focal length/lens (combined), ISO, shutter, aperture, megapixel mix (12/48), selfie-vs-rear, hour-of-day. Filled cells {colors.accent}, remainder dotted {colors.dim}, right-aligned count or %.'
    height: 20px
    radius: '{rounded.DEFAULT}'
  facet-panel:
    note: 'New — Browse tab only (Insights carries no filter UI). Sidebar (desktop) / slide-up sheet (mobile) hosting one control per FR-8 Facet. Discrete facets (lens, mp-mode, front/rear): Select/RadioGroup/Checkbox. Range facets (date, ISO, aperture, shutter, exposure comp): range-control.'
    background: '{colors.panel}'
    border: '2px solid {colors.dim}'
  range-control:
    note: 'New — a Facet-panel row for a bounded range: two underline Fields (min/max, or from/to for dates) side by side, sharing one data-label. No slider/calendar widget — same underline-input language as Field, just two of them per row.'
    input: '{components.field}'
  theme-toggle:
    note: 'Inherited as-is from NOT LAZY. Icon-only mono-icon-btn (sun/moon glyph swap), 36px square, header right edge. Toggles the .dark class; persists to localStorage; inline blocking script prevents flash-of-wrong-theme on load.'
    size: '{spacing.control-height}'
    border: '2px solid {colors.dim}'
  photo-grid-cell:
    note: 'New — square thumbnail tile, 2px border, no radius, topped by an EXIF badge caption below the image (Dot-separated {typography.caption} text, e.g. "24mm · f/1.8 · ISO 200" — reuses the existing Dot/meta-row pattern, no new primitive). Unreadable-Metadata photos are never rendered here (excluded, not badged).'
    border: '2px solid {colors.dim}'
    radius: '{rounded.DEFAULT}'
    caption: '{typography.caption}'
  photo-detail-modal:
    note: 'Reuses Modal/ModalHeader as-is; body lists full Metadata as Spec rows.'
    background: '{colors.card}'
  ingest-progress:
    note: 'Reuses StatBar in determinate mode: "Parsing 42/100" with filling block-bar.'
  empty-state:
    note: 'New — full-screen centered eyebrow + H1 + one-line privacy promise + single primary Button. No header chrome shown until first Ingest completes.'
  header-bar:
    note: 'New, minimal — wordmark (font-display) + theme toggle only, no nav links. Fixed, {spacing.header-height} tall.'
    background: '{colors.bg}'
    border-bottom: '2px solid {colors.line}'
  hero:
    note: 'New, Landing only. Eyebrow ({typography.eyebrow}) + display headline ({typography.display}) + one-line body, centered or left-aligned in the {spacing.container-max} container. No image/illustration — the promise is stated in type, not shown. Headline renders through the inherited GlitchText: one settle-in beat on load (~900ms — brief jitter + accent/error chromatic ghost, then resolves to static type), never a continuous loop. Body/eyebrow fade-up on load, CSS-only.'
    padding: '{spacing.hero-padding}'
  pillar-card:
    note: 'New, Landing only. Three side-by-side (stacked on mobile) cards, one per value pillar. Card chrome matches Panel: {colors.card} background, {colors.dim} 2px border, {spacing.card-padding} padding. Each: eyebrow-style number ("01"), H3 title, body copy. Reveals with a fade-up as it enters the viewport, staggered per card (~90ms apart), CSS-only (scroll-linked, no JS) — one-time, content is present in the DOM regardless of motion support.'
    background: '{colors.card}'
    border: '2px solid {colors.dim}'
    padding: '{spacing.card-padding}'
  preset-comparison:
    note: 'New, Landing only. Static before/after image pair (tone-curve and color-mixer examples), side-by-side on desktop / stacked on mobile, each half labelled with a data-label caption ("BEFORE" / "AFTER"). 2px border frames each image; no slider, no JS. Fades up on scroll-in, same CSS-only treatment as pillar-card.'
    border: '2px solid {colors.dim}'
---

## Brand & Style

Brutalist-mono: monospaced-first, high-contrast, structural and raw, minimal ornament. Square corners everywhere (`{rounded.DEFAULT}` = 0), 2px borders as the only line weight, terminal-style `// EYEBROW` labels at 0.12em tracking give the system its "console" character. This is the exact production system already shipping on the NOT LAZY blog (`lazy-blog-front`) — inherited wholesale, not reinvented, because the PRD's own success metric (SM-2, "one UI system, no drift") extends the *team's* one system across products, not just across this monorepo's two apps.

The suite's new surfaces — Insights' **histogram-bar**, the **facet-panel**, and Landing's **hero** / **pillar-card** / **preset-comparison** — are all assembled from existing tokens (block-cells, 2px borders, panel chrome, data-label typography), so nothing looks invented. Every component from the inherited system — buttons, fields, selection controls, avatars, modals, toasts, loading states — carries over unchanged.

Voice/tone (Landing copy): honest, direct, a little opinionated — states the frustration plainly (the stock iPhone look is harsh, over-processed) rather than selling softly. No marketing fluff, no exclamation-point energy.

Motion is a single restrained gesture, not a technique: the Landing hero gets one settle-in beat (GlitchText, inherited from NOT LAZY) on load, and section content fades up once as it's scrolled into view. Nothing loops, nothing re-triggers, nothing gates content — nowhere in the suite is motion required to perceive information, and `prefers-reduced-motion` always collapses to the final static state.

## Colors

Ten tokens per theme, unchanged from NOT LAZY. In code: only `var(--m-*)`; hard-coded hex is banned (enforced by the PRD's `no-arbitrary-value` lint, FR-4).

- **`bg` / `fg`** — canvas and primary text. Light is a warm off-white (`#f4f4f4`), dark is a near-black (`#181818`) — neither pure white nor pure black, keeps the brutalist flatness from feeling clinical.
- **`accent`** — olive-green in light (`#4d7c0f`), acid lime in dark (`#cdff48`). The *only* chromatic color in the system. Used for: primary actions, focus rings, active states, the histogram fill, up-trending Stat values, "this is live/selected" signals. Never decorative.
- **`line` / `dim`** — the two border weights. `line` is the strongest (page dividers, header rule); `dim` is the default 2px border for cards, inputs, panels, histogram remainder-cells.
- **`panel` / `card`** — surface fills. Both are translucent in dark mode (0.70 alpha over `bg`) so cards visually sink into the canvas; overlays (Modal, Menu, dropdowns) reset to opaque so scrolled content underneath never bleeds through.
- **`muted` / `muted2`** — two tiers of de-emphasized text. `muted` for body-adjacent secondary text (captions, help copy); `muted2` for the quietest tier (data-labels, placeholder text, inactive tab labels).
- **`error`** — reserved for destructive actions, field errors, and low/critical values (e.g. a Stat crossing into negative, a StatBar value below its warning threshold). Never used decoratively.

Avoid: any color outside these ten tokens, gradients, translucency on anything except `panel`/`card` in dark mode.

## Typography

Two families, zero exceptions: **Space Grotesk** (`display` role) for identity, headings and big numbers; **JetBrains Mono** (`body`/`prose`/`caption`/`eyebrow`/`data-label` roles) for everything else — data, code, labels, UI copy, article prose. Don't invent intermediate sizes; the ramp above (`{typography.display}` through `{typography.data-label}`) is the complete scale.

- `eyebrow` (11px/500/0.12em, `{colors.accent}`) heads a section, page, or modal — e.g. `// INSIGHTS`.
- `data-label` is visually identical to `eyebrow` but `{colors.muted2}` — it *names* the value below it (a Stat label, a Facet control label, a histogram bucket name), never a section head. Same size/tracking, different job, different color — don't conflate the two.
- Headings carry `-0.02em` tracking; body/H3 carry `0`. This is a hard rule, not a default — untracked headings read "flat" in this system (see the before/after comparison the NOT LAZY guide ships).

## Layout & Spacing

4px base grid. Section rhythm is a fixed 40px (`{spacing.section-rhythm}`); 28px (`{spacing.item-gap}`) is reserved *only* for repeating-item gaps (grid cells, list rows, comment threads) and must never substitute for section rhythm. Intermediate values (6/14/22px) are off-limits.

- Page gutter: `{spacing.gutter}`. Container max-width: `{spacing.container-max}` (Gallery desktop, Landing). Article/reading measure: `{spacing.article-max}` @ `{spacing.gutter}` (not used by this suite directly, inherited for future prose surfaces).
- Control height: `{spacing.control-height}` — every button, input, header icon-button.
- Header: fixed, `{spacing.header-height}` tall, wordmark + theme toggle, `{colors.bg}` background with a `{colors.line}` bottom rule.
- Gallery photo grid: mobile-first — 2 columns on `sm`, scaling up via the container's max-width on wider viewports; cell gap follows `{spacing.item-gap}` (28px), matching the system's "repeating item" rule. `[ASSUMPTION: exact column-count breakpoints left to implementation; the rule that governs them — 28px gap, square 2px-border cells — is fixed here.]`
- Facet panel: fixed-width sidebar on desktop (inside the 1240px container), full-width slide-up sheet on mobile capped at ~70% viewport height.

## Elevation & Depth

No drop shadows anywhere — depth is expressed through the `panel`/`card` translucency-over-canvas trick in dark mode and through 2px borders, never through shadow. Overlays (Modal, Menu, Console, toasts) sit above content purely via z-index (`--m-z-*` scale) and a backdrop dim, not elevation styling.

## Shapes

Square corners, universally — `{rounded.DEFAULT}` is `0px` and there is no other value in the scale. This is a hard identity marker of Brutalist-mono: a single rounded corner anywhere in the suite is a defect, not a stylistic variant. Borders are 2px everywhere; accent stripes/edges are also 2px, never 3px (a 3px accent edge is a known past mistake called out explicitly in the source system).

## Components

**Inherited as-is** (no visual changes): Button (primary/outline/danger + href/Submit/Icon forms), Field, Textarea, Select, Switch, Checkbox, RadioGroup, Label, FieldError, Avatar, Metric, Dot, Category, StatusBadge, Modal, ModalHeader, ConfirmModal, Menu, Console, Loading, Spinner, InfoBox, ErrorMessage, Stat, Sparkline, UnderlineTabs, TabNav, Toaster, **Theme toggle** (`{components.theme-toggle}` — icon-only `mono-icon-btn`, sun/moon glyph swap, unchanged from NOT LAZY's header). **GlitchText** — reinstated for this suite, Landing hero headline only (see `{components.hero}`), with one behavioral change from its NOT LAZY source: **one-shot on load**, not the source's continuous auto-beat — this suite's "motion is a single restrained gesture" rule (see Brand & Style) overrides the source default. Static frame under reduced-motion is unchanged. `reconcile-notlazy-design-system.md` originally excluded this component; superseded by this decision.

**New for this suite:**

- **Histogram-bar** (`{components.histogram-bar}`) — extends StatBar's block-cell language (`████░░░░`) into a labelled horizontal distribution row: bucket name (`data-label`) → filled cells (`{colors.accent}`) → dotted remainder (`{colors.dim}`) → right-aligned count/%. Exactly the FR-7 Insights dimensions — focal length/lens (one combined dimension), ISO, shutter, aperture, megapixel mix, selfie/rear, hour-of-day. Exposure compensation is a Facet (FR-8), not an Insights dimension (FR-7) — it gets a `range-control` in the Facet-panel, never a histogram row. Stacked vertically, one row per bucket, inside a `Panel`. Always computed over the full readable set — Insights has no filter state to react to.
- **Facet-panel** (`{components.facet-panel}`) — appears only on the Browse tab (Insights is statistics-only, no filter UI). Sidebar (desktop, inside the page container) / slide-up sheet (mobile). Discrete Facets (lens, megapixel mode, front/rear) use Select/RadioGroup/Checkbox; range Facets (date, ISO, aperture, shutter, exposure comp) use `range-control`. Filters combine as AND and narrow the Browse grid only.
- **Range-control** (`{components.range-control}`) — two underline Fields (min/max or from/to) sharing one data-label row; no slider or calendar widget, same input language as `Field`.
- **Photo-grid-cell** (`{components.photo-grid-cell}`) — square 2px-border thumbnail tile in the Browse tab, captioned underneath by an EXIF badge (`{typography.caption}`, Dot-separated — the existing meta-row pattern, e.g. "24mm · f/1.8 · ISO 200") so a filtered result is legible without opening each photo. Unreadable-Metadata photos are excluded entirely (never rendered as a cell).
- **Photo-detail-modal** — the existing Modal shell, body content is a stack of `Spec` rows (label/value, already in `_helpers`) listing every Metadata field.
- **Ingest-progress** — the existing StatBar in determinate mode, labelled "Parsing N/100".
- **Empty-state** — new full-screen centered layout: eyebrow, H1, one-line privacy promise, single primary Button. No header/tabs/panel chrome renders until the first Ingest completes.
- **Header-bar** — new, minimal: wordmark (`display` type) left, theme toggle right, fixed 64px, `{colors.line}` bottom rule. No nav links (there is nowhere else to go).
- **Hero** (`{components.hero}`, Landing) — eyebrow + display headline + one-line body, type-only (no imagery), inside the `{spacing.container-max}` container.
- **Pillar-card** (`{components.pillar-card}`, Landing) — three cards (stacked on mobile), `Panel`-identical chrome: `{colors.card}` fill, `{colors.dim}` 2px border, `{spacing.card-padding}` padding; numbered eyebrow, H3 title, body copy.
- **Preset-comparison** (`{components.preset-comparison}`, Landing) — static before/after image pair, side-by-side on desktop / stacked on mobile, each half framed by a 2px border and labelled with a `data-label` caption. No slider, no JS.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Build every new primitive (histogram-bar, facet-panel) from existing tokens/cells | Invent a new color, border-weight, or shadow style for Insights/Facets |
| Keep corners square, borders 2px, everywhere, including new components | Round a corner or use a 3px accent edge anywhere |
| Use `{colors.accent}` only for primary actions, focus, "selected/live" state | Use accent decoratively or for chart bars that aren't the fill in a histogram |
| Exclude unreadable-Metadata photos from the grid, but always show their count | Silently drop unreadable photos with no visible trace |
| Keep histogram-bar to exactly the FR-7 Insights dimensions | Add exposure-comp or any Facet-only field as a histogram row |
| Keep Facet-panel and any filter UI on Browse only | Show a Facet-panel or filter affordance on Insights |
| Use motion once (load or first scroll-into-view), CSS-only | Loop, re-trigger on scroll-back, or gate content behind an animation |
| Keep both apps' header to wordmark + theme toggle only | Add nav links to a header that has nowhere else to point |
| Grow the design system only for what Gallery/Landing actually consume (SM-C1) | Add chart types, color variants, or components speculatively "for later" |
