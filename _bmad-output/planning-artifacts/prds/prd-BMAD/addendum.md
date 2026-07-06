# Addendum — Depth for Downstream (Architecture / UX)

Detail the PRD references but that belongs downstream, not in the PRD narrative. Carried from the brief's addendum + brainstorm and extended with PRD-stage decisions.

## Camera ↔ Gallery Metadata Contract (out of scope — future Lazy Cam phase)

The eventual bridge between the two products would be a **data contract carried inside the file**, not a live sync:
- Lazy Cam writes the **Preset name** into the photo's Metadata (candidate carriers: XMP keywords, a maker-note field, or a dedicated XMP namespace).
- The Gallery, on Ingest, reads that field and can then report Preset usage ("60% of your shots used 'Moody Fade'") with **no backend and no sync**.

**Status (2026-07-03):** fully **out of scope for this pet project**. The preset-in-Metadata *write* step is not being built, so no real Preset Metadata exists to read and the bridge is not a design target for the current Gallery. It belongs to a future Lazy Cam phase; if that phase happens, re-open the feasibility spikes below before committing the contract.

**Feasibility spikes to run only if the bridge is ever revived:**
1. Can a preset name reliably ride in standard Metadata written from an iOS app?
2. Which EXIF/XMP fields survive AirDrop / iCloud download / share-sheet export? *(Note: the fields the Gallery already relies on — ISO, lens, aperture, shutter, exposure compensation, date, megapixel mode, front/rear — are confirmed to survive; GPS is not written by Lazy Cam.)*

## Lazy Cam — Preset Engine (context, not built here)

Lazy Cam's differentiator, retained purely as Landing narrative (not a metadata source in this phase):
- **Tone curves** — independent shadow and highlight curve control.
- **Color mixer (HSL-style, Lightroom-like)** — per color: mute / boost saturation and hue shift (e.g. yellow→orange or →green).
- **Extensible** — more preset tools expected over time.
- **Preset sharing (aspirational)** — Fujifilm-recipe-style community sharing; not committed.
- **Clean base stance** — presets act on honest pixels after native HDR / over-sharpening is minimized.

## EXIF Gallery — Options Considered / Rejected

- **Rejected: backup / file store + live iOS photo sync.** Attractive but iOS photo sync is a real pain and would demand a separate native app — out of scope for a low-friction pet project. The tool stays **analysis + filter only, client-side**.
- **Rejected for v1: export / saved views / contact sheet.** In the brief's option set; cut from v1 to keep the loop lean (user chose Insights + Filter only).
- **Deferred: reverse-geocoding place names.** Location stays coordinate/coarse and client-side unless a trivial offline method appears.

## Technical Spine (from brainstorm — carried, not re-litigated)

- Monorepo: **pnpm + Turborepo**; `apps/{landing (Astro), gallery (Vite + React)}` + `packages/{theme, ui, eslint-config, tsconfig}`.
- One UI system enforced by Design tokens; lib membership is a pure reuse decision. Brutalist-mono aesthetic; `no-arbitrary-value` lint.
- Workspace-internal sharing (no publishing at this stage); Storybook-driven component loop.
- Both apps ship as static assets (SSG for Landing, SPA build for Gallery); no server runtime.

*Full technical spine and rationale live in the brainstorm intent (`brainstorm-monorepo-design-system`) and the brief's addendum; architecture consumes those.*
