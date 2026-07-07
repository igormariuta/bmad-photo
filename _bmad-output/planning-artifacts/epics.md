---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-BMAD/prd.md"
  - "_bmad-output/planning-artifacts/prds/prd-BMAD/addendum.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-BMAD/ARCHITECTURE-SPINE.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-BMAD/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-BMAD/EXPERIENCE.md"
  - "_bmad-output/planning-artifacts/briefs/brief-BMAD/brief.md"
  - "_bmad-output/planning-artifacts/briefs/brief-BMAD/addendum.md"
---

# BMAD - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the **BMAD Monorepo Product Suite** (EXIF Gallery, Landing, shared Brutalist-mono Design System), decomposing the requirements from the PRD, UX Design contract (DESIGN.md + EXPERIENCE.md), and Architecture Spine into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Single-source Design tokens — the Design System defines all color, spacing, typography, and radius primitives as Design tokens in a shared package; both apps render visual primitives from the same token package.
FR2: Shared component library — reusable UI components live in a shared package consumed by both apps via the workspace; lib membership is a pure reuse decision (single-consumer components may stay app-local until a second consumer appears).
FR3: Storybook-driven component development — every shared component has at least one Storybook story rendering its primary states.
FR4: Token-usage enforcement — a `no-arbitrary-value` lint rule fails CI when a hardcoded style value is used where a token exists (covers Tailwind classes, inline `style` props, and CSS-in-JS).
FR5: Manual photo Ingest (client-side) — a user selects photos from their device (mobile-first: native photo picker; desktop file picker also supported); files are read in-browser, no photo bytes or Metadata ever cross the network; multiple photos selectable per Ingest action.
FR6: In-browser Metadata extraction — the Gallery parses EXIF/XMP for each Ingested photo in a Web Worker, extracting at minimum focal length, lens, ISO, aperture, shutter speed, exposure compensation, capture timestamp, megapixel mode (12/48MP), and front/rear camera; a photo with missing/stripped Metadata is counted as "unreadable" rather than crashing the parse.
FR7: Insights dashboard — the Gallery presents aggregate Insights (histogram-bar rows) across the full readable Ingested set: focal length/lens share, ISO distribution, shutter-speed distribution, aperture distribution, megapixel mix, selfie-vs-rear ratio, time-of-day pattern; Insights recompute when the Ingested set changes; percentages compute only over photos with a readable value for that specific field.
FR8: Faceted filtering — a user filters the Ingested set by Facet (lens/focal length, date/date-range, ISO, aperture, shutter speed, exposure compensation, megapixel mode, front/rear camera); filters combine as AND and narrow only the Browse grid (not Insights — see EXPERIENCE.md decision under Additional Requirements).
FR9: WITHDRAWN 2026-07-03 — "Privacy-first location handling" tombstoned to keep FR-10/FR-11 numbering stable. Location/GPS is not a Facet or Insight in this suite (Lazy Cam writes no GPS); the client-side privacy stance is preserved as a cross-cutting NFR instead. No story should be created for this FR number.
FR10: Story-only marketing page — the Landing presents Lazy Cam's promise as static content: three value pillars (kill forced HDR; strip native processing/over-sharpening; own preset system on a clean base, framed as the durable moat) plus concrete preset tooling (tone curves, per-color mixer); no form, email field, waitlist, purchase, or App Store link in v1 — any CTA is a passive "coming soon".
FR11: Built on the shared Design System, responsive — Landing visual primitives come from the shared token package (ties to FR1); page is legible and correctly laid out on mobile and desktop widths.

### NonFunctional Requirements

NFR1: Privacy (load-bearing, hard invariant) — client-side-only; no photo bytes or Metadata ever leave the device; no analytics that capture image content; verifiable via network inspection showing zero photo/Metadata egress.
NFR2: Performance — Gallery Ingest + parse must not freeze the UI on a realistic batch (parse off the main thread); shows a progress state; Ingest is capped at 100 photos/batch (cumulative per session per Architecture AD-7).
NFR3: Consistency — one UI system enforced by Design tokens + `no-arbitrary-value` lint; visual drift between Gallery and Landing is a defect, not a preference (SM-2).
NFR4: WITHDRAWN 2026-07-07 — hosting/deployment is out of scope for this test project; no deployment target is configured. Both apps still build as static output (SSG for Landing / SPA build for Gallery) with no server-side runtime, by architecture choice, independent of hosting. NFR numbering kept stable; no story should be created for this NFR number.
NFR5: Accessibility — baseline: legible contrast within the Brutalist-mono palette, keyboard-operable controls, semantic markup `[ASSUMPTION: pet-project baseline, not a formal WCAG AA commitment]`.
NFR6: Browser support — modern evergreen browsers, mobile Safari included (mobile-first) `[ASSUMPTION]`.

