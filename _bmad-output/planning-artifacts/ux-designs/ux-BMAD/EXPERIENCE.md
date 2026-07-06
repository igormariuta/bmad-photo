---
name: Monorepo Product Suite — EXIF Gallery, Landing
status: final
sources:
  - "{planning_artifacts}/prds/prd-BMAD/prd.md"
  - "{planning_artifacts}/briefs/brief-BMAD/brief.md"
updated: 2026-07-06
---

# Monorepo Product Suite — Experience Spine

> Two independently-deployed surfaces on one shared Brutalist-mono system (see `DESIGN.md`): the **EXIF Gallery** (client-side SPA, mobile-first) and the **Landing** page (static, responsive). No accounts, no backend, no cross-app state — the only thing they share is the design system.

## Foundation

- **Gallery** — Vite + React SPA, mobile-first, responsive up to desktop, client-side only (no server calls carry photo bytes or Metadata). No authentication, no accounts; state lives only in the browser tab for the session and clears on close.
- **Landing** — Astro SSG static site, responsive. Purely informational; no forms, no JS-dependent interactivity beyond the shared theme toggle.
- **Shared** — Both consume the Design System package (`packages/theme`, `packages/ui`); `DESIGN.md` is the visual identity reference, this file specifies only the behavioral delta. `no-arbitrary-value` lint (FR-4) enforces token-only styling in both apps.

## Information Architecture

### EXIF Gallery

| Surface | Reached from | Purpose |
|---|---|---|
| Empty state | App open, no photos Ingested | Privacy promise + single "Add photos" CTA |
| Ingest (in progress) | Add photos → picker closes | Determinate parse progress ("Parsing N/100") |
| Insights | Default tab after first successful Ingest | Pure aggregate statistics over the **entire** readable set — no filter controls live here |
| Browse | UnderlineTabs → Browse | Photo grid, filterable by Facet; each cell shows an EXIF badge |
| Photo detail | Tap a grid cell | Full Metadata for one photo, in a Modal |
| Facet panel | Browse tab only — filter icon (mobile) / always-visible sidebar (desktop) | Facet controls; narrows the Browse grid only |

