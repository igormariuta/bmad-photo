# BMAD Monorepo Product Suite

A pet-project monorepo built to exercise the **BMAD method** end-to-end (planning → architecture → UX → epics/stories → development). It ships a small product suite around clean, honest iPhone photography, all sharing one Brutalist-mono design system:

- **`apps/gallery`** — EXIF Gallery (Vite + React SPA), the primary product. Reads photo metadata entirely in the browser and surfaces insights about shooting habits — no server, no upload of files anywhere.
- **`apps/landing`** — Landing (Astro SSG), a marketing story page for the companion native iOS camera app, **Lazy Cam** (out of scope for this repo — narrative only).
- **`packages/theme`**, **`packages/ui`** — the shared Brutalist-mono design tokens and component library consumed by both apps.
- **`packages/eslint-config`**, **`packages/tsconfig`** — shared tooling config.

## Getting started

```bash
pnpm install
pnpm dev     # turbo dev
pnpm lint    # turbo lint
pnpm test    # turbo test
pnpm build   # turbo build
```

## Planning & Process

The full planning trail (brief → PRD → UX design → architecture spine → epics/stories) lives under `_bmad-output/planning-artifacts/`, and the story-by-story implementation log lives under `_bmad-output/implementation-artifacts/`.

For a presentation-ready summary of what was decided before implementation started — scope, key decisions, and the epic/sprint breakdown — see below.

<details>
<summary><strong>BMAD Monorepo Product Suite — Plan &amp; Decisions Before Implementation</strong></summary>

*Presentation summary: the path from idea to development-ready epics.*

---

### 0. Context and Goal

A pet project built to **exercise the BMAD method end-to-end**: planning → architecture → UX → epics/stories → development. No monetization, no deadline — success is measured by completing the loop and ending up with a genuinely working product.

**What we're building — a monorepo with three parts:**

1. **EXIF Gallery** (Vite + React SPA) — the primary product. A client-side app: reads photo metadata entirely in the browser and shows insights about shooting habits. No server, no upload of files anywhere.
2. **Landing** (Astro SSG) — a marketing story page for a native iOS camera app called **Lazy Cam**.
3. **Design System** (Brutalist-mono) — a shared token and component library consumed by both products.

**Important:** Lazy Cam itself is **out of scope** for this repository. It's only the narrative the Landing sells — not something built or tested here.

---

### 1. The Document Trail

```
Brainstorm → Product Brief → PRD → UX Design (DESIGN.md + EXPERIENCE.md)
           → Architecture Spine → Epics & Stories → Readiness Check → Sprint Plan
```

Each subsequent document **explicitly** builds on the previous one rather than re-litigating it — any divergence was recorded as an explicit `[DECISION]`, never lost silently.

#### 1.1 Brainstorming → Product Brief

Starting point — the brand story: the iPhone forces HDR and over-sharpens photos; the camera app should "escape" that and offer presets on a clean base.

**What was rejected at this stage already:**
- Photo backup/storage and cloud sync — a separate product with its own complexity.
- Live sync with the iOS photo library — would require a separate native app.

**Three value pillars of the camera** (drive the Landing):
1. Kill forced HDR.
2. Strip native processing as far as possible (over-sharpening).
3. Own preset system on a clean base — the durable "moat," even if Apple ever lets you disable HDR natively.

#### 1.2 PRD — Product Requirements

Key decisions locked in here:

- **Client-side-only is a hard invariant.** Not a single byte of photo or metadata leaves the device. This is a load-bearing NFR, not just a feature.
- **Insights, not just sorting.** The goal is to show real shooting habits (focal lengths, ISO, shutter speed, time of day), not just a file list.
- **GPS/location dropped entirely** (FR-9 formally withdrawn 2026-07-03): the camera writes no GPS metadata → nothing to filter by location.
- **Presets in the Gallery — not built.** The bridge "camera writes preset name into EXIF → gallery surfaces it" is an elegant idea, but deliberately deferred (the camera itself is out of scope, so there's nothing to write the metadata).
- **Ingest cap — 100 photos per session**, cumulative, not per add-action.
- A precise glossary (Ingest, Facet, Insight, Metadata, etc.) was locked so every downstream document speaks the same language.

**Explicit non-goals:** photo backup/storage, iOS library sync, Lazy Cam itself in this repo, a server/accounts/database, monetization, location filtering, the Preset Facet and camera↔gallery bridge, Gallery export/saved views.

#### 1.3 UX Design (DESIGN.md + EXPERIENCE.md)

One important **decision that revised the PRD**: it originally assumed that Browse filters would narrow both the photo list and Insights. UX design explicitly **overturned this** — Insights always reflects statistics over the entire ingested set, while Browse filters only affect the photo grid. Captured as an explicit `[DECISION — revises PRD assumption]`, not a silent contradiction — and consistently reinforced afterward in the architecture and epics.

This is also where the **Brutalist-mono** aesthetic was defined (monospace type, high contrast, minimal ornament, `radius = 0`) along with the voice/tone — plain, non-marketing language with no exclamation-point energy ("Nothing uploads. Nothing's stored.").

#### 1.4 Architecture Spine

The technical spine, with eight architectural decisions (AD-1…AD-8). The most presentation-worthy:

- **One-way package dependency** `apps/* → packages/ui → packages/theme` — no component duplication, boundary enforced in CI.
- **All EXIF parsing runs through a single Web Worker**, off the main thread; a fixed message contract of `progress / error / complete`.
- **Insights and Browse read data through separate, isolated selectors** over one Zustand store — the boundary is enforced by an ESLint rule in CI, not just a convention between developers.
- Chose **ExifReader** over `exifr` — because `exifr` hasn't been updated since 2021 and handles HEIC from newer iPhones worse.
- **Repeat Ingest** ("Add more") appends to the session rather than replacing it; the 100-photo cap is cumulative per session; duplicates by (file name, size, last-modified) are silently skipped.
- The stack was pinned to exact versions (React 19.2.7, Vite 8.1.3, Astro 7.0.6, TypeScript 6.0.3, Zustand 5.0.14, ExifReader 4.41.0, etc.).
- No analytics/telemetry that could capture photo content — if added later, page-view level only.

#### 1.5 Epics & Stories — Sprint Breakdown

The full scope landed in **4 epics, 20 stories**:

| Epic | What it delivers | Dependencies |
|---|---|---|
| **1. Design System & Monorepo** | Tokens, component library, Storybook, CI lint gate | Independent, foundation for all others |
| **2. Gallery — Ingest & Insights** | Photo upload, metadata parsing in a Web Worker, insights dashboard | Depends on Epic 1 |
| **3. Gallery — Browse & Filters** | Photo grid, faceted filters, detail modal | **Blocked by** Epic 2 (shared store / `Photo` entity) |
| **4. Landing — Camera App Story** | Header/Hero, three value pillars, preset showcase, footer | Independent of 2/3, depends only on Epic 1 |

Epic dependencies: `2 → 1`; `3 → 1, 2` (blocking); `4 → 1` (can be built in parallel with 2/3).

#### 1.6 Implementation Readiness Check

Before development started, a formal readiness check was run:

- **100% coverage** of active functional requirements (10 of 10, excluding the formally withdrawn FR-9) by stories with explicit acceptance criteria.
- **Zero critical violations** — epics are independent, no circular dependencies, no story references anything not-yet-built.
- Only **1 non-critical issue** found (where exactly the "add more photos" button lives in the header wasn't fully pinned down — a conflict between two UX documents) and **4 minor/informational items**, none of which blocked starting Epic 1.

---

### 2. How to Pitch This in a Presentation

A natural arc — show the **funnel of narrowing uncertainty**, from idea to a development-ready plan:

1. **Idea/Brief** — "we want honest pixels + a tool to understand our own shooting habits" (the emotional hook, 1 slide).
2. **PRD** — what we're actually building and what we're deliberately not building. The list of rejections is often more convincing than the list of features.
3. **Key forks in the road** — 2–3 decisions that genuinely changed direction:
   - dropping photo sync/backup back at the brief stage;
   - the formal withdrawal of the GPS feature (FR-9) in the PRD;
   - the Insights/Browse behavior reversal at the UX stage (an explicit `[DECISION]`, not a silent drift).
   This shows the process was alive, not "written once and forgotten."
4. **Architecture** — 3–4 invariants that keep the system coherent: client-side-only, the Web Worker, the store split via selectors, a library choice made for a concrete reason (HEIC support).
5. **Epics → Sprints** — the epic-dependency table (Section 1.5).
6. **Readiness check** — a formal validation with 100% requirements coverage before development began — adds credibility to the process.

</details>