### Additional Requirements

- Monorepo layered structure (AD-1): strict one-way dependency `apps/* → packages/ui → packages/theme`; `packages/theme` has zero internal dependencies; a component used by ≥2 apps must live in `packages/ui`; CI-enforced via `packages/eslint-config` import-boundary rule.
- EXIF parsing owned entirely by a single Web Worker with a fixed message contract (AD-2): `apps/gallery/src/worker` is the only place EXIF is parsed; message shapes are `progress` / `error` / `complete`; over-cap Ingest batches are rejected before any file reaches the worker.
- Insights and Browse are structurally separate selectors over one canonical Zustand store (AD-3): the store itself is not exported, only 3 selectors — `useReadablePhotos()`, `useUnreadableCount()`, `useFacetFilters()`/`useFilteredPhotos()`; `insights/` may import only the first two; import-boundary lint enforces this in CI.
- `Photo` entity is the single contract across Ingest/Insights/Browse/Photo-detail (AD-4): fixed TypeScript shape (`id`, `readable`, `focalLengthMm`, `lensLabel`, `iso`, `apertureF`, `shutterSpeedSec`, `exposureCompEv`, `capturedAt`, `megapixelMode`, `camera`, `thumbnailUrl`); Browse grid-cell badge is pinned to exactly `focalLengthMm` · `apertureF` · `iso`; `thumbnailUrl` revoked only on full-session reset.
- Design tokens have one source, no arbitrary values downstream (AD-5): `packages/theme` exports CSS custom properties (`--m-*`, light/dark) + a Tailwind preset; each app imports the CSS once at its root entry point.
- Megapixel-mode and camera-facing derivation is isolated and unit-tested (AD-6): one normalization layer (`apps/gallery/src/worker/normalize.ts`), covered by Vitest.
- Repeat Ingest ("Add more") appends and dedupes; the 100-photo cap is cumulative for the session, not per-action (AD-7); duplicates identified by `(fileName, size, lastModified)` are silently skipped.
- Photo data never crosses a network boundary (AD-8): the Web Worker's `postMessage` channel (AD-2) is the only path photo bytes or derived `Photo` fields travel, and it never leaves the tab. No deployment target is configured for this test project, so no analytics/monitoring SDK is installed on either app; if one is added later, it must be page-view-only and no custom event may include a `Photo` field value or file content.
- Starter Template: **no scaffolding CLI/starter template specified** — Architecture provides a structural seed (repo layout) instead: `apps/{gallery,landing}` + `packages/{theme,ui,eslint-config,tsconfig}`, `turbo.json`, `pnpm-workspace.yaml`. This structural seed should drive Epic 1 Story 1 (monorepo foundation) directly, rather than a generated starter template.
- Stack/versions to pin during setup: pnpm 11.10.0, Turborepo 2.10.3, React 19.2.7, Vite 8.1.3, Astro 7.0.6, TypeScript 6.0.3, Zustand 5.0.14, ExifReader 4.41.0 (not exifr — unmaintained since 2021), Vitest 4.1.10, Storybook 10.4.6; no hosting/deployment target for this test project.
- CI gate (every PR): `turbo lint` (incl. `no-arbitrary-value` + AD-1/AD-3 import-boundary rules) + `turbo test` (Vitest, EXIF normalization layer) + `turbo build`.
- Deferred / explicitly out of architecture scope: Preset Facet + camera↔gallery Metadata bridge; broader E2E/component test suite beyond the normalization layer; Turborepo remote-cache wiring specifics; GPS/location, Gallery export/saved views; multi-worker parallel parsing.

### UX Design Requirements