Insights and Browse do **not** share a filtered set: Insights always reflects the full readable set (the "how do I shoot, generally" picture); Browse is the exploratory surface where Facet filters actually narrow what's visible. `[DECISION — revises PRD §9's assumption that "filters narrow both the photo list and the Insights view"; per user direction, Insights is statistics-only and carries no filter UI.]` Switching tabs never resets Browse's active filters. Modal (photo detail) is the only overlay in the Gallery; it stacks at most one level deep.

→ Composition reference: `mockups/gallery-empty-state.html` (first-run), `mockups/gallery-insights.html` (populated, pure statistics, no Facet-panel), `mockups/gallery-browse.html` (Facet-filtered grid, EXIF-badge captions). Spine wins on conflict.

### Landing

| Surface | Reached from | Purpose |
|---|---|---|
| Hero | Page load | States the promise: clean, honest pixels |
| Three pillars | Scroll | Kill forced HDR · strip native processing · own preset system |
| Preset showcase | Scroll | Static before/after imagery — tone curves, color mixer |
| Coming soon | Scroll (footer) | Passive close; no form, no CTA that implies availability |

Single scroll page, no client-side routing. Both surfaces share the minimal header (wordmark + theme toggle) defined in `DESIGN.md.components.header-bar`.

→ Composition reference: `mockups/landing-hero.html` (header + hero + first pillar). Spine wins on conflict.

## Voice and Tone

Brand voice lives in `DESIGN.md.Brand & Style`. Microcopy rules specific to this suite:

| Do | Don't |
|---|---|
| "Nothing uploads. Nothing's stored." | "Your privacy is our priority! 🔒" |
| "42 unreadable — excluded from the numbers below." | "42 photos couldn't be processed." (hides *why* they're excluded) |
| "The stock look is harsh. This is how you escape it." | "Tired of boring photos? We've got you covered!" |
| "Coming soon." (Landing footer, no more) | Any CTA implying signup, waitlist, or purchase exists |
| Numbers state plainly: "24mm — 58%" | Editorializing a stat ("Wow, you really love 24mm!") |

## Component Patterns

Behavioral; visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Empty-state | Gallery, first load | Only screen with no header/tabs/panel chrome. Single Button opens the native photo picker. |
| Ingest-progress (StatBar) | During parse | Determinate "Parsing N/100"; UI thread stays responsive (parse off main thread or chunked per NFR §10). Cannot be dismissed early — Ingest completes or nothing enters the set. |
| UnderlineTabs (Insights/Browse) | Gallery, post-Ingest | Switching tabs preserves scroll position and active Facet filters independently per tab. |
| Facet-panel | Browse tab only | Every control change re-filters the Browse grid immediately (no "Apply" button — filters are live). Active filter count shown on the panel's trigger (mobile). Clear-all resets to the full readable set. Has no presence on the Insights tab. |
| Range-control | Facet-panel — date, ISO, aperture, shutter, exposure comp | Two Fields (min/max or from/to) per row; either side may be left blank to mean "no lower/upper bound." Invalid range (min > max) shows FieldError on the offending side, doesn't apply until corrected. |
| Histogram-bar (Insights) | One per FR-7 Insights dimension (focal length/lens, ISO, shutter, aperture, mp-mode, selfie/rear, hour-of-day) | Always computed over the full readable set, never the Browse filter state. Percentages compute only over photos with a readable value for that field (FR-7) — a bucket for "unreadable" is never itself a histogram row; it's the separate count near the Insights header. Exposure comp never appears here (Facet-only, see Range-control). |
| Photo-grid-cell | Browse | Shows an EXIF badge (caption-style, Dot-separated: e.g. "24mm · f/1.8 · ISO 200") directly under the thumbnail — the at-a-glance read a filtered result needs. Tap opens Photo-detail-modal for the full field list. Long-press/hover has no special affordance (no bulk select in v1 — `[ASSUMPTION]`, not stated in PRD). |
| Photo-detail-modal | Browse → tap | Lists every extracted Metadata field as label/value rows (Spec pattern) — the badge's 3 fields plus the rest (shutter, exposure comp, timestamp, mp mode, front/rear). Closes via Esc/backdrop/X, same as every other Modal in the system. |
| Unreadable-count note (InfoBox) | Insights header | InfoBox reading "N unreadable — excluded"; visible whenever N > 0, absent when N = 0 (not "0 unreadable"). |
| Theme toggle | Header, both apps | Persists to `localStorage`; respects `prefers-color-scheme` on first visit; no flash-of-wrong-theme (inline blocking script, as in the inherited system). |
| Hero | Landing, top | Headline plays one GlitchText settle-in beat on load (~900ms, jitter + accent/error ghost, then static) — never loops. Eyebrow/body fade up shortly after. Single screen's worth of content, no "fold" gimmick. |
| Pillar-card | Landing, three-pillars section | Fades up once as each card enters the viewport, staggered ~90ms apart; doesn't re-trigger scrolling back up. Purely presentational otherwise — no click/expand interaction; all copy is visible without disclosure or motion. Equal visual weight across all three (no "featured" pillar). |
| Preset-comparison | Landing, preset-showcase section | Fades up once on scroll-in, same treatment as Pillar-card. Otherwise static image pair; no interaction. If an image fails to load, falls back to the ErrorMessage-style muted placeholder frame with alt text, never a broken-image icon. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| No photos yet | Gallery | Empty-state (full screen) |
| Ingesting | Gallery | Ingest-progress overlay/panel; picker already closed, main content not yet interactive |
| Ingest partially unreadable | Insights/Browse | Readable photos populate normally; unreadable count note appears; nothing crashes or blocks (FR-6) |
| All photos unreadable | Insights/Browse | Grid/Insights render empty-of-data, but the unreadable count is prominent — this is a real, informative outcome, not an error |
| Filtered set is empty | Browse only (Insights has no filter state to empty) | "No photos match these filters" message + a visible "Clear filters" action; distinct from the zero-photos empty-state |
| Batch exceeds 100 | Ingest | Resolved by ARCHITECTURE-SPINE.md AD-7: the cap is cumulative for the whole session (not per-batch); an Ingest action that would push the total over 100 is rejected with a message stating the limit, before any file is parsed. Re-added duplicate files (same name/size/modified time) are silently deduped, not double-counted. |
| Photo-picker permission denied | Gallery, Ingest | `[ASSUMPTION]` Ingest uses a plain `<input type="file">` (no persistent OS photo-library grant, unlike a native library API), so there is no "permission denied" state to design for — the browser's own file-picker UI handles cancellation. If a native picker API is used instead, this state needs a real treatment. |
| Landing, JS disabled/slow | Landing | Content is static SSG — page is fully legible with zero JS beyond the theme toggle |

## Interaction Primitives

- **Mobile-first touch:** Gallery's primary input is a tap; Facet-panel opens as a slide-up sheet on touch viewports, always-visible sidebar on desktop.
- **Photo picker:** native OS picker (mobile: phone photo library; desktop: file picker) — the same "Add photos" action in both the empty-state and a persistent header affordance once photos exist. Resolved by ARCHITECTURE-SPINE.md AD-7: this "Add more" action appends to the existing set (never replaces it), deduping by file identity.
- **Keyboard:** Modal is focus-trapped, Esc closes; Select/RadioGroup/Checkbox in the Facet panel are fully keyboard-operable (arrow keys, Space/Enter) per the inherited component contracts.
- **Motion (Landing):** CSS-only, no scroll library — the hero headline's settle-in and the pillar-cards'/preset-comparison's scroll-reveal fade-up are progressive enhancement. Content exists in the DOM and is fully readable whether or not the browser runs the animation; motion never gates or delays access to information.
- **Banned:** infinite scroll on the photo grid (a bounded ≤100-item set has no need for it), any control that mutates a photo file, any network call carrying photo bytes or Metadata, looping/re-triggering motion anywhere in the suite.

## Accessibility Floor

Baseline, not a formal WCAG AA commitment (`[ASSUMPTION]`, per PRD §10) — legible contrast within the ten-token palette, keyboard-operable controls, semantic markup. Contrast is a property of the ten-token palette itself (dark text on light `bg`, light text on dark `bg`, a single saturated `accent`); no numeric WCAG ratio has been separately verified against `DESIGN.md`'s colors, consistent with the PRD's explicit baseline-not-AA stance.

- Photo grid cells are `<button>`-semantic with an `aria-label` naming at least the capture date (there's no filename worth announcing).
- Ingest-progress announces via `aria-live="polite"` so screen-reader users get parse progress without focus loss.
- Facet-panel controls carry the same required-field / error conventions as the inherited Field/Select components (label + `role="alert"` FieldError).
- Photo-detail-modal reuses the inherited Modal's focus trap and `aria-labelledby` wiring verbatim.
- Landing has no forms or interactive controls beyond the theme toggle and standard links — semantic heading order (H1 hero → H3 pillars) is the main accessibility surface.
- All Landing motion (hero settle-in, scroll-reveal) respects `prefers-reduced-motion: reduce` — content renders in its final state instantly, same contract as the inherited GlitchText/MatrixText primitives.

## Responsive & Platform

| Breakpoint | Gallery | Landing |
|---|---|---|
| `< sm` (phone, primary) | 2-column photo grid; Facet-panel as slide-up sheet; single-column Insights histograms | Single-column, full-width sections |
| `sm`–`lg` | Grid columns scale with viewport; Facet-panel still a sheet | Same, wider gutters |
| `≥ lg` (desktop) | Facet-panel becomes a persistent sidebar inside the 1240px container; grid gains more columns | Content capped at 1240px container |

Gallery is mobile-first per PRD §12 (primary path: phone photo picker) but must remain fully usable at desktop widths (PRD explicitly supports selecting from a computer). Landing has no primary/secondary device distinction — it must read equally well on both.

## Privacy & Data Handling

*(Invented section — this NFR is load-bearing enough, per PRD §10, to warrant its own experience-level treatment rather than living only as a line-item.)*

- No screen, empty-state, or error copy ever implies data is saved, synced, or recoverable after the tab closes — because it isn't (no persistence, no accounts, by design).
- The empty-state's first line states the promise before asking for photos, so trust is established *before* the picker opens, not after.
- No analytics event may capture image content or per-photo Metadata values; aggregate, non-identifying usage counters only, if any (`[ASSUMPTION: PRD doesn't specify an analytics stance beyond "no analytics that capture image content" — reading that as permitting non-content analytics, not requiring zero analytics.]`).

## Key Flows

### UJ-1 — Igor learns how he actually shoots

*(Mirrors PRD §2.3 UJ-1 verbatim; the builder, user zero, on his iPhone, a few months of photos in his camera roll.)*

1. Igor opens the Gallery in mobile Safari — no account, straight to the empty-state: privacy promise, one "Add photos" button.
2. He taps it, the native photo picker opens, he selects a batch from his camera roll.
3. The picker closes; Ingest-progress shows "Parsing 38/62" against a filling block-bar — the UI stays responsive, he can watch it complete.
4. Parsing finishes; he lands on Insights by default.
5. **Climax:** he sees a histogram-bar row reading "24mm — 58%" at the top of the focal-length distribution, an ISO histogram skewed toward the low buckets, and an hour-of-day histogram peaking in the golden-hour buckets — a picture of his habits he'd never quantified, rendered in the same block-cell language as everything else in the system. This view never changes with filters — it's always the whole set.
6. **Resolution:** he switches to Browse via UnderlineTabs — a different surface now, with its own Facet panel — narrows to one lens + a one-week date range, and the grid narrows to exactly one evening's shots, each cell captioned with its own "24mm · f/1.8 · ISO 200"-style badge so he can scan the set without opening every photo. Insights, on the other tab, is unaffected by this filter. He closes the tab; nothing persisted.
7. **Edge case:** one photo, exported through a share-sheet that stripped its EXIF, never appears in the grid — instead it's counted in a visible "1 unreadable — excluded" note near the Insights header, so Igor knows it was seen, not silently dropped or crashing the parse.

### UJ-2 — Maya reads the camera-app story

*(Mirrors PRD §2.3 UJ-2 verbatim; an iPhone shooter who finds her stock photos harsh and over-processed, first visit, any device.)*

1. Maya follows a link to the Landing. Hero states the promise in one line: clean, honest pixels, no forced HDR.
2. She scrolls the three pillars — kill forced HDR, strip native processing, own preset system — each stated plainly, no marketing fluff.
3. She reaches the preset showcase: static before/after imagery showing a tone-curve adjustment and a per-color mixer shift (e.g. yellow → orange), framed as the *durable* reason to stay even if iOS ever lets you disable HDR natively.
4. **Climax:** she recognizes her own frustration with the stock look, articulated back to her in under a minute, with concrete tools named rather than vague promises.
5. **Resolution:** she reaches the "coming soon" footer — no form, no waitlist, no purchase link. She leaves informed, not converted; the page never implied otherwise.

Failure/degradation: if Maya's connection is slow or JS is disabled, the page (static SSG) is still fully legible top to bottom — see § State Patterns, "Landing, JS disabled/slow."
