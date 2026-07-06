# Spine Pair Review — BMAD Monorepo Product Suite

## Overall verdict

The pair is well-disciplined where it engages: token hygiene is excellent (every color/spacing/typography/component token resolves, hex values verified byte-for-byte against the NOT LAZY source CSS), glossary terms are used verbatim and consistently, both PRD Key User Journeys are present with named protagonists and climax beats, and the imports/reconciliation trail is complete. The critical gap is coverage breadth, not quality: the Landing surface — half the buildable suite — gets an Information Architecture row and a Key Flow, but its three primary content surfaces (Hero, Three pillars, Preset showcase) receive **zero** component specs in either file. A downstream consumer can build the Gallery from this spine with confidence; they cannot build the Landing page from it. A second real gap: several Facet-panel controls (date-range, and numeric ranges for ISO/aperture/shutter) are described only as "range controls" with no backing component anywhere in the inherited or new component lists.

## 1. Flow coverage — strong
Checked: PRD §2.3 lists exactly two UJs (UJ-1, UJ-2); FR-9 is explicitly withdrawn/tombstoned. Both UJs appear in EXPERIENCE.md § Key Flows, each with a named protagonist, numbered steps, an explicit **Climax** beat, and (UJ-1) an explicit **Edge case** step. FR-1–FR-8, FR-10, FR-11 all surface somewhere in EXPERIENCE.md (IA, Component Patterns, or State Patterns); FR-3 (Storybook) is correctly omitted as dev-process, not UX, scope.
### Findings
- **low** UJ-2 has no inline failure/degradation beat (unlike UJ-1's explicit "Edge case" step); the closest equivalent — "Landing, JS disabled/slow" — lives in § State Patterns (EXPERIENCE.md line 84) but isn't cross-referenced from the UJ-2 flow itself (EXPERIENCE.md lines 135–143). *Fix:* add a one-line failure note to UJ-2 pointing at the State Patterns row, mirroring UJ-1's edge-case treatment.

## 2. Token completeness — strong
Checked: all 20 color tokens (10 light/dark pairs) against `imports/notlazy-tokens.css` — every hex/rgba value matches exactly. All 8 typography roles, the `rounded.DEFAULT` scale, and all spacing tokens are defined. Every `{path.to.token}` reference in DESIGN.md body/components (19 distinct refs) resolves to a defined frontmatter token. EXPERIENCE.md uses no `{}` cross-refs (references DESIGN.md sections by dotted path in backticks instead, e.g. `DESIGN.md.components.header-bar`), consistent with the reference example spines' convention — not a defect.
### Findings
- **low** Two frontmatter tokens — `card-padding: 20px` and `hero-padding: 34px` (DESIGN.md lines 91–92) — are defined but never referenced or explained anywhere in either file's prose or component specs. `hero-padding` is doubly orphaned since Hero has no component entry at all (see Finding #3 below). *Fix:* either wire them into a component spec or drop them.
- **low** DESIGN.md § Layout & Spacing restates raw pixel values in prose ("Page gutter: 40px. Container max-width: 1240px... Article/reading measure: 780px @ 40px gutter", line 166) instead of citing the tokens that already cover them (`{spacing.gutter}`, `{spacing.container-max}`, `{spacing.article-max}`), even though nearby lines do cite tokens correctly (`{spacing.control-height}`, line 167). *Fix:* use the token names consistently or drop the redundant raw numbers.

## 3. Component coverage — thin
Checked every component name across both files against DESIGN.md § Components and EXPERIENCE.md § Component Patterns.
### Findings
- **critical** Landing's three primary content surfaces — Hero, Three pillars, Preset showcase (EXPERIENCE.md IA table, lines 39–41; also the body of UJ-2, lines 139–141) — have **no** component entry in DESIGN.md § Components and **no** row in EXPERIENCE.md § Component Patterns. There is no spec for pillar layout (columns vs. stacked cards), the preset before/after comparison pattern (slider? side-by-side static images? image-load states?), or Hero composition beyond the inherited header. This is roughly half the buildable suite's surface area with zero visual or behavioral spec. *Fix:* add DESIGN.md component entries (e.g. `pillar-card`, `preset-comparison`) and matching EXPERIENCE.md Component Pattern rows.
- **high** Facet-panel is spec'd as hosting "Select/RadioGroup/Checkbox/range controls" (DESIGN.md line 113; EXPERIENCE.md line 67), but FR-8 requires a date/date-range facet and several numeric-range facets (ISO, aperture, shutter, exposure comp), and neither DESIGN.md's inherited component list nor its "New for this suite" list contains any Slider, RangeSlider, or DatePicker/calendar primitive. "Range controls" names a need with no backing component. *Fix:* either name the inherited-system's range/date primitive explicitly or add it as a new component with a visual spec.
- **medium** DESIGN.md's own histogram-bar spec is internally inconsistent: the frontmatter `note` (line 109) lists 7 bucket dimensions (focal length / ISO / shutter / aperture / mp-mode / selfie-rear / hour-of-day), while the § Components body text for the same component (line 186) lists 9, adding "lens" (as distinct from focal length) and "exposure comp." Exposure compensation is a Facet per FR-8 but is **not** an Insights dimension per FR-7 — the body text drifts past the PRD's own Insights scope and contradicts its own frontmatter. *Fix:* reconcile the two lists to the FR-7 dimension set.
- **medium** "Theme toggle" has a full behavioral row in EXPERIENCE.md § Component Patterns (line 72, incl. localStorage persistence, `prefers-color-scheme`, anti-FOUC) but is not listed anywhere in DESIGN.md — not in the "Inherited as-is" bullet list, not as a new component, and not visually spec'd (icon? switch? position beyond "header, right"). *Fix:* add it to DESIGN.md's inherited-component list or give it its own entry.
- **low** "Unreadable-count note" (EXPERIENCE.md line 71) is spec'd as "InfoBox **or** Stat" rather than committing to one — a minor violation of the system's own reuse/consistency discipline (DESIGN.md's Do's and Don'ts table). *Fix:* pick one.

## 4. State coverage — adequate
Checked every IA surface (Gallery: Empty state, Ingest, Insights, Browse, Photo detail, Facet panel; Landing: Hero, Three pillars, Preset showcase, Coming soon) against expected empty/cold-load/error/offline/permission states.
### Findings
- **critical** (restated from §3) Hero, Three pillars, and Preset showcase have no states considered at all — e.g. no image-load-failure or slow-load treatment for the Preset showcase's before/after imagery, which is the one piece of Landing content most likely to be asset-heavy.
- **low** No state is defined for a denied/blocked native photo-picker permission (relevant on iOS Safari, which can prompt for photo-library access). This may be a non-issue if `<input type=file>` is used (no persistent OS permission grant required, unlike a native photo-library API) — but that reasoning is never stated, so the omission reads as unaddressed rather than deliberately out of scope. *Fix:* add a one-line `[ASSUMPTION]` note explaining why this is N/A, or add the state if it applies.

## 5. Visual reference coverage — strong
imports/ contains exactly 4 files: `notlazy-design-guide.tsx`, `notlazy-tokens.css`, `notlazy-mono-layer.css`, `notlazy-helpers.tsx`. All 4 are named and attributed to their source repo/paths in `reconcile-notlazy-design-system.md`, which also lists what was deliberately dropped (DraftOverlay, Crepe editor, Stepper, GlitchText/MatrixText, comment threads) with reasoning tied to this suite's scope. `mockups/` and `wireframes/` correctly do not exist yet (expected — key-screen mocks are being rendered in parallel). No findings.

## 6. Bloat & overspecification — strong
Checked for pixel-specs where tokens cover it, source restatement, prose-where-a-table-works, and decorative narrative untied to a decision. EXPERIENCE.md prose stays behavioral throughout (no editorializing); DESIGN.md's editorial voice is appropriate per spec convention and mirrors the reference examples' tone. Foundation section restates PRD platform facts, but only once, at the minimum needed for a self-contained spine — not padding. Key Flow climax narration (e.g. "a picture of his habits he'd never quantified") matches the register of the reference example spines (Quill, Drift) and isn't decorative filler — it's tied to a specific design decision (block-cell reuse) each time.
### Findings
- **low** (cross-ref to §2) raw pixel restatement in Layout & Spacing where named tokens already exist.

## 7. Inheritance discipline — adequate
Checked: both `sources` frontmatter paths in EXPERIENCE.md resolve (`prds/prd-BMAD/prd.md` and `briefs/brief-BMAD/brief.md` both exist on disk). UJ-1/UJ-2 names are used verbatim from PRD §2.3. Glossary terms (Ingest, Facet, Metadata, Insight, Gallery, Landing) are capitalized and used consistently across PRD, DESIGN.md, and EXPERIENCE.md — no lowercase drift found outside legitimate kebab-case component keys (`histogram-bar`, `facet-panel`). Component names match across DESIGN.md and EXPERIENCE.md for every component that appears in both.
### Findings
- **medium** EXPERIENCE.md § Accessibility Floor states "Visual contrast ratios live in `DESIGN.md`" (line 95), but DESIGN.md never states a single numeric contrast ratio or WCAG reference anywhere in the file — the pointer resolves to nothing. Low PRD stakes (accessibility is an explicit `[ASSUMPTION]`-baseline, not formal WCAG AA), but as written it's a dead cross-reference. *Fix:* either add contrast figures to DESIGN.md § Colors or soften the claim in EXPERIENCE.md.

## 8. Shape fit — strong
DESIGN.md sections appear in canonical order: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts (all 8 present, correctly ordered). EXPERIENCE.md's required defaults (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows) are all present in order, with two invented sections placed between Accessibility Floor and Key Flows — the same slot the reference examples use for their own invented sections (Inspiration & Anti-patterns).
### Findings
- **low** "Responsive & Platform" earns its place cleanly — concrete, non-redundant breakpoint behavior differences between the two apps. "Privacy & Data Handling" is thinner (3 bullets) and partially overlaps content already in § Voice and Tone's privacy-copy row; its justification note is honest about being invented but the section could plausibly have been two bullets folded into Voice and Tone instead of a standalone section. Not wrong, just marginal. No fix required, noting for calibration only.

## Mechanical notes

- Frontmatter/body cross-file references all resolve; no broken `{}` token paths found in DESIGN.md.
- All 20 color hex/rgba values cross-checked byte-for-byte against `imports/notlazy-tokens.css` — exact match, no drift.
- Component name casing is consistent (`kebab-case` as frontmatter/component keys, `Title-Case` in prose) throughout both files.
- No lowercase glossary-term drift (Ingest/Facet/Metadata/Insight) found.
- EXPERIENCE.md is 143 lines / DESIGN.md is 203 lines — file lengths confirmed complete (not truncated) via `wc -l`.
- See §3 for the one internal (single-file) inconsistency found: DESIGN.md's histogram-bar frontmatter note vs. its own § Components body text disagree on bucket count/contents.