UX-DR1: Implement the Brutalist-mono design tokens in `packages/theme` — 10 color tokens (`bg`, `fg`, `accent`, `line`, `panel`, `card`, `muted`, `muted2`, `dim`, `error`) each with light/dark values, two type families (Space Grotesk for `display`/headings, JetBrains Mono for `body`/`prose`/`caption`/`eyebrow`/`data-label`), a 4px-base spacing scale with named rhythm values (`section-rhythm`, `item-gap`, `card-padding`, `control-height`, `header-height`), and `rounded.DEFAULT = 0` (no other radius value exists in the system).
UX-DR2: Port/verify the full set of components inherited as-is from the NOT LAZY design system: Button (primary/outline/danger + href/Submit/Icon forms), Field, Textarea, Select, Switch, Checkbox, RadioGroup, Label, FieldError, Avatar, Metric, Dot, Category, StatusBadge, Modal, ModalHeader, ConfirmModal, Menu, Console, Loading, Spinner, InfoBox, ErrorMessage, Stat, Sparkline, UnderlineTabs, TabNav, Toaster, Theme-toggle.
UX-DR3: Port GlitchText with one behavioral change from its NOT LAZY source — one-shot settle-in on load (~900ms), never a continuous auto-beat; static frame under `prefers-reduced-motion` unchanged.
UX-DR4: Build Histogram-bar (new) — extends StatBar's block-cell language into a labelled horizontal distribution row (bucket name → filled accent cells → dotted remainder → right-aligned count/%); exactly one row per FR-7 Insights dimension (focal length/lens combined, ISO, shutter, aperture, megapixel mix, selfie/rear, hour-of-day); always computed over the full readable set, never the Browse filter state; exposure compensation is never a histogram row (Facet-only).
UX-DR5: Build Facet-panel (new) — Browse-tab-only; sidebar on desktop (inside the 1240px container) / slide-up sheet on mobile (capped ~70% viewport height); discrete Facets (lens, megapixel mode, front/rear) use Select/RadioGroup/Checkbox; range Facets (date, ISO, aperture, shutter, exposure comp) use Range-control; has no presence on the Insights tab.
UX-DR6: Build Range-control (new) — two underline Fields (min/max or from/to) sharing one data-label row; no slider/calendar widget; either side may be left blank to mean "no lower/upper bound"; invalid range (min > max) shows FieldError on the offending side and doesn't apply until corrected.
UX-DR7: Build Photo-grid-cell (new) — square 2px-border thumbnail tile in Browse, captioned underneath by a Dot-separated EXIF badge (exactly `focalLengthMm` · `apertureF` · `iso`, e.g. "24mm · f/1.8 · ISO 200"); unreadable-Metadata photos are excluded entirely, never rendered as a cell.
UX-DR8: Build Photo-detail-modal — reuses the existing Modal/ModalHeader shell; body lists every extracted Metadata field as Spec (label/value) rows; opened by tapping a grid cell; closes via Esc/backdrop/X like every other Modal.
UX-DR9: Build Ingest-progress — reuses StatBar in determinate mode ("Parsing N/100" with a filling block-bar); cannot be dismissed early; announces via `aria-live="polite"`.
UX-DR10: Build Empty-state (new) — full-screen centered layout: eyebrow + H1 + one-line privacy promise + single primary Button that opens the native photo picker; no header/tabs/panel chrome renders until the first Ingest completes.
UX-DR11: Build Header-bar (new) — minimal, fixed 64px tall, wordmark (display type) left + theme toggle right only, `{colors.line}` bottom rule, no nav links; shared by both Gallery and Landing.
UX-DR12: Build Hero (new, Landing) — eyebrow + display headline + one-line body, type-only (no imagery), inside the 1240px container; headline plays the GlitchText one-shot settle-in (~900ms: jitter + accent/error chromatic ghost, then resolves to static type); eyebrow/body fade up shortly after, CSS-only.
UX-DR13: Build Pillar-card (new, Landing) — three cards (stacked on mobile), Panel-identical chrome (`card` fill, `dim` 2px border, `card-padding`); numbered eyebrow ("01"/"02"/"03"), H3 title, body copy; fades up once as each card enters the viewport, staggered ~90ms apart, CSS-only, no re-trigger on scroll-back; equal visual weight across all three (no "featured" pillar).
UX-DR14: Build Preset-comparison (new, Landing) — static before/after image pair (tone-curve and color-mixer examples), side-by-side on desktop / stacked on mobile, each half framed by a 2px border and labelled with a data-label caption ("BEFORE"/"AFTER"); fades up once on scroll-in, same treatment as Pillar-card; if an image fails to load, falls back to an ErrorMessage-style muted placeholder frame with alt text, never a broken-image icon.
UX-DR15: Enforce accessibility floor across new components: Photo grid cells are `<button>`-semantic with an `aria-label` naming at least the capture date; Facet-panel controls carry the inherited Field/Select label + `role="alert"` FieldError conventions; Photo-detail-modal reuses the inherited Modal's focus trap and `aria-labelledby` wiring verbatim; Landing has no forms beyond the theme toggle, so heading order (H1 hero → H3 pillars) is the main accessibility surface; all Landing motion respects `prefers-reduced-motion: reduce` (renders final state instantly).
UX-DR16: Implement responsive breakpoint behavior: Gallery — 2-column photo grid + Facet-panel as slide-up sheet + single-column Insights histograms below `sm`; grid columns scale with viewport from `sm`–`lg`; Facet-panel becomes a persistent sidebar and grid gains more columns at `≥lg` (1240px container). Landing — single-column full-width sections below `sm`, wider gutters `sm`–`lg`, content capped at 1240px at `≥lg`; no primary/secondary device distinction.
UX-DR17: Implement UnderlineTabs (Insights/Browse) behavior — switching tabs preserves scroll position and active Facet filters independently per tab; Insights always reflects the full readable set and never reacts to Browse's Facet filters (this is a deliberate reversal of the PRD §9 assumption that filters would narrow both views — EXPERIENCE.md decision, architecture AD-3 enforces it structurally).
UX-DR18: Implement Facet-panel live-filtering behavior — every control change re-filters the Browse grid immediately (no "Apply" button); active filter count shown on the panel's trigger on mobile; "Clear-all" resets to the full readable set.
UX-DR19: Implement empty/error state copy and behavior per EXPERIENCE.md's State Patterns table: "Filtered set is empty" (Browse only) shows a message + visible "Clear filters" action, distinct from the zero-photos empty-state; "All photos unreadable" renders empty-of-data with a prominent unreadable count (not an error); Unreadable-count InfoBox is visible only when N > 0 (never shows "0 unreadable"); Batch-exceeds-100 shows a message stating the cumulative limit before any file is parsed (per Architecture AD-7).
UX-DR20: Implement the microcopy voice contract (EXPERIENCE.md "Voice and Tone" Do/Don't table) — plain, non-editorializing statements of fact (e.g. "Nothing uploads. Nothing's stored.", "42 unreadable — excluded from the numbers below.", "24mm — 58%") rather than marketing language or exclamation-point energy, across both Gallery and Landing copy.
UX-DR21: Implement Theme-toggle behavior — persists to `localStorage`; respects `prefers-color-scheme` on first visit; no flash-of-wrong-theme via an inline blocking script, shared by both apps' Header-bar.

### FR Coverage Map

FR1: Epic 1 — Single-source Design tokens (`packages/theme`)
FR2: Epic 1 — Shared component library (`packages/ui`)
FR3: Epic 1 — Storybook-driven component development
FR4: Epic 1 — Token-usage enforcement (`no-arbitrary-value` lint)
FR5: Epic 2 — Manual photo Ingest (client-side, Web Worker)
FR6: Epic 2 — In-browser Metadata extraction
FR7: Epic 2 — Insights dashboard
FR8: Epic 3 — Faceted filtering + Photo-detail
FR9: WITHDRAWN — no coverage (tombstoned)
FR10: Epic 4 — Story-only marketing page
FR11: Epic 4 — Built on shared Design System, responsive

## Epic List

### Epic 1: Shared Design System & Monorepo Foundation
Establishes the monorepo (`apps/{gallery,landing}` + `packages/{theme,ui,eslint-config,tsconfig}`, pnpm+Turborepo per the Architecture structural seed — no separate starter template), the Brutalist-mono design tokens, the full inherited-as-is component library in Storybook, and CI lint/test/build gates. Outcome: a working, documented component library and monorepo scaffold both apps can build on.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 2: EXIF Gallery — Ingest & Insights
A user can open the Gallery, ingest photos client-side (privacy-preserving, off-main-thread parsing), and see the Insights dashboard of their shooting habits. Delivers the PRD's core hook (SM-3) standalone.
**FRs covered:** FR5, FR6, FR7

### Epic 3: EXIF Gallery — Browse & Facet Filtering
Building on Epic 2's ingested set, a user can switch to Browse, filter by any Facet, and inspect full metadata for a single photo. Complete, standalone exploration experience.
**FRs covered:** FR8
**⚠️ Blocked by Epic 2** — requires the `Photo` entity contract and Zustand store/selectors (AD-3/AD-4) already in place from Epic 2; do not parallelize implementation with Epic 2, as both write to the same store/selector layer.

### Epic 4: Landing — Camera App Story Page
A visitor reads the Lazy Cam story (hero, three pillars, preset showcase) on a static, responsive page built on the shared Design System. Independent of Epics 2–3; only depends on Epic 1.
**FRs covered:** FR10, FR11

*(FR9 is tombstoned/withdrawn — no epic/story covers it.)*

**Dependencies:** 2 → 1; 3 → 1, 2 (blocking dependency via shared store); 4 → 1 (buildable in parallel with 2/3).

## Epic 1: Shared Design System & Monorepo Foundation

Establishes the monorepo (`apps/{gallery,landing}` + `packages/{theme,ui,eslint-config,tsconfig}`, pnpm+Turborepo per the Architecture structural seed — no separate starter template), the Brutalist-mono design tokens, the full inherited-as-is component library in Storybook, and CI lint/test/build gates. Outcome: a working, documented component library and monorepo scaffold both apps can build on.

### Story 1.1: Monorepo & Tooling Foundation

As a developer,
I want a working pnpm+Turborepo monorepo scaffold with pinned tooling and a CI gate,
So that all subsequent feature work builds on a consistent, enforced foundation.

**Acceptance Criteria:**

**Given** an empty repo
**When** the scaffold is applied
**Then** `apps/{gallery,landing}` and `packages/{theme,ui,eslint-config,tsconfig}` exist per the Architecture structural seed, with `turbo.json` and `pnpm-workspace.yaml` wiring them into one workspace
**And** pnpm 11.10.0, Turborepo 2.10.3, and TypeScript 6.0.3 are pinned exactly as specified in the Architecture stack table

**Given** the monorepo scaffold exists
**When** a PR is opened
**Then** CI runs `turbo lint` + `turbo test` + `turbo build`
**And** the PR fails if any of those commands fail

### Story 1.2: Design Tokens Package

As a developer,
I want a single-source design-tokens package,
So that both apps render identical visual primitives and a token change propagates everywhere.

**Acceptance Criteria:**

**Given** `packages/theme`
**When** it is built
**Then** it exports the 10 Brutalist-mono color tokens (`bg`, `fg`, `accent`, `line`, `panel`, `card`, `muted`, `muted2`, `dim`, `error`) with light/dark values as CSS custom properties (`--m-*`)
**And** it exports the full typography scale (`display`/`h1`/`h3`/`prose`/`body`/`caption`/`eyebrow`/`data-label`) across the Space Grotesk and JetBrains Mono families
**And** it exports the 4px-base spacing scale with named rhythm values (`section-rhythm`, `item-gap`, `card-padding`, `control-height`, `header-height`) and `rounded.DEFAULT = 0` as the only radius value
**And** it ships a Tailwind preset built on these tokens

**Given** the token package is published to the workspace
**When** an app imports its CSS once at its root entry point (`main.tsx` / the Astro base layout)
**Then** no per-component re-import is required

### Story 1.3: Token-usage Lint Enforcement

As a developer,
I want CI to fail when a hardcoded style value is used instead of a token,
So that visual drift between Gallery and Landing never lands on `main`.

**Acceptance Criteria:**

**Given** `packages/eslint-config`'s `no-arbitrary-value` rule and the token set from Story 1.2
**When** a literal color or spacing value is introduced where a token exists — in a Tailwind class string, an inline `style` prop, or CSS-in-JS
**Then** `turbo lint` fails in CI

**Given** the rule is applied in both apps and in `packages/ui`
**When** any of those three consumers introduces an arbitrary value
**Then** the same failure is triggered, with no exemptions

### Story 1.4: Shared Component Library — Core Interactive Primitives

As a developer,
I want the core form/input components built once and demonstrated in Storybook,
So that Gallery and Landing consume one implementation instead of duplicating it.

**Acceptance Criteria:**

**Given** `packages/theme` (Story 1.2)
**When** Button (primary/outline/danger + href/Submit/Icon forms), Field, Textarea, Select, Switch, Checkbox, RadioGroup, Label, and FieldError are implemented in `packages/ui`
**Then** each renders exclusively via tokens — no arbitrary values (verifiable by Story 1.3's lint rule)
**And** each component ships at least one co-located `.stories.tsx` file rendering its primary states

### Story 1.5: Shared Component Library — Display, Feedback & Navigation Primitives

As a developer,
I want the remaining inherited display/feedback/navigation components built and documented,
So that the full shared library is ready before feature epics consume it.

**Acceptance Criteria:**

**Given** `packages/theme` (Story 1.2)
**When** Avatar, Metric, Dot, Category, StatusBadge, Modal, ModalHeader, ConfirmModal, Menu, Console, Loading, Spinner, InfoBox, ErrorMessage, Stat, Sparkline, UnderlineTabs, TabNav, Toaster, and Theme-toggle are implemented in `packages/ui`
**Then** each is token-only styled and ships a co-located Storybook story

**Given** Theme-toggle is implemented
**When** it is toggled
**Then** it persists its state to `localStorage` and respects `prefers-color-scheme` on first render, independent of any app wiring it into a header later

## Epic 2: EXIF Gallery — Ingest & Insights

A user can open the Gallery, ingest photos client-side (privacy-preserving, off-main-thread parsing), and see the Insights dashboard of their shooting habits. Delivers the PRD's core hook (SM-3) standalone. In this epic, Browse does not yet exist — after the first Ingest, the user lands directly on Insights as the single view (no UnderlineTabs); the tab switcher is introduced in Epic 3 alongside Browse, so this epic contains no dead/unreachable navigation.

### Story 2.1: Empty State & Client-side Photo Ingest

As the builder (primary user),
I want to open the Gallery and select a batch of photos from my device,
So that I can begin analyzing my shooting habits without any account or upload step.

**Acceptance Criteria:**

**Given** the Gallery is opened with no photos yet Ingested
**When** the app renders
**Then** the empty-state shows the privacy promise and a single "Add photos" button, with no header/tabs/panel chrome visible

**Given** the empty-state
**When** the user taps "Add photos"
**Then** the native photo picker opens (mobile: phone photo library; desktop: file picker), and multiple photos can be selected in one action
**And** no network request carries photo bytes or Metadata (verifiable in the network inspector, per NFR1)

**Given** a first-Ingest selection
**When** the selection exceeds 100 photos
**Then** the action is rejected with a message stating the limit, before any file reaches the worker

**Given** the empty-state's privacy-promise copy
**When** it is written
**Then** it follows the plain, non-editorializing voice/tone contract (e.g. "Nothing uploads. Nothing's stored.") — no marketing fluff or exclamation-point energy

### Story 2.2: In-browser Metadata Extraction (Web Worker)

As the builder,
I want my photos' EXIF metadata extracted entirely in my browser via a background worker,
So that parsing doesn't freeze the UI and no data ever leaves my device.

**Acceptance Criteria:**

**Given** a batch of Ingested photo files
**When** they are parsed
**Then** `apps/gallery/src/worker` owns all EXIF extraction via a fixed message contract (`progress`/`error`/`complete`), and the main thread never parses EXIF itself (AD-2)

**Given** the worker's raw output
**When** it is normalized in `apps/gallery/src/worker/normalize.ts`
**Then** it produces the `Photo` entity contract (AD-4), with megapixel-mode and camera-facing derivation covered by Vitest unit tests (AD-6)

**Given** a photo with missing or stripped Metadata
**When** it is parsed
**Then** it is marked `readable: false` and counted, without crashing the batch parse

**Given** the extraction pipeline runs end-to-end
**When** any file is processed
**Then** no network call carries photo bytes or derived `Photo` field values (AD-8, NFR1)

### Story 2.3: Ingest Progress Indicator

As the builder,
I want to see parsing progress while my batch is processed,
So that I know the app is working and the interface stays responsive.

**Acceptance Criteria:**

**Given** an Ingest batch is being parsed
**When** progress updates arrive from the worker
**Then** a determinate StatBar shows "Parsing N/100" with a filling block-bar, announced via `aria-live="polite"`

**Given** a realistic batch size
**When** parsing is in progress
**Then** the main thread stays responsive (NFR2)

**Given** the progress indicator is showing
**When** the user attempts to dismiss it early
**Then** it cannot be dismissed — content becomes interactive only once Ingest completes

### Story 2.4: Insights Dashboard

As the builder,
I want to see an Insights dashboard of my shooting habits after ingesting photos,
So that I learn something true about how I actually shoot.

**Acceptance Criteria:**

**Given** the first successful Ingest completes
**When** the Gallery renders
**Then** the Header-bar (wordmark + theme-toggle, no nav links) appears, and Insights renders as the single view

**Given** the full readable set
**When** Insights renders
**Then** it shows one histogram-bar row per FR-7 dimension — focal length/lens (combined), ISO, shutter, aperture, megapixel mix, selfie/rear, hour-of-day — always computed over the full readable set
**And** each field's percentage is computed only over photos with a readable value for that specific field

**Given** the Ingested set changes
**When** a change occurs
**Then** Insights recompute

**Given** N photos are unreadable
**When** N > 0
**Then** an unreadable-count InfoBox is visible, phrased plainly per the voice/tone contract (e.g. "42 unreadable — excluded from the numbers below.", never hiding *why* they're excluded); when N = 0, it is absent (never "0 unreadable")

**Given** every Ingested photo is unreadable
**When** Insights renders
**Then** it renders empty-of-data with a prominent unreadable count, treated as a valid informative outcome, not an error

### Story 2.5: Repeat Ingest ("Add More") — Append, Dedupe, Cumulative Cap

As the builder,
I want to add more photos to my existing session,
So that my Insights update to reflect my whole library without losing what I already ingested.

**Acceptance Criteria:**

**Given** an existing Ingested set
**When** the user triggers "Add photos" again from the persistent Header-bar affordance
**Then** the new selection appends to the existing store — it never replaces it (AD-7)

**Given** the cumulative session total
**When** an "Add more" action would push the total over 100
**Then** it is rejected with a message stating the limit, before any file reaches the worker

**Given** a re-selected file with the same `(fileName, size, lastModified)` as an already-Ingested file
**When** it is processed
**Then** it is silently deduped — not re-added or double-counted in Insights

**Given** an "Add more" action succeeds
**When** the store updates
**Then** Insights recompute over the new full readable set

## Epic 3: EXIF Gallery — Browse & Facet Filtering

Building on Epic 2's ingested set, a user can switch to Browse, filter by any Facet, and inspect full metadata for a single photo. Complete, standalone exploration experience. **Blocked by Epic 2** — requires the `Photo` entity contract and Zustand store/selectors (AD-3/AD-4) already in place; do not parallelize implementation with Epic 2.

### Story 3.1: UnderlineTabs — Insights/Browse Split

As the builder,
I want to switch between Insights and Browse without losing my place in either,
So that I can explore my library without disrupting my habits overview.

**Acceptance Criteria:**

**Given** Epic 2's single Insights view
**When** Browse is introduced
**Then** an UnderlineTabs control adds Insights and Browse as two tabs

**Given** the user switches tabs
**When** they return to a previously-visited tab
**Then** scroll position and active Facet filters are preserved independently per tab

**Given** Browse's Facet filters are active
**When** Insights renders
**Then** Insights is unaffected — it always reflects the full readable set (AD-3: `insights/` may import only `useReadablePhotos`/`useUnreadableCount`, never Browse's selectors, enforced by the eslint import-boundary rule)

### Story 3.2: Photo Grid (Browse) — Unfiltered View

As the builder,
I want to see my ingested photos as a browsable grid,
So that I can visually scan my library.

**Acceptance Criteria:**

**Given** the Browse tab with no filters applied
**When** it renders
**Then** it shows the full readable set as a grid of Photo-grid-cell tiles — square, 2px border, no radius

**Given** a grid cell
**When** it renders
**Then** it shows an EXIF badge below the thumbnail with exactly three fields, in order: `focalLengthMm` (as lens label) · `apertureF` · `iso`

**Given** an unreadable photo
**When** the grid renders
**Then** that photo is excluded entirely, never rendered as a cell

**Given** different viewport widths
**When** the grid renders
**Then** it shows 2 columns below `sm`, scales columns between `sm`–`lg`, and gains a persistent sidebar layout at `≥lg`

### Story 3.3: Facet Panel & Live Filtering

As the builder,
I want to filter my library by any facet,
So that I can narrow down to exactly the shots I'm looking for.

**Acceptance Criteria:**

**Given** the Browse tab
**When** the Facet-panel renders
**Then** it appears as a sidebar on desktop (inside the 1240px container) or a slide-up sheet on mobile, with controls for lens, date-range, ISO, aperture, shutter, exposure comp, megapixel mode, and front/rear

**Given** a discrete Facet (lens, megapixel mode, front/rear)
**When** its control renders
**Then** it uses Select/RadioGroup/Checkbox; for range Facets (date, ISO, aperture, shutter, exposure comp), it uses Range-control (two Fields, either side may be blank to mean unbounded)

**Given** a range Facet with min > max
**When** the invalid range is entered
**Then** a FieldError shows on the offending side, and the filter doesn't apply until corrected

**Given** any Facet control changes
**When** the change is committed
**Then** the Browse grid re-filters immediately (AND-combined, no "Apply" button), the mobile trigger shows the active filter count, and "Clear-all" resets to the full readable set

**Given** Facet filters are active on Browse
**When** Insights is viewed
**Then** Insights remains unaffected (per Story 3.1)

### Story 3.4: Empty Filtered State

As the builder,
I want clear feedback when my filters match nothing,
So that I know to adjust them rather than think the app is broken.

**Acceptance Criteria:**

**Given** active Facet filters that match zero photos
**When** the Browse grid renders
**Then** it shows a "No photos match these filters" message with a visible "Clear filters" action

**Given** this empty-filtered state
**When** compared to the zero-photos empty-state (Story 2.1)
**Then** the two are visually and textually distinct

### Story 3.5: Photo Detail Modal

As the builder,
I want to tap a photo to see its full metadata,
So that I can inspect exactly what was captured.

**Acceptance Criteria:**

**Given** a photo grid cell
**When** the user taps it
**Then** a Photo-detail-modal opens, reusing the inherited Modal/ModalHeader shell

**Given** the modal is open
**When** its body renders
**Then** it lists every extracted Metadata field as Spec (label/value) rows — the badge's three fields plus shutter speed, exposure compensation, capture timestamp, megapixel mode, and front/rear

**Given** the modal is open
**When** the user presses Esc, clicks the backdrop, or clicks the close control
**Then** it closes, using the same focus-trap and `aria-labelledby` wiring as every other Modal in the system

**Given** a grid cell
**When** it is rendered
**Then** it is `<button>`-semantic with an `aria-label` naming at least the photo's capture date

## Epic 4: Landing — Camera App Story Page

A visitor reads the Lazy Cam story (hero, three pillars, preset showcase) on a static, responsive page built on the shared Design System. Independent of Epics 2–3; only depends on Epic 1.

### Story 4.1: Header & Hero

As Maya (secondary persona — an iPhone shooter who rejects the stock look),
I want to land on the page and immediately understand the app's promise,
So that I recognize my own frustration within seconds.

**Acceptance Criteria:**

**Given** the Landing page loads
**When** it renders
**Then** the shared Header-bar (wordmark + theme-toggle, reused from `packages/ui`) appears at the top

**Given** the Hero section
**When** it renders
**Then** it shows an eyebrow + display headline + one-line body, type-only (no imagery), inside the 1240px container

**Given** the headline
**When** the page loads
**Then** it plays a one-shot GlitchText settle-in (~900ms: jitter + accent/error chromatic ghost, then resolves to static type) — ported as a Landing-local component (single-consumer, per the FR-2 assumption) rather than into `packages/ui`
**And** the eyebrow/body fade up shortly after, CSS-only

**Given** `prefers-reduced-motion: reduce`
**When** the page loads
**Then** all motion collapses to its final static state instantly

### Story 4.2: Value Pillars

As Maya,
I want to see the three value pillars explained plainly,
So that I understand exactly what makes this camera app different.

**Acceptance Criteria:**

**Given** the three-pillars section
**When** it renders
**Then** three Pillar-card components show (stacked on mobile, side-by-side on desktop) with Panel-identical chrome, each with a numbered eyebrow ("01"/"02"/"03"), an H3 title, and body copy

**Given** the pillar content
**When** it renders
**Then** it states: kill forced HDR; strip native processing/over-sharpening; own preset system framed as the durable moat (the reason to stay even if iOS later allows disabling HDR natively)

**Given** each card enters the viewport
**When** it is scrolled into view
**Then** it fades up once, staggered ~90ms apart from adjacent cards, and does not re-trigger on scrolling back up
**And** all three cards carry equal visual weight — no "featured" pillar

### Story 4.3: Preset Showcase

As Maya,
I want to see concrete examples of the preset tools,
So that I can evaluate whether they'd solve my problem.

**Acceptance Criteria:**

**Given** the preset-showcase section
**When** it renders
**Then** a static before/after image pair (a tone-curve example and a color-mixer example) shows side-by-side on desktop / stacked on mobile, each half framed by a 2px border and labelled with a data-label caption ("BEFORE"/"AFTER")

**Given** the preset explanation copy
**When** it renders
**Then** it names concrete tools: shadow/highlight tone curves, and a Lightroom-style per-color mixer (mute/boost + hue shift, e.g. yellow→orange)

**Given** the section enters the viewport
**When** it is scrolled into view
**Then** it fades up once, same treatment as Pillar-card

**Given** an image fails to load
**When** the failure occurs
**Then** it falls back to an ErrorMessage-style muted placeholder frame with alt text — never a broken-image icon

### Story 4.4: Coming Soon Close & Cross-cutting Compliance

As Maya,
I want to leave informed rather than pressured,
So that I trust the brand's honesty even without signing up.

**Acceptance Criteria:**

**Given** the page footer
**When** it renders
**Then** it ends on a passive "coming soon" note, with no form, email field, waitlist, purchase, or App Store link anywhere on the page

**Given** all Landing copy
**When** it is written
**Then** it follows the plain, non-editorializing voice/tone contract (e.g. "The stock look is harsh. This is how you escape it.") — no marketing fluff or exclamation-point energy

**Given** different viewport widths
**When** the page renders
**Then** it shows single-column full-width sections below `sm`, wider gutters `sm`–`lg`, and content capped at the 1240px container at `≥lg`

**Given** the page's heading structure
**When** assessed for accessibility
**Then** heading order (H1 hero → H3 pillars) is correct, and the theme-toggle is the only interactive control beyond standard links

**Given** the theme-toggle
**When** used
**Then** it persists to `localStorage`, respects `prefers-color-scheme` on first visit, and shows no flash-of-wrong-theme

**Given** JavaScript is disabled or slow
**When** the page loads
**Then** it remains fully legible top to bottom (static SSG), with only the theme-toggle depending on JS
