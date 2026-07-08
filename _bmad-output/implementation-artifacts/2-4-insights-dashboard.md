---
baseline_commit: 2653b4e3a60180b1ca575218c70921fc484a9135
---

# Story 2.4: Insights Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want to see an Insights dashboard of my shooting habits after ingesting photos,
so that I learn something true about how I actually shoot.

## Acceptance Criteria

1. **Given** the first successful Ingest completes, **when** the Gallery renders, **then** the Header-bar (wordmark + theme-toggle, no nav links) appears, and Insights renders as the single view. [Source: planning-artifacts/epics.md#Story 2.4]
2. **Given** the full readable set, **when** Insights renders, **then** it shows one histogram-bar row per FR-7 dimension — focal length/lens (combined), ISO, shutter, aperture, megapixel mix, selfie/rear, hour-of-day — always computed over the full readable set; **and** each field's percentage is computed only over photos with a readable value for that specific field. [Source: planning-artifacts/epics.md#Story 2.4; architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4]
3. **Given** the Ingested set changes, **when** a change occurs, **then** Insights recompute. [Source: planning-artifacts/epics.md#Story 2.4]
4. **Given** N photos are unreadable, **when** N > 0, **then** an unreadable-count InfoBox is visible, phrased plainly (e.g. "42 unreadable — excluded from the numbers below."); when N = 0, it is absent (never "0 unreadable"). [Source: planning-artifacts/epics.md#Story 2.4]
5. **Given** every Ingested photo is unreadable, **when** Insights renders, **then** it renders empty-of-data with a prominent unreadable count, treated as a valid informative outcome, not an error. [Source: planning-artifacts/epics.md#Story 2.4]

## Dev Notes — read this first

- **Depends on Story 2.2** (`useReadablePhotos()`/`useUnreadableCount()` selectors) and Story 2.3 (the progress screen this story's completion transition follows).
- **Gap-fill: `Header-bar` is not built by any Epic 1 story** (checked: it's a "New" component per DESIGN.md, absent from both Story 1.4's and 1.5's inherited-component lists) — yet this story's AC #1 requires it, and Story 4.1 later says it's "reused from `packages/ui`." Build it here, in `packages/ui` (shared — Story 4.1 depends on it existing there), not Gallery-local. 64px tall (`--m-space-header-height`), `ThemeToggle` (Story 1.5) right, `--m-line` bottom rule, no nav links (there's nowhere else to point).
- **Wordmark is a prop, not fixed content — confirmed by the real mockups (`mockups/gallery-browse.html`, `gallery-insights.html` vs. `mockups/landing-hero.html`).** Gallery's Header-bar renders `"EXIF "` in plain `--m-fg` + `"GALLERY"` in `--m-accent`; Landing's renders `"LAZY "` in plain + `"CAM"` in accent. Same component, different text — so `Header-bar` needs a prop carrying both the plain and accent-colored portions (e.g. `wordmark: string` + `wordmarkAccent: string`, rendered as `{wordmark} <span className="text-accent">{wordmarkAccent}</span>`), not a hardcoded string. This corrects an earlier draft of this story, which had no real source for the wordmark text and guessed it might be unbranded — the mockups settle it.
- **Gap-fill: `Panel` doesn't exist as a real component anywhere yet either.** The reference's `Panel` (seen wrapping every demo section in `notlazy-design-guide.tsx`) actually comes from `notlazy-helpers.tsx` — a **demo-page-only layout helper**, not a ported product component. DESIGN.md's own prose reuses the same card+caption chrome concept for real product surfaces in two places: Histogram-bar here ("stacked... inside a Panel") and Pillar-card in Story 4.2 ("Panel-identical chrome"). Two consumers across two apps means FR-2's reuse rule applies — build a real `Panel` in `packages/ui` now: `caption: string`, `tone?: 'accent' | 'muted'` (default `'accent'`), `bordered?: boolean` (default **`false`**), children, `className?`; `--m-card` background, `--m-card-padding`, caption in 11px/0.12em `--m-accent`/`--m-muted2` depending on `tone`, and a 2px `--m-dim` border **only when `bordered` is set**. **This default-false border corrects an earlier draft of this story**, which baked the border in unconditionally reasoning from DESIGN.md's Pillar-card wording alone — the real Insights mockup (`mockups/gallery-insights.html`, `.hist-panel` class) shows the histogram panels with **no border at all**, just card background + padding, confirming Panel's default (used by this story) must stay borderless; Story 4.2's Pillar-card is the one that opts into `bordered`.
- **Gap-fill: `Histogram-bar` (UX-DR4, "New") is this story's own responsibility to build — it's not in any Epic 1 component-library story.** Since Insights is its only consumer anywhere in this project, build it **Gallery-local** (`apps/gallery/src/features/insights/`), not in `packages/ui` — same single-consumer reasoning epics.md itself applies to `GlitchText` in Story 4.1 (FR-2's assumption). It extends `StatBar`'s block-cell visual language (Story 1.5) into a labelled row: bucket name (`data-label`) → filled cells (`--m-accent`) → dotted remainder (`--m-dim`) → right-aligned count/%. 20px tall, `rounded.DEFAULT` radius.
- **App-shell now has three states to gate, not two** (Stories 2.1/2.3 built the first two): empty/no selection → Empty-state; parsing in progress → Progress indicator; parsing complete → Header-bar + Insights (this story). Finalize that three-way gate here.
- **Bucketing logic per dimension — most dimensions need no arbitrary bucketing at all, only two genuinely need invented bucket boundaries:**
  - **Focal length/lens (combined):** group by `lensLabel` directly (it already encodes focal length, e.g. `"24mm"`) — one row per distinct lens, no separate focal-length dimension needed
  - **Aperture:** group by exact `apertureF` value — phone lenses have a small fixed set of physical apertures per lens, so exact-value grouping already produces meaningful buckets; no numeric range bucketing needed
  - **Megapixel mix:** exactly 2 buckets (`12`, `48`) — trivial
  - **Selfie/rear:** exactly 2 buckets (`front`, `rear`) — trivial
  - **ISO:** the real Insights mockup (`mockups/gallery-insights.html`) shows the actual intended buckets — **4 ranges, not 7 single-stops**: `32–100`, `100–400`, `400–1600`, `1600+`. This corrects an earlier draft of this story, which invented 7 single-photographic-stop buckets (100/200/400/800/1600/3200/6400) with no source; use the mockup's 4-bucket scheme instead — it's concrete design evidence, not an inference.
  - **Hour-of-day:** the same mockup also settles this — **6 buckets of 4 hours each** (`00–04`, `04–08`, `08–12`, `12–16`, `16–20`, `20–24`), sorted descending by share, not literal individual 0–23 hour rows. This corrects an earlier draft of this story, which reasoned from UX-DR4's "hour-of-day" wording alone (without checking the mockup) that literal per-hour buckets were intended — they aren't; the mockup is the authoritative source here over the more ambiguous prose naming.
  - **`[ASSUMPTION]` Shutter speed:** no mockup shows this dimension — still unspecified upstream; use standard shutter-speed stops (1/1000s-or-faster, 1/500, 1/250, 1/125, 1/60, 1/30, 1/15-or-slower) as a reasonable default, flag if a different scheme is wanted
  - **Every dimension's rows sort descending by count/share** — this is what makes "most-used focal length: 24mm (58%)" (PRD's own UJ-1 example) the first row a viewer sees, not an arbitrary or alphabetical order.
- **The per-field percentage rule (AD-4) governs every dimension:** a photo missing that specific field (e.g. no `exposureCompEv`... note exposure comp is a Facet, not a histogram dimension, see below) is excluded from *that dimension's* denominator, not from the overall readable count. This is why ISO's percentages and aperture's percentages can each divide by a slightly different N if some readable photos are missing just one of those fields.
- **Exposure compensation is a Facet (Story 3.3), never a histogram row here** — UX-DR4 explicitly excludes it from Insights; don't add an 8th dimension.
- **AC #3 (recompute on change) needs no new mechanism** — `useReadablePhotos()`/`useUnreadableCount()` are already reactive Zustand selectors (Story 2.2); as long as Insights reads through them (not a one-time snapshot), React re-renders automatically when Story 2.5's "Add more" changes the store. Don't build a manual recompute trigger.
- **AD-3 still applies:** `insights/` may import only `useReadablePhotos()`/`useUnreadableCount()` — never reach past them, even though `browse/` doesn't exist yet in this epic to accidentally import from.

## Tasks / Subtasks

- [x] Task 1: Build `Header-bar` (AC: #1) — `packages/ui/src/HeaderBar/`
  - [x] Props: `wordmark: string`, `wordmarkAccent: string` (rendered `{wordmark} <span class="text-accent">{wordmarkAccent}</span>`, per the mockup evidence in Dev Notes — Gallery passes `wordmark="EXIF "` `wordmarkAccent="GALLERY"`, Landing (Story 4.1) passes `wordmark="LAZY "` `wordmarkAccent="CAM"`), `actions?: ReactNode`
  - [x] Fixed 64px (`--m-space-header-height`), wordmark left (display type) + `ThemeToggle` right, `--m-line` bottom rule, no nav links
  - [x] `actions` slot renders between the wordmark and `ThemeToggle`, defaulting to nothing — added specifically because Story 2.5 needs a persistent "Add more" trigger inside the Header-bar, but Landing's Story 4.1 usage must stay exactly wordmark+theme-toggle with nothing passed to this slot
  - [x] Storybook story (co-located, per Story 1.4/1.5's convention — this component was missed by those stories, add its story now), including one variant with `actions` populated

- [x] Task 2: Build `Histogram-bar` (AC: #2) — `apps/gallery/src/features/insights/HistogramBar.tsx`
  - [x] Props: `label: string` (bucket name), `value: number` (0–100 share), `count: number` (raw count for the right-aligned display), `cells?: number` (defaults reasonably, e.g. `48` matching `StatBar`'s reference resolution)
  - [x] Visual: extends `StatBar`'s cell language — filled `--m-accent` cells to `value`%, dotted `--m-dim` remainder, right-aligned count/% — 20px row height, `rounded.DEFAULT`
- [x] Task 3: Aggregation logic per FR-7 dimension (AC: #2)
  - [x] Implement the 7 dimensions exactly as scoped in Dev Notes (focal length/lens combined by `lensLabel`; ISO in the mockup's 4 fixed ranges; shutter bucketed per the stated stop series; aperture/megapixel/camera by exact value; hour-of-day in the mockup's 6 four-hour ranges), each computed over `useReadablePhotos()`'s current set
  - [x] Each dimension's denominator is the count of readable photos where *that dimension's* source field is defined — not the full readable count
  - [x] Sort each dimension's rows descending by count
- [x] Task 4: Insights view composition (AC: #1, #2, #3)
  - [x] Render inside a `Panel` per dimension (default `bordered={false}`, matching the real Insights mockup), one `HistogramBar` row per bucket, in the fixed dimension order given in AC #2
  - [x] Update `app-shell`'s gating to a 3-way switch (empty-state / progress / header+Insights) per Dev Notes
- [x] Task 5: Unreadable-count InfoBox (AC: #4)
  - [x] Render `packages/ui`'s `InfoBox` (Story 1.5) with the unreadable count, phrased plainly (e.g. *"42 unreadable — excluded from the numbers below."*) whenever `useUnreadableCount() > 0`
  - [x] Render nothing when the count is 0 — never show "0 unreadable"
- [x] Task 6: All-unreadable empty state (AC: #5)
  - [x] When `useReadablePhotos()` is empty but the Ingested set is non-empty (i.e. every photo is unreadable), render a distinct empty-of-data layout — the unreadable count is the prominent message here, not a secondary `InfoBox` note, and this is **not an error state** (no `ErrorMessage`, no error styling) — it's valid information about the user's actual photo set
- [x] Task 7: Verify (AC: #1–#5)
  - [x] Ingest a mixed batch (some readable, some not) — confirm all 7 dimensions render, sorted descending, with correct per-field denominators, and the unreadable `InfoBox` shows the right count
  - [x] Ingest an all-readable batch — confirm the `InfoBox` is entirely absent
  - [x] Ingest an all-unreadable batch — confirm the distinct empty-of-data layout renders instead of 7 empty histogram panels

### Review Findings

- [x] [Review][Patch] Empty-row dimension panels render caption-only, no "no data" indication [apps/gallery/src/features/insights/Insights.tsx] — resolved: user chose to show an explicit "No data for this batch." placeholder inside the `Panel` when `dimension.rows.length === 0`, instead of hiding the panel or leaving it blank. Applied and re-verified live (Playwright, a fixture missing the `LensModel` EXIF tag reproduces the empty `// FRONT / REAR` dimension, which now renders the placeholder text).
- [x] [Review][Defer] Per-row percentages can fail to sum to 100% within a dimension [apps/gallery/src/features/insights/aggregations.ts] — deferred, cosmetic rounding artifact from independent per-row `Math.round`; no AC requires rows to sum to 100%
- [x] [Review][Defer] No validation for malformed/negative/zero ISO, shutter-speed, or hour values in the bucketing functions [apps/gallery/src/features/insights/aggregations.ts] — deferred, low-probability data-quality gap; upstream producers (`normalize.ts`/`exif-worker.ts`) already guarantee well-formed values in practice
- [x] [Review][Defer] `ingestStore`'s new `complete` flag is a separately-mutated boolean rather than state derived from `photos`/`fileCount` [apps/gallery/src/store/ingestStore.ts] — deferred, safe today (only two mutators, both correctly paired), worth revisiting if more write paths are added later
- [x] [Review][Defer] If Ingest never reaches "complete" (e.g. an uncaught worker exception), the user is stuck on the progress screen with no escape [apps/gallery/src/app-shell/App.tsx] — deferred, restates the already-known missing `worker.onerror` gap carried over unaddressed from Stories 2.2/2.3, not new to this story
- [x] [Review][Defer] `HeaderBar` wordmark letter-spacing doesn't match the mockup's `-0.02em` (renders with `text-h3`'s `0`) [packages/ui/src/HeaderBar/HeaderBar.tsx] — deferred, low-severity pixel-fidelity nit per Acceptance Auditor

## Project Structure Notes

```text
packages/ui/src/HeaderBar/         # new — gap-fill, shared with Story 4.1
apps/gallery/src/
  features/insights/
    HistogramBar.tsx                # new — Gallery-local (single consumer)
    aggregations.ts                  # new — the 7-dimension bucketing logic
  app-shell/                        # updated: 3-way gate (empty/progress/insights)
```

### References

- [Source: planning-artifacts/epics.md#Story 2.4] — acceptance criteria origin
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — histogram-bar] — visual spec, exact FR-7 dimension list including "hour-of-day" naming
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-3] — `insights/` selector-only import boundary
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4] — per-field percentage denominator rule
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#FR-7, #UJ-1] — dimension list, "most-used focal length: 24mm (58%)" sort-order precedent
- [Source: planning-artifacts/epics.md#Story 4.1] — Header-bar "reused from packages/ui" (confirms shared placement)
- [Source: ux-designs/ux-BMAD/mockups/gallery-insights.html] — real reference markup/CSS: wordmark two-part text, borderless `.hist-panel`, exact ISO/hour-of-day bucket boundaries, unreadable-count copy pattern
- [Source: ux-designs/ux-BMAD/mockups/gallery-browse.html, landing-hero.html] — cross-check confirming the wordmark differs per app (Gallery: "EXIF GALLERY"; Landing: "LAZY CAM")

## Dev Agent Record

### Agent Model Used

claude-sonnet-5

### Debug Log References

None — no failures requiring debug-log capture. One test authored incorrectly (lexicographic `.sort()` misapplied to the shutter-speed assertion) was caught and fixed by `turbo test` on first run; no application code was at fault.

### Completion Notes List

- Built `Header-bar` and `Panel` as new shared `packages/ui` components (both gap-fills per Dev Notes — neither existed from Epic 1). `Header-bar` renders the wordmark as two props (`wordmark`/`wordmarkAccent`) plus an `actions` slot (unused by this story, reserved for Story 2.5); `Panel` defaults `bordered={false}` per the real Insights mockup's borderless `.hist-panel`.
- Built `HistogramBar` Gallery-local (`features/insights/`) extending `StatBar`'s filled/dotted cell language with a right-aligned `count · pct%` readout; kept the mockup's fixed 72px label column via an explicit `gridTemplateColumns` inline style (same pattern `StatBar` already uses).
- Aggregation logic (`aggregations.ts`) implements exactly the 7 FR-7 dimensions in AC #2's fixed order (focal length/lens, ISO, shutter, aperture, megapixel mix, front/rear, hour-of-day), each with its own per-field denominator (AD-4) and rows sorted descending by count. ISO and hour-of-day buckets use the mockup's exact boundaries; shutter speed uses the story's flagged `[ASSUMPTION]` standard-stop scheme (no mockup covers it).
- Added a `complete` flag + `useIsIngestComplete()` selector to `ingestStore.ts` — `fileCount` alone (set at Ingest start) couldn't distinguish "still parsing" from "parsing complete," which app-shell's new 3-way gate needs.
- `app-shell/App.tsx` now gates empty-state → progress → header+Insights in that order, matching Dev Notes' 3-state model.
- `Insights.tsx` reads only `useReadablePhotos()`/`useUnreadableCount()` (AD-3), so it recomputes automatically on any store change (AC #3) with no manual trigger. The all-unreadable branch (AC #5) renders plain informative text — no `ErrorMessage`, no error styling.
- Verified live: `turbo lint`, `turbo build`, `turbo test` (25/25 Vitest tests passing, 12 new for `aggregations.ts`) all pass. Additionally ran the actual app in a Playwright-driven Chromium against 5 synthetic EXIF fixture JPEGs (generated via Python/piexif in the session scratchpad, not committed) covering: a mixed batch (4 readable + 1 unreadable — confirmed all 7 dimensions render with correct sorted buckets/percentages and the unreadable InfoBox reads "1 unreadable — excluded from the numbers below."), an all-readable batch (confirmed the InfoBox is entirely absent), and an all-unreadable batch (confirmed the distinct empty-of-data layout, no error chrome). No console errors in any run.
- Minor cosmetic note (not a defect against any AC): the fixed 72px label column truncates the longest shutter-speed bucket label ("1/15s or slower") with an ellipsis at typical viewport widths; the full label is still available via the row's `aria-label`.

### File List

- packages/ui/src/HeaderBar/HeaderBar.tsx (new)
- packages/ui/src/HeaderBar/HeaderBar.stories.tsx (new)
- packages/ui/src/Panel/Panel.tsx (new)
- packages/ui/src/Panel/Panel.stories.tsx (new)
- packages/ui/src/index.ts (modified — export HeaderBar, Panel)
- apps/gallery/src/store/ingestStore.ts (modified — `complete` flag + `useIsIngestComplete()`)
- apps/gallery/src/app-shell/App.tsx (modified — 3-way gate: empty-state / progress / header+Insights)
- apps/gallery/src/features/insights/aggregations.ts (new)
- apps/gallery/src/features/insights/aggregations.test.ts (new)
- apps/gallery/src/features/insights/HistogramBar.tsx (new)
- apps/gallery/src/features/insights/Insights.tsx (new)
- apps/gallery/src/features/insights/.gitkeep (deleted — folder no longer empty)

## Change Log

- 2026-07-07 — Implemented Story 2.4: new `Header-bar`/`Panel` shared components (`packages/ui`), Gallery-local `HistogramBar` + `aggregations.ts` (the 7 FR-7 dimensions, each with its own per-field percentage denominator per AD-4), `Insights.tsx` composition (unreadable-count `InfoBox`, distinct all-unreadable empty state), `ingestStore.ts` gained a `complete` flag/`useIsIngestComplete()` selector, and `App.tsx`'s gate is now 3-way (empty-state / progress / header+Insights). `turbo lint`/`build`/`test` all pass (25 Vitest tests, 12 new); verified live via Playwright against synthetic EXIF fixtures covering mixed/all-readable/all-unreadable batches.
- 2026-07-08 — Addressed code review findings: 3-layer adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 1 patch applied (empty-row dimension panels now show a "No data for this batch." placeholder instead of an empty card, per user decision on the one decision-needed finding), 5 deferred (rounding-doesn't-sum-to-100% cosmetic artifact, no validation for malformed/negative bucketing inputs, `ingestStore`'s `complete` flag not derived, restated pre-existing missing-`worker.onerror` gap from Stories 2.2/2.3, minor wordmark letter-spacing fidelity nit), 10 dismissed as noise (disproven premises — e.g. speculative-API claims against props the spec explicitly mandates, a camera-facing "bug" that's actually exhaustive given the 2-value union type — or process commentary, not code defects). `turbo lint`/`build`/`test` re-verified clean after the patch; re-verified live via Playwright with a fixture missing the `LensModel` EXIF tag.
