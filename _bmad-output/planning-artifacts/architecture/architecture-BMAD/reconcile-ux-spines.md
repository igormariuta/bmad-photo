---
name: Reconcile UX Spines — Architecture Consistency Check
type: reconciliation-note
sources:
  - '{planning_artifacts}/ux-designs/ux-BMAD/DESIGN.md'
  - '{planning_artifacts}/ux-designs/ux-BMAD/EXPERIENCE.md'
  - '{planning_artifacts}/architecture/architecture-BMAD/ARCHITECTURE-SPINE.md'
updated: 2026-07-06
---

# Reconcile UX Spines — Findings

## 1. AD-3 (Insights/Browse separation) — described, not structurally enforced

AD-3's rule text ("`useReadablePhotos()` is the **only** input Insights components may use — they must not import or accept Facet-filter state"; "No component subscribes to the raw store directly") is stated as a **naming/discipline convention**, not backed by any actual enforcement mechanism:

- No module-privacy statement says the raw Zustand store hook is unexported/internal to `store/` — nothing stops an `insights/` component from importing it (or `useFilteredPhotos`) directly if it happens to be exported.
- No ESLint import-boundary rule (e.g. a per-feature-folder restriction analogous to AD-1's `apps → ui → theme` direction) exists anywhere in the spine to make a cross-feature import of filter state fail CI. AD-1's lint gate only covers `packages/*` dependency direction and `no-arbitrary-value` (AD-5); it says nothing about intra-app feature-folder boundaries.
- Net effect: the EXPERIENCE.md guarantee ("Insights always reflects the full readable set... Browse is the only filterable surface") is currently a code-review convention, not something the architecture makes structurally impossible to violate.

**Gap.** Recommend either (a) an explicit statement that the raw store hook is not exported outside `store/index.ts` (only the three selector hooks are public), and/or (b) an ESLint `no-restricted-imports`/boundaries rule preventing `features/insights/**` from importing `useFilteredPhotos`/`useFacetFilters`/the raw store.

## 2. AD-4 `Photo` entity — sufficient for both the EXIF badge and the detail modal

Checked against the two UX requirements:

- **Grid-cell EXIF badge** ("24mm · f/1.8 · ISO 200"): needs lens/focal length, aperture, ISO → covered by `lensLabel`/`focalLengthMm`, `apertureF`, `iso`. Sufficient.
- **Photo-detail-modal full field list** (EXPERIENCE.md: "the badge's 3 fields plus the rest — shutter, exposure comp, timestamp, mp mode, front/rear"): covered by `shutterSpeedSec`, `exposureCompEv`, `capturedAt`, `megapixelMode`, `camera`. Sufficient — every field EXPERIENCE.md enumerates has a named counterpart on `Photo`.

**No gap here.** One minor unaddressed edge case (not a contradiction, just unspecified in both UX and architecture docs): a `readable: true` photo can still have individual optional fields absent (e.g. ISO missing but focal length present) — neither DESIGN.md's badge spec nor the architecture says how the badge/modal renders a partially-missing field. Not urgent; flagging only since it's the one place the entity's per-field optionality meets a UI rendering rule.

## 3. AD-2 (Web Worker) — parsing mechanism is specified, the progress-reporting contract is not

AD-2 does gesture at progress reporting ("the main thread... receives normalized `Photo` records + **progress ticks** back"), so it's not a total blank — but it stops short of specifying the contract EXPERIENCE.md's Ingest-progress needs:

- EXPERIENCE.md requires a **determinate**, photo-granular counter: "Parsing 42/100," and the a11y floor requires `aria-live="polite"` announcements of that same progress.
- The spine never states the tick granularity (one tick per completed photo vs. per chunk/batch), the message shape (`{completed, total}` vs. something else), or that ticks are ordered/monotonic — anything needed to guarantee the UI can actually render an exact "N/100" rather than a coarser indeterminate signal.

**Partial gap.** The parsing mechanism (single worker, ExifReader, main-thread-never-parses) is solid; the progress-reporting contract that the determinate "Parsing N/100" UI depends on is implied but not made explicit. Recommend adding a one-line rule to AD-2 (or a new sub-bullet) specifying: one progress tick emitted per completed photo, `{completedCount, totalCount}` shape, so "N/100" and the `aria-live` announcement have a guaranteed 1:1 source.

## 4. Orphaned UX concepts (no home in the architecture spine)

- **Analytics stance** — EXPERIENCE.md's Privacy & Data Handling section explicitly carries an `[ASSUMPTION]` permitting "aggregate, non-identifying usage counters only, if any." The architecture spine never mentions analytics anywhere — not in the Stack table, not in the Capability→Architecture Map, and notably not even in the **Deferred** section (which otherwise explicitly defers/out-of-scopes other items like GPS/location and the Preset Facet). This is the clearest orphan: a UX-level allowance with zero architectural acknowledgment, one way or the other.
- **App-shell / conditional layout composition** — EXPERIENCE.md's Empty-state rule ("No header/tabs/panel chrome renders until the first Ingest completes") and UnderlineTabs' "preserves scroll position... independently per tab" imply a top-level layout/composition layer in `apps/gallery` that decides which feature renders and holds tab-level UI state (scroll position isn't Facet-filter state, so it doesn't fit AD-3's store). The Structural Seed lists only `features/`, `store/`, `worker/` — no top-level `App.tsx`/layout module is called out as owning this orchestration. Likely an intentional omission (implementation detail), but worth a one-line acknowledgment since it's the thing that actually satisfies the empty-state gating rule.
- **Batch-exceeds-100 rejection** — EXPERIENCE.md's State Patterns table requires rejecting (not truncating) selections beyond the 100-photo cap with a visible message. AD-2 binds the ≤100/batch NFR but only as a worker-capacity constraint; nothing states where the cap is validated (before invoking the worker, presumably in the `ingest` feature) or that it's a hard rejection vs. silent truncation. Minor — reasonably inferred to live in `features/ingest`, but not spelled out.

All other DESIGN.md/EXPERIENCE.md concepts checked (Landing components, Facet-panel/range-control, theme toggle, a11y floor items, Photo-detail-modal, empty-state privacy copy) map cleanly onto existing FRs/AD's/Structural Seed entries.
