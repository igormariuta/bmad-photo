# Brief → PRD Reconciliation

**Reviewed:** brief.md + addendum.md (source) vs. prd.md + addendum.md (draft)
**Date:** 2026-07-03
**Scope note:** The following were confirmed as deliberate v1 scope cuts and are NOT reported as gaps: preset Facet deferred, gallery export/saved-views deferred, Landing purely informational (no email/waitlist), gallery mobile-first.

This review looks for source ideas — especially qualitative, strategic, and emotional intent — that the FR-structured PRD dropped or weakened. Four genuine gaps found.

---

## Gap 1 — Presets-as-durable-moat / "reason to stay" thesis dropped — **HIGH**

**Source (brief §"The Camera App", pillar 3):** "Own preset system on a clean base — **so even if HDR ever becomes disable-able in iOS, presets remain the reason to stay: real creative tooling on honest pixels.**"

**PRD state:** The three pillars appear in FR-10 and the Vision, and "Clean base" is glossary-defined — but the *strategic durability argument* is entirely absent. FR-10 flattens pillar 3 to "own preset system on a Clean base"; the Glossary defines Clean base mechanically ("honest pixels ... on which Presets act"). Nowhere does the PRD carry the load-bearing point that presets are what makes the app endure **even if Apple removes the HDR problem** — i.e. presets, not HDR-killing, are the real moat.

**Why it matters:** This is the camera app's core "why it survives" thesis and the single most important framing for the Landing narrative the PRD is meant to seed. Kill-HDR is a wedge; presets are the retention story. A Landing built purely off FR-10 would sell the wedge and miss the moat. Qualitative strategic intent silently lost in the FR structure.

---

## Gap 2 — Visceral emotional framing of the stock-look problem softened — **MEDIUM**

**Source:** The brief's emotional engine is gut-level aesthetic revulsion: the stock look is "**unpleasant**," "**over-sharpened**," "**harsh**"; target users "**dislike**" / "**reject**" it; the app lets you "**escape** Apple's forced HDR and over-processing." The addendum reinforces "presets act on honest pixels rather than **fighting Apple's look**."

**PRD state:** UJ-2 preserves some of this ("finds her stock photos harsh and over-processed," "recognizes her own frustration"), which is good — but the Vision and FR-10 render the same problem in flatter, neutral product language ("dislike the forced-HDR, over-sharpened look and want creative control"). The active, oppositional stance — *escaping / fighting Apple's look* — is diluted to passive preference.

**Why it matters:** The emotional intensity is the reason the story lands in "under a minute" (UJ-2 climax). Tone/voice §11 asks for copy that is "honest, direct, a little opinionated," but the PRD's own problem-statement prose is milder than the brief's, giving downstream copywriters a weaker emotional baseline to work from.

---

## Gap 3 — Preset community-sharing (Fujifilm-recipe) aspiration + its open question demoted — **MEDIUM**

**Source (brief pillar/differentiator + Open Questions; brief addendum):** "**possible community preset sharing, Fujifilm-recipe style**" is called out as part of the preset differentiator, and it is one of the brief's three explicit Open Questions ("Preset-sharing ... aspirational; revisit if the camera app matures").

**PRD state:** Survives only faintly — one line in the PRD *addendum* ("Preset sharing (aspirational) ... not committed"). It is absent from the Vision, from FR-10's Landing narrative, and — notably — from PRD §8 Open Questions, which carries the other three brief open questions but drops the preset-sharing one entirely.

**Why it matters:** Even as an out-of-v1 aspiration, community sharing is an evocative part of the camera-app *story* the Landing tells, and the brief flagged it as a live open question to revisit. Dropping it from the narrative and the Open Questions register loses a traceable "revisit later" thread. (Partial retention in addendum keeps this below High.)

---

## Gap 4 — Preset-engine creative specifics flattened out of the narrative — **LOW–MEDIUM**

**Source (brief + addendum):** Presets are made concrete and compelling via specifics — a Lightroom-style color mixer with **per-color mute/boost and hue shift ("yellow→orange or →green")**, independent **shadow/highlight tone curves**, and **extensibility ("more tools over time")**.

**PRD state:** Retained in the PRD addendum (good), but the PRD body — FR-10 and the Glossary Preset entry — flattens all of this to "tone curves, color mixer." The concrete creative capability (hue-shift examples, per-color control, extensibility) that makes presets *feel* powerful is dropped from the narrative surface.

**Why it matters:** The Landing sells presets; "tone curves, color mixer" is a spec label, not a selling image. The vivid detail ("push yellow toward orange") is exactly the kind of concrete hook the brief supplied for marketing copy. Weakened, not lost (addendum holds it), hence lower severity.

---

## Not gaps (verified retained)
- Client-side-only / privacy-first / zero-backend — strongly carried (Vision, FR-5/6/9, NFRs, SM-C2).
- Insights-not-just-sorting hook — carried (Vision, FR-7, SM-3).
- Rejected backup/sync — carried (§5 Non-Goals, addendum).
- Camera↔Gallery metadata contract "sketch now, defer build" — carried (PRD addendum, §8).
- BMAD-exercise-as-real-win, no monetization, no deadline, user-zero framing — carried.
- Monorepo/tooling spine (pnpm+Turborepo, package names, Storybook, no-arbitrary-value lint) — carried.
- "One useful insight the builder didn't have before" success criterion — carried (SM-3).
