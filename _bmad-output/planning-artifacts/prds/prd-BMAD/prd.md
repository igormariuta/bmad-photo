---
title: "Monorepo Product Suite — EXIF Gallery, Camera-App Landing & Shared Brutalist-Mono Design System"
status: final
created: 2026-07-02
updated: 2026-07-03
---

# PRD: Monorepo Product Suite — EXIF Gallery, Landing & Design System
*Working title — confirm.*

## 0. Document Purpose

This PRD is for the builder (Igor) acting as PM, and for the downstream BMAD workflows (architecture, UX, epics/stories) that consume it. It defines the **buildable scope of this monorepo**: a client-side **EXIF Gallery** (the primary product), a static **Landing** page that markets the native iOS camera app **Lazy Cam**, and the shared **Brutalist-mono Design System** both apps consume. It builds on the product brief at `_bmad-output/planning-artifacts/briefs/brief-BMAD/` — that brief and its addendum carry the product vision and the brainstorm's technical spine; this PRD does not duplicate them. **Lazy Cam** is deliberately **out of build scope** here: it is the narrative the Landing sells, not a deliverable in this repo (and, in this phase, not a source of preset Metadata for the Gallery either). Vocabulary is Glossary-anchored (§3); features are grouped by product with globally numbered FRs; inferred decisions are tagged `[ASSUMPTION]` inline and indexed in §9.

## 1. Vision

A small, coherent **product suite about clean, honest iPhone photography**, built as one monorepo on one design system. The centerpiece a user can actually run is the **EXIF Gallery**: drop in your photos, and it reads their metadata entirely in the browser — nothing uploaded, nothing stored — to show you *how you actually shoot*. Not just a sorter: an insight surface that tells you your most-used focal lengths, your ISO and shutter habits, when in the day you shoot. That personal-shooting-habits report is the hook that makes a pure-metadata tool worth opening.

Alongside it, a **Landing** page tells the story of the companion iOS camera app, **Lazy Cam** — for people who find the stock iPhone look harsh and over-processed, and want to *escape* it: creative control on a clean base rather than fighting Apple's forced HDR. Its durable point is the **preset system**: killing forced HDR is the entry wedge, but even if iOS ever lets you disable HDR natively, presets remain the reason to stay — real creative tooling on honest pixels. Both surfaces are built from a single **Brutalist-mono Design System**, so the suite reads as one thing with zero UI drift.

The real purpose is a **pet project to exercise the BMAD method end-to-end** on something real enough to be interesting, while sharpening monorepo and design-system tooling. There is no monetization and no launch deadline. Success is the loop completing and the Gallery telling the builder something true about their own photography they didn't already know.

## 2. Target User

### 2.1 Jobs To Be Done

- **As the builder (user zero):** run the full BMAD planning→build loop on a real product suite, and sharpen my monorepo / design-system craft. *(This is a craft/learning project; I am the first and primary user.)*
- **Understand my own shooting habits:** turn a folder of photos into a legible picture of *how* I shoot — which focal lengths, what ISO/shutter ranges, what time of day — without any tool touching or uploading my files.
- **Filter and explore my own library** by the facets that matter to a photographer (lens/focal length, ISO, aperture, shutter, exposure compensation, date, megapixel mode, selfie vs rear) to find or group shots.
- **(Secondary persona) A photographer** who rejects the stock iPhone look learns, from the Landing, that a camera app exists that kills forced HDR and gives them presets on a clean base.

### 2.2 Non-Users (v1)

- People wanting **photo backup, storage, or cloud sync** — this suite explicitly does not do that.
- People wanting **live iOS photo-library sync** — rejected; would demand a separate native app.
- Anyone who needs to **buy or download the camera app today** — it is not shipping in this scope; the Landing is story-only.

### 2.3 Key User Journeys

