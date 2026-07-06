# Addendum — Depth for Downstream (PRD / Architecture / UX)

Details the user volunteered that belong downstream, not in the 1–2 page brief.

## Camera App — Preset Engine (feeds PRD)
The preset system is the camera app's differentiator. Known tooling so far:
- **Tone curves** — independent shadow and highlight curve control.
- **Color mixer (HSL-style, Lightroom-like)** — per individual color: mute / boost saturation, and **hue shift** (e.g. push yellow toward orange, or toward green).
- **Extensible** — more preset tools expected over time (undecided which).
- **Preset sharing (aspirational)** — community-style sharing of presets, analogous to Fujifilm film-recipe communities. Not committed for v1.

Underlying stance: apply presets on a **clean base** — native iPhone processing (HDR, over-sharpening) minimized first, so presets act on honest pixels rather than fighting Apple's look.

## EXIF Gallery — Options Considered
- **Rejected: backup / file store + live iOS photo sync.** Attractive ("even better idea"), but iOS photo sync is a real pain and would demand a separate native app — out of scope for a low-friction pet project. The tool stays **analysis + filter only**.
- **Ingest:** manual upload from phone or computer. No account/library sync.
- **Facets to sort/analyze by:** lens / focal length, preset used (only once the camera writes it to metadata), date, location (iPhone GPS EXIF).

## Coach-Proposed EXIF Directions (for user to accept/reject)
1. **Insights dashboard, not just a sorter.** Turn raw EXIF into a personal *shooting-habits* report: most-used focal length, ISO/shutter distributions, time-of-day heatmap, most-used preset. This is the compelling hook that makes a pure metadata tool worth opening.
2. **Client-side only (privacy + zero-backend).** Parse EXIF fully in-browser; photos never leave the device. Fits the minimal-friction pet project, dodges the sync/backup rabbit hole entirely, and is a clean privacy stance. It also keeps the gallery a pure SPA, matching the brainstorm's Vite-React decision.
3. **Preset-in-metadata as the camera↔gallery bridge.** If the camera app writes the preset name into EXIF/XMP (keywords or maker-note), the gallery becomes the analytics layer for the camera app — "60% of your shots used 'Moody Fade'" — with **no live sync**. The metadata travels inside the file. Elegant cross-product data contract; a good BMAD exercise.
4. **Filter → saved view → export.** Filter by any facet, save the filtered view, export a list / contact sheet. Stays analysis+filter, never storage.

## BMAD-Exercise Framing
The stated real purpose is to exercise BMAD end-to-end. That makes the **EXIF gallery the primary buildable web product** (self-contained, no native dependency), the **landing** a smaller marketing surface, and the **camera app** a real/planned native product that sits outside this monorepo's build scope but gives the suite its story.
