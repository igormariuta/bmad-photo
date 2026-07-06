---
title: "Monorepo Product Suite — Camera-App Landing + EXIF Gallery + Shared Design System"
status: ready
created: 2026-07-02
updated: 2026-07-02
---

# Product Brief

## Summary
A monorepo delivering a small **product suite** around clean, honest iPhone photography: a **native iOS camera app** (its differentiator: escape Apple's forced HDR and over-processing, then apply your own presets), a **marketing landing page** for that app, and a **web EXIF gallery** that turns a photo library's metadata into insight and filters. All three share one **Brutalist-mono design system**. The purpose is a pet project to **exercise the BMAD method end-to-end**, so scope is deliberately kept low-friction.

## Purpose & Stakes
Low-stakes pet project. Primary goal: run the full BMAD planning→build loop on something real enough to be interesting. Secondary: sharpen monorepo/design-system tooling. No monetization and no launch deadline in scope; the camera app may be a real future product, but this repo is not gated on it shipping.

## Products in Scope
1. **Landing** (buildable here) — Astro SSG marketing page that sells the iOS camera app.
2. **EXIF Gallery** (buildable here, **primary web product**) — Vite + React SPA that ingests photos and analyzes/filters them by their metadata.
3. **Design System** (buildable here) — shared Brutalist-mono component library consumed by both.
4. **iOS Camera App** (**out of this monorepo's build scope**) — native iOS product that gives the suite its story and is what the landing markets. Built on a separate native track, not in this repo, and **not part of the BMAD exercise** — the narrative behind the landing, not a deliverable here.

## The Camera App — Why It Exists
For people who dislike the iPhone's look and want creative control on a clean base. Three value pillars:
1. **Kill the forced HDR.** iOS gives no way to turn native HDR off in-app; the app removes it.
2. **Strip native processing** as far as possible — especially the over-sharpening that makes stock iPhone shots look harsh.
3. **Own preset system on a clean base** — so even if HDR ever becomes disable-able in iOS, presets remain the reason to stay: real creative tooling on honest pixels.

**Presets** (the differentiator): shadow/highlight tone curves; a Lightroom-style color mixer (per-color mute/boost + hue shift, e.g. yellow→orange or →green); extensible with more tools over time; **possible community preset sharing**, Fujifilm-recipe style `[ASSUMPTION: aspirational, not v1]`.

**Target user:** iPhone shooters who find the stock HDR/over-sharpened look unpleasant and want to craft and reuse their own presets.

## The EXIF Gallery — Proposed Shape
A web tool that makes a photographer's own metadata legible. **Confirmed framing:**
- **Client-side only, no backend, no upload to a server** — photos are parsed in-browser and never leave the device. Privacy stance + zero-friction, and it sidesteps the sync/backup rabbit hole entirely.
- **Insight, not just sorting** — surface personal shooting habits: most-used focal length/lens, ISO & shutter distributions, time-of-day patterns, most-used preset. This is the hook that makes a metadata tool worth opening.
- **Filter & explore** by lens/focal length, date, location (iPhone GPS EXIF), and preset.
- **Ingest:** manual upload from phone or computer. No library sync.

**Explicitly out of scope:** backup / file store and live iOS photo sync — considered and rejected (sync is painful and would need a separate native app).

**Camera ↔ Gallery bridge (deferred):** no live connection now. The intended future link — the camera writes the **preset name into EXIF/XMP**, so the gallery can report preset usage without any sync. The metadata contract is worth sketching now; implementation is deferred. Location is treated **privacy-first**: GPS EXIF powers optional place grouping, never required.

## Users
- **Primary:** the builder (you) — this is a craft/learning project; you are user zero.
- **Secondary:** iPhone photographers who reject the stock look (camera app) and want to understand their shooting habits (gallery).

## Success Criteria
- BMAD planning→build loop completed end-to-end on this suite (the real win).
- Landing + gallery shipped from the monorepo on the shared design system with **one** UI system (no drift).
- Gallery gives at least one genuinely useful metadata insight the builder didn't have before.

## Constraints & Foundations (from brainstorm — carried, not re-litigated here)
- Monorepo: pnpm + Turborepo; apps/{landing (Astro), gallery (Vite React)} + packages/{theme, ui, eslint-config, tsconfig}.
- One UI system enforced by tokens; lib-membership is a pure reuse decision. Brutalist-mono aesthetic; `no-arbitrary-value` lint.
- Workspace-internal sharing (no publishing at this stage); Storybook-driven component loop.
- _Full technical spine lives in the brainstorm intent + addendum; the PRD/architecture consume those._

## Open Questions / Unknowns
- **Technical feasibility of the preset→EXIF/XMP write** from an iOS app — whether the preset name can reliably ride in standard metadata (keywords / maker-note / XMP) needs a spike before the bridge is committed.
- **Which EXIF fields survive** common export paths (AirDrop, iCloud download, share sheet) — determines how much the gallery's insights can rely on.
- **Preset-sharing** (Fuji-recipe style) — aspirational; not scoped for v1, revisit if the camera app matures.