- **UJ-1. Igor learns how he actually shoots.**
  - **Persona + context:** the builder, user zero, on his iPhone, with a few months of photos in his camera roll.
  - **Entry state:** unauthenticated (there are no accounts); opens the Gallery web app in mobile Safari.
  - **Path:** taps *Add photos* → picks a batch from the phone's photo picker → the app parses EXIF in-browser (a progress indicator shows it working, nothing uploads) → lands on the Insights dashboard.
  - **Climax:** he sees "most-used focal length: 24mm (58%)", an ISO distribution skewed low, and a time-of-day chart peaking at golden hour — a picture of his habits he'd never quantified. This is the moment the tool proves its worth (validates SM-3).
  - **Resolution:** he switches to Filter, narrows to a specific lens + date range to pull up one evening's shots. Nothing is saved server-side; closing the tab clears the session.
  - **Edge case:** a photo whose EXIF was stripped on export (e.g. via a share sheet) shows up in an "unreadable metadata" count rather than corrupting the insights.

- **UJ-2. Maya reads the camera-app story.**
  - **Persona + context:** Maya, an iPhone shooter who finds her stock photos harsh and over-processed, follows a link to the Landing.
  - **Entry state:** first visit, any device, no account.
  - **Path:** hero states the promise (clean, honest pixels) → she scrolls the three value pillars (kill forced HDR, strip native processing, own preset system) → sees what presets can do (tone curves, color mixer).
  - **Climax:** she understands the app's point in under a minute and recognizes her own frustration in it.
  - **Resolution:** the page ends on a "coming soon" note. There is no signup or purchase in v1 — she leaves informed, not converted. *(Realizes the Landing's story-only role; see FR-10.)*

## 3. Glossary

*Downstream workflows and readers must use these terms exactly.*

- **Monorepo** — the single repository holding all buildable products and shared packages (pnpm + Turborepo).
- **Suite** — the collection of products: Gallery, Landing, Design System (buildable here), and Lazy Cam (narrative only).
- **EXIF Gallery** (**Gallery**) — the client-side web SPA that ingests photos, parses their metadata, and presents Insights and Facet-based filtering. The **primary buildable product**.
- **Landing** — the static marketing page that tells Lazy Cam's story.
- **Design System** — the shared Brutalist-mono component library and design tokens consumed by Gallery and Landing.
- **Lazy Cam** — the native iOS photography app that gives the suite its story. **Out of this monorepo's build scope**; not built in this BMAD exercise.
- **Metadata** — EXIF/XMP fields embedded in a photo file. Fields the Gallery relies on: focal length, lens, ISO, aperture, shutter speed, exposure compensation, capture time, megapixel mode (12/48 MP), and front/rear camera. GPS is *not* written by Lazy Cam and is not used.
- **Insight** — a derived, aggregate view of shooting habits computed from Metadata across an ingested set (e.g. focal-length distribution).
- **Facet** — a Metadata dimension a user can filter by: lens/focal length, date, ISO, aperture, shutter speed, exposure compensation, megapixel mode (12/48 MP), and front/rear camera.
- **Preset** — a named creative recipe (tone curves, color mixer) applied by Lazy Cam. **Out of scope for this suite:** Lazy Cam does not write preset names to Metadata in this phase, so the Gallery cannot and does not surface presets.
- **Clean base** — honest pixels with native iPhone processing (forced HDR, over-sharpening) minimized, on which Presets act. A Lazy Cam concept, referenced only in the Landing narrative.
- **Ingest** — the act of a user manually selecting photos into the Gallery for in-browser parsing. No upload, no library sync.
- **Client-side only** — all processing happens in the browser; no photo or Metadata ever leaves the user's device; there is no backend.
- **Design token** — a named design primitive (color, spacing, type, radius) that is the single source of visual truth; components consume tokens, never arbitrary values.

## 4. Features

*Grouped by product. FRs numbered globally (FR-N) for stable downstream reference.*

### 4.1 Shared Design System (Brutalist-mono)

**Description:** A single UI system, expressed as Design tokens and a shared component library, consumed by both Gallery and Landing so the suite has **no UI drift**. Brutalist-mono aesthetic (see §11). Components are developed in isolation via Storybook; token usage is enforced by lint so no app can hand-roll arbitrary style values. Sharing is workspace-internal only — no package publishing at this stage. Realizes the "one UI system" success criterion.

**Functional Requirements:**

#### FR-1: Single-source Design tokens
The Design System defines all color, spacing, typography, and radius primitives as Design tokens in a shared package.
**Consequences (testable):**
- Gallery and Landing both render their visual primitives from the same token package; changing a token value changes both apps.
- No app defines a competing/parallel token set.

#### FR-2: Shared component library
Reusable UI components live in a shared package consumed by both apps via the workspace.
**Consequences (testable):**
- A component used by both apps is imported from the shared package, not copy-pasted per app.
- Lib membership is a pure reuse decision: a component used by only one app may live in that app until a second consumer appears. `[ASSUMPTION: single-consumer components need not pre-emptively live in the shared lib.]`

#### FR-3: Storybook-driven component development
Each shared component is developed and demonstrated in Storybook.
**Consequences (testable):**
- Every component in the shared library has at least one Storybook story rendering its primary states.

#### FR-4: Token-usage enforcement
A `no-arbitrary-value` lint rule prevents hardcoded style values in place of Design tokens.
**Consequences (testable):**
- Introducing an arbitrary color/spacing value where a token exists fails lint in CI.

### 4.2 EXIF Gallery *(primary product)*

**Description:** A mobile-first, Client-side-only web SPA (Vite + React). The user Ingests a batch of photos; the app parses their Metadata entirely in-browser and presents two things: an **Insights** dashboard of shooting habits, and **Facet**-based filtering to explore the set. Photos and Metadata never leave the device; there is no account, no backend, and no persistence beyond the session. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Manual photo Ingest (client-side)
A user can Ingest photos by selecting them from their device. Mobile-first: primary path is the phone photo picker; selecting from a computer is also supported. Realizes UJ-1.
**Consequences (testable):**
- Selected files are read in-browser; no network request carries photo bytes or Metadata off-device (verifiable in network inspector).
- Multiple photos can be selected in one Ingest action.
**Out of Scope:**
- Library sync, folder watching, drag-from-cloud, and any account-based import.

#### FR-6: In-browser Metadata extraction
The Gallery parses EXIF/XMP from each Ingested photo in the browser.
**Consequences (testable):**
- For a photo with standard EXIF, the app extracts at minimum: focal length, lens, ISO, aperture (f-stop), shutter speed, exposure compensation, capture timestamp, megapixel mode (12 vs 48 MP), and front/rear camera. `[NOTE FOR PM] These are the fields confirmed to survive common export paths from Lazy Cam. GPS/location is NOT written by Lazy Cam and is not relied on.]`
- Megapixel mode is derived from resolution or the relevant EXIF field; front/rear is derived from the EXIF camera/lens field.
- A photo with missing/stripped Metadata is counted as "unreadable" and excluded from Insights math rather than crashing the parse. Realizes UJ-1 edge case.

#### FR-7: Insights dashboard
The Gallery presents aggregate Insights across the Ingested set.
**Consequences (testable):**
- Displays, at minimum: most-used focal length / lens with share, ISO distribution, shutter-speed distribution, aperture distribution, megapixel mix (12 vs 48 MP), selfie-vs-rear ratio, and a time-of-day pattern.
- Insights recompute when the Ingested set changes.
- Percentages are computed only over photos with readable values for that field.

#### FR-8: Faceted filtering
A user can filter the Ingested set by Facet.
**Consequences (testable):**
- Filterable Facets: lens / focal length, date / date-range, ISO, aperture, shutter speed, exposure compensation, megapixel mode (12 / 48 MP), and front/rear camera (selfies).
- Filters combine (AND) and the visible set + Insights reflect the active filter. `[ASSUMPTION: filters narrow both the photo list and the Insights view.]`

#### FR-9: ~~Privacy-first location handling~~ (withdrawn 2026-07-03)
Withdrawn: Lazy Cam writes no GPS, so location is neither a Facet nor an Insight in this suite. The client-side privacy stance is preserved as a cross-cutting NFR (§10). Megapixel and front/rear capabilities fold into FR-6 and FR-8. *Tombstoned to keep FR-10 / FR-11 stable.*

**Feature-specific NFRs:**
- Ingest is capped at **100 photos per batch** in v1; parsing that batch completes without freezing the UI (parse off the main thread or chunked) and shows a progress state.

**Notes:**
- `[NOTE FOR PM]` The **Preset Facet is out of scope for this pet project entirely** — it depends on Lazy Cam writing a preset name into Metadata, and that write step is not being built. It belongs to future Lazy Cam phases, not this suite; no Metadata contract is committed here.

### 4.3 Landing

**Description:** A static (Astro SSG) marketing page that tells Lazy Cam's story — the three value pillars and what Presets do — built on the shared Design System. **Purely informational in v1:** no email capture, no waitlist, no App Store link, no backend. Realizes UJ-2.

**Functional Requirements:**

#### FR-10: Story-only marketing page
The Landing presents Lazy Cam's promise and value pillars as static content.
**Consequences (testable):**
- Page renders the three pillars (kill forced HDR; strip native processing / over-sharpening; own preset system on a Clean base) and frames presets as the **durable moat** — the reason to stay even if iOS later lets you disable HDR natively.
- Preset explanation names concrete creative tools: shadow/highlight tone curves and a Lightroom-style per-color mixer (mute/boost + hue shift, e.g. yellow→orange or →green).
- No form, email field, waitlist, purchase, or App Store link is present in v1; any call-to-action is a passive "coming soon". Realizes UJ-2 resolution.

#### FR-11: Built on the shared Design System, responsive
The Landing consumes the shared Design System and renders responsively.
**Consequences (testable):**
- Landing visual primitives come from the shared token package (ties to FR-1).
- Page is legible and correctly laid out on mobile and desktop widths.

## 5. Non-Goals (Explicit)

- **Not** a photo backup, storage, or file-store product.
- **Not** an iOS photo-library sync tool — rejected as too painful and requiring a separate native app.
- **Not** building Lazy Cam in this monorepo/BMAD exercise — it is narrative only (and not even a metadata source in this phase).
- **Not** a backend-having product — the whole suite is static hosting + client-side compute. No accounts, no server, no database.
- **Not** monetized — no pricing, ads, or paywall in scope.
- **Not** filtering or grouping by location/GPS — Lazy Cam writes no GPS; location is not part of this suite.
- **Not** surfacing Presets in the Gallery, and **not** building the preset-in-Metadata camera↔gallery bridge — both belong to future Lazy Cam phases.
- **Not** shipping Gallery export / saved views in v1 (deferred).

## 6. MVP Scope

### 6.1 In Scope
- Shared Design System: tokens, shared component library, Storybook, `no-arbitrary-value` lint (FR-1–FR-4).
- EXIF Gallery: client-side Ingest (≤100 photos/batch), in-browser Metadata extraction, Insights dashboard, Facet filtering incl. megapixel mode & front/rear (FR-5–FR-8); mobile-first.
- Landing: story-only static page on the shared Design System (FR-10–FR-11).
- Monorepo foundations: pnpm + Turborepo; `apps/{landing, gallery}` + `packages/{theme, ui, eslint-config, tsconfig}`.

### 6.2 Out of Scope for MVP
- **Preset Facet + camera↔gallery Metadata bridge** — out of scope for this pet project; Lazy Cam does not write preset names in this phase. `[NOTE FOR PM] emotionally load-bearing — the elegant bridge; revisit in a future Lazy Cam phase.`
- **Gallery export / saved views / contact sheet** — deferred to post-v1.
- **Location / GPS filtering** — Lazy Cam writes no GPS; not part of this suite.
- **Landing email/waitlist capture** — deferred until there's an app to convert toward.
- **Lazy Cam** — separate native track, not built here.
- **Package publishing** — workspace-internal sharing only at this stage.

## 7. Success Metrics

*Pet-project scale — deliberately lightweight.*

**Primary**
- **SM-1**: **BMAD loop completed end-to-end** — the planning→build loop runs through on this suite (the real win). Validates the exercise as a whole.
- **SM-2**: **One UI system, no drift** — Gallery and Landing ship from the shared Design System; a token change propagates to both. Validates FR-1, FR-2, FR-11.
- **SM-3**: **At least one genuinely useful Insight** — the Gallery tells the builder something true about his shooting habits he didn't already know. Validates FR-6, FR-7.

**Secondary**
- **SM-4**: **The builder keeps using the Gallery** — opens it again on a new batch of photos, unprompted, after the first session. Validates FR-5, FR-8.

**Counter-metrics (do not optimize)**
- **SM-C1**: **Design-system surface area** — do *not* grow the component library beyond what Gallery + Landing actually consume. Counterbalances SM-2 (avoid gold-plating the design system as busywork).
- **SM-C2**: **Zero backend creep** — do *not* introduce a server/account/persistence to "improve" the Gallery. Counterbalances SM-3/SM-4 (the privacy + zero-friction stance is the point).

## 8. Open Questions

*Most prior questions were resolved in the 2026-07-03 update (see Resolved below).*

1. **Preset community-sharing (Fujifilm-recipe style)** — out of scope for this suite; a future Lazy Cam feature. Revisit if/when the app matures. (Camera track.)

**Resolved (2026-07-03):**
- **Reliable EXIF fields confirmed:** ISO, lens, exposure compensation, aperture, shutter speed, date, megapixel mode (12/48 MP), and front/rear camera. GPS is *not* written by Lazy Cam → no location Facet.
- **Ingest batch ceiling** set to 100 photos/batch for v1.
- **Preset-in-Metadata write** dropped for this project — belongs to a future Lazy Cam phase, so the camera↔gallery bridge is not built here.

## 9. Assumptions Index

- §4.1 FR-2 — single-consumer components need not pre-emptively live in the shared lib; lib membership is a pure reuse decision.
- §4.2 FR-8 — filters narrow both the photo list and the Insights view (AND-combined).
- §2.3 UJ-1 — Gallery runs with no accounts/auth; session state clears on tab close (no persistence).

## 10. Cross-Cutting NFRs

- **Privacy (load-bearing):** Client-side-only is a hard invariant. No photo bytes or Metadata leave the device; no analytics that capture image content. Verifiable via network inspection showing zero photo/Metadata egress.
- **Performance:** Gallery Ingest + parse must not freeze the UI on a realistic batch; show progress and keep the main thread responsive.
- **Consistency:** One UI system enforced by Design tokens + `no-arbitrary-value` lint; visual drift between apps is a defect, not a preference.
- **Accessibility:** Baseline — legible contrast within the Brutalist-mono palette, keyboard-operable controls, semantic markup. `[ASSUMPTION: pet-project baseline, not a formal WCAG AA commitment.]`
- **Browser support:** Modern evergreen browsers, mobile Safari included (mobile-first). `[ASSUMPTION]`

## 11. Aesthetic & Tone

- **Aesthetic:** **Brutalist-mono** — monospaced type, high-contrast, structural/raw layout, minimal ornament; the visual identity that unifies the suite.
- **Anti-references:** soft, rounded, gradient-heavy "friendly SaaS" look; anything that reads as generic template.
- **Voice/tone (Landing copy & any product text):** honest, direct, a little opinionated — it names the frustration plainly (the stock look is harsh, over-processed; this is how you escape it) rather than selling softly. Matches the "clean, honest pixels" thesis. No marketing fluff; state the promise plainly. `[ASSUMPTION: derived from the product thesis; confirm.]`

## 12. Platform

- **Gallery:** Vite + React SPA, **mobile-first**, responsive up to desktop; client-side only; builds to static output (no deployment target for this test project).
- **Landing:** Astro SSG static site; responsive.
- **Shared:** Both consume the Design System; monorepo via pnpm + Turborepo. No native surfaces in build scope (Lazy Cam is out of scope).
