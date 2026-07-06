# PRD ↔ Architecture Spine Reconciliation

Comparing `prds/prd-BMAD/prd.md` (FR-1–FR-11, §6 MVP scope, §10 NFRs) against
`architecture-BMAD/ARCHITECTURE-SPINE.md`.

## Covered

- **FR-1** Single-source Design tokens → AD-5, Capability Map row.
- **FR-2** Shared component library → AD-1, Capability Map row.
- **FR-4** Token-usage enforcement (`no-arbitrary-value`) → AD-5, Consistency Conventions, Capability Map row.
- **FR-5** Manual photo Ingest → AD-2, Capability Map row.
- **FR-6** In-browser Metadata extraction, incl. the full field list from PRD §3/§6 (focal length, lens, ISO, aperture, shutter speed, exposure comp, capture time, megapixel mode, front/rear) → AD-2, AD-4's `Photo` type (enumerates every field), AD-6, Capability Map row.
- **FR-7** Insights dashboard → AD-3, AD-4, Capability Map row.
- **FR-8** Faceted filtering, including the AND-combine / "Insights reads full readable set, not filtered set" correction vs. the PRD §9 assumption → AD-3, AD-4, Capability Map row.
- **FR-9** (withdrawn in PRD) → correctly absent from spine `binds` and body; not resurrected.
- **FR-10** Story-only Landing page → Capability Map row (no AD assigned — correctly so, see "out of altitude" below).
- **FR-11** Landing on shared Design System, responsive → AD-1, AD-5, Capability Map row.
- **100-photo/batch cap** (§4.2 feature NFR, §6.1) → explicitly named in AD-2's `Binds` line and reaffirmed in Deferred ("AD-2 fixes a single Web Worker as sufficient for ≤100 photos/batch; revisit only if the batch cap changes materially").
- **Performance NFR** (§10, must not freeze UI) → AD-2.
- **Consistency NFR** (§10, one UI system) → AD-5 + Consistency Conventions table.
- **Hosting/cost NFR** (§10, static hosting, no server) → Stack table (Vercel, both apps) + no backend anywhere in the Structural Seed.
- **Out-of-MVP items** (Preset Facet + camera↔gallery bridge, GPS/location, export/saved views, §5/§6.2) → explicitly named in the spine's Deferred section with reasons.
- **Monorepo foundations** (§6.1: pnpm+Turborepo, `apps/{landing,gallery}` + `packages/{theme,ui,eslint-config,tsconfig}`) → Structural Seed + Stack table.

## Missing / Gaps

1. **FR-3 — Storybook-driven component development.** Listed in the spine's frontmatter `binds: [...FR-3...]` but never actually addressed in the body: no AD, no Storybook entry in the Stack table, no row in the Capability → Architecture Map, no `stories/`-type folder in the Structural Seed. PRD §6.1 explicitly puts Storybook in MVP scope ("tokens, shared component library, **Storybook**, `no-arbitrary-value` lint (FR-1–FR-4)"). It is also absent from Deferred, so this isn't a deliberate deferral — it's a drop. The `binds` claim is currently false advertising.

2. **Privacy / client-side-only hard invariant (§10)** — PRD calls this out by name as "load-bearing" and "verifiable via network inspection showing zero photo/Metadata egress." The spine has no AD or convention that actually enforces it: AD-2 only decides *where* parsing happens (worker vs. main thread), not that the app must never make network calls involving photo data, and never adds analytics/telemetry. Nothing in Consistency Conventions or Stack forbids adding a tracking SDK later. As written, the invariant holds only as an emergent property of "no backend was designed" — it isn't enforced the deliberate way token usage is enforced by `no-arbitrary-value` lint (AD-5). Given this is the single most important promise of the whole product and the task explicitly flagged it as a risk, it reads as assumed rather than architected.

3. **Accessibility baseline (§10)** — "keyboard-operable controls, semantic markup" appears nowhere in the spine: no AD, no Consistency Convention, no Capability Map row, not named in Deferred. `packages/ui` is exactly where such a convention belongs (parallel to how AD-5 enforces tokens), so this reads as a silent drop rather than an intentional deferral.

4. **Browser support (§10, "modern evergreen browsers, mobile Safari")** — no browserslist/build-target convention captured anywhere. Partially compensated indirectly by AD-2's ExifReader-over-exifr rationale (HEIC/Safari-specific), but the general browser-support target itself isn't stated. Minor — arguably too low-altitude for a spine, but worth a one-line mention or explicit Deferred entry.

## Legitimate out-of-altitude gaps (not defects)

- **Tone/voice (§11, Landing copy: "honest, direct, opinionated")** — correctly absent from the spine. This is a copy/content decision for UX/content workflows, not a structural concern. The spine does carry its structural consequence (visual identity via tokens, AD-5), which is the right altitude split.
- **FR-10 has no AD assigned** ("—" in the Capability Map) — correct: story-only static content has no architectural decision beyond "lives in `apps/landing/src/pages`" plus consuming the design system (already covered via FR-11/AD-1/AD-5).
- **Success-metric counter-metrics (SM-C1/SM-C2) and Open Questions (§8)** — process/scope-discipline items, not architecture-bindable requirements; correctly out of the spine's scope.
