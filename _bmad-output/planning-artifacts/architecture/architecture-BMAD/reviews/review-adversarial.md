---
name: 'Architecture Spine — Adversarial Review'
type: review
purpose: find-divergence-holes
altitude: feature
scope: 'ARCHITECTURE-SPINE.md — BMAD Monorepo Product Suite'
status: final
created: '2026-07-06'
target: '{planning_artifacts}/architecture/architecture-BMAD/ARCHITECTURE-SPINE.md'
---

# Adversarial Review — ARCHITECTURE-SPINE.md

Method: assume two independent builders (human or AI dev-agents), each reading only this
spine, each obeying every AD to the letter, working on different slices in parallel with
zero side-channel communication. For each finding below, both implementations are
individually spine-compliant, yet the outputs diverge or collide at integration time.

Findings are ranked by severity (contradiction > silent divergence > enforcement gap).

---

## Finding 1 — AD-3 forbids the raw store, but the required Insights feature cannot be built without it (direct contradiction)

**Severity: Critical — this is not a corner case, it blocks a named FR.**

AD-3's rule is unconditional: *"`useReadablePhotos()` ... is the **only** input Insights
components may use ... No component subscribes to the raw store directly."*

But the Structural Seed explicitly assigns Insights an *"unreadable-count note"*
(`apps/gallery/src/features/insights/`), and AD-4 says `readable: false` photos are
*"counted only"* — i.e. Insights must display how many photos were excluded.

`useReadablePhotos()` returns `photos.filter(p => p.readable)` — by construction it has
already discarded the unreadable photos. There is no selector in AD-3 that returns their
count, and Insights is forbidden from touching anything else.

**Concrete scenario:**
- Dev/Agent A (Insights) needs to render "12 photos couldn't be read." They cannot derive
  this number from `useReadablePhotos()` alone, so they add a private
  `useGalleryStore(s => s.photos.length - s.photos.filter(p => p.readable).length)` call
  directly inside the Insights feature folder — technically violating "no component
  subscribes to the raw store directly," but there is no other way to satisfy FR-7 as
  specced, so they do it anyway and consider AD-3 "obviously not meant literally here."
- Dev/Agent B, reading the same spine for a different Insights sub-component (say, a
  "total photos ingested" header), independently adds a *second*, differently-named
  selector to `store/` — `useTotalPhotoCount()` — assuming that's the sanctioned escape
  hatch, and wires the unreadable count as `useTotalPhotoCount() - useReadablePhotos().length`.
- Both are spine-compliant by their own reading. Now there are two different code paths
  computing the same "unreadable count" number, one inline/ad hoc and one via a new named
  selector that nothing in AD-3 anticipated or authorized — and no lint rule (see Finding 4)
  would catch either as a violation, because AD-3 never states *how* "no raw store access"
  is enforced.

**Fix direction:** AD-3 needs an explicit selector for the unreadable count/total (e.g.
`useUnreadablePhotoCount()` or `useAllPhotos()`-for-counting-only, clearly scoped to "count
only, never render fields from it"), or must state that Insights may read `photos.length`
totals but never individual unreadable-photo field data.

---

## Finding 2 — `readable` is a single per-photo boolean, but AD-4's own prose implies per-field readability; nothing defines what sets it false

**Severity: High — silent divergence in what "readable" even means.**

AD-4's type has exactly one flag: `readable: boolean`. Its prose says: *"Every optional
field is absent ... when unreadable for that specific field; `readable` gates whether the
photo enters grid/Insights math at all."* This reads as if individual *fields* can be
independently missing/unreadable, yet only the whole *photo* has a readability flag — the
spine never states the rule that maps "which EXIF tags parsed" to the single `readable`
boolean.

**Concrete scenario:**
- Worker/normalize.ts implementer (AD-6 owns this file) interprets "readable" as "the file's
  EXIF block parsed without a hard error" — so a photo with *zero* EXIF tags (e.g. a
  WhatsApp-recompressed JPEG, a screenshot, or an Instagram export with metadata stripped,
  which is a realistic case for an app built around Lazy Cam photos being shared around)
  still gets `readable: true` with every optional field simply absent, because ExifReader
  didn't throw.
- The Insights implementer, building the "unreadable-count note" (Finding 1) and the
  histogram-bar rows, assumed `readable: false` is what identifies "no usable metadata,"
  and built the histogram-bucketing/percentage math assuming every `readable: true` photo
  has at least `capturedAt` or `iso` populated (needed for bucketing). It doesn't — a
  stripped-metadata photo is `readable: true` with all seven optional fields absent, so it
  silently skews every histogram's "readable N of M" denominator without ever showing up
  in the "unreadable" count the Insights dev is showing right next to it. Two agents, same
  spine, no shared definition of "readable" — the resulting UI is internally inconsistent
  (denominators don't foot) and neither implementation is spine-wrong.

**Fix direction:** state explicitly what condition sets `readable = false` (e.g. "file
threw during EXIF read, or zero usable tags found") vs. "field-level absence is normal
and does not affect `readable`" — and state whether Insights math must additionally
guard against all-fields-absent-but-readable photos.

---

## Finding 3 — EXIF-badge caption: "which 3 fields" is never named, and there's no canonical selector like `normalize.ts` or `useReadablePhotos`

**Severity: High — matches the exact suspicion in the brief; near-certain divergence.**

The Structural Seed names the artifact — *"browse/ ... photo grid, EXIF-badge
captions"* — but nowhere in AD-3, AD-4, the Capability Map, or the Photo type comment
is there a statement of which fields populate that badge, in what order, or where the
selection logic canonically lives. Contrast this with AD-6, which is careful to pin
derivation to one named file (`normalize.ts`) precisely to prevent divergence — no
equivalent pinning exists for the badge.

**Concrete scenario:**
- Browse-feature Dev/Agent A picks the classic "exposure triangle" reading of a camera
  shot: `apertureF`, `shutterSpeedSec`, `iso` — because that's the conventional
  photography trio and all three exist on `Photo`.
- Browse-feature Dev/Agent B (imagine Browse split into a grid sub-task and a badge
  sub-task, or a second pass revisiting the same component) instead picks
  `lensLabel`, `focalLengthMm`, `iso` — reasoning that focal length + lens is more
  useful for a phone-camera-focused app (Lazy Cam presets are framed around focal
  length/megapixel mode per PRD, not shutter speed) and that shutter speed is rarely
  distinctive on a phone.
- Both are 3-field, both plausible, both spine-compliant — there is no line in the
  spine that says which 3, or even that it must always be the *same* 3 across every
  photo (what does the badge show when `apertureF` is absent — fall back to a 4th
  field, or show only 2?). If Photo-detail's "full Metadata Spec rows" ever need a
  condensed preview (e.g. a lightbox header), a third implementation could pick a
  third combination, with zero cross-check.

**Fix direction:** name the exact 3 fields and their fallback order in the spine (or at
minimum in EXPERIENCE.md, referenced by field name), and name the selector/component
(e.g. `apps/gallery/src/features/browse/badgeFields.ts`) as the one place this logic
lives, the same way AD-6 pins derivation to `normalize.ts`.

---

## Finding 4 — AD-3's "no raw store access" / "one canonical location" rules have no CI/lint enforcement, unlike AD-1 and AD-5

**Severity: Medium — the ADs describe intent, not a catchable violation.**

AD-1 and AD-5 are backed by a concrete, named enforcement mechanism: `packages/eslint-config`'s
`no-arbitrary-value` rule, listed explicitly in the Lint/CI gate row (`turbo lint` +
`turbo test` + `turbo build`). AD-3 has no equivalent. The only CI gates named anywhere in
the spine are: `no-arbitrary-value` (AD-5) and the Vitest suite over the normalization
layer (AD-6). Nothing lints:
- that a component under `features/insights/**` doesn't import from `features/browse/**`
  or subscribe to the raw store,
- that `useFacetFilters()`/raw store setters aren't called from outside `store/`,
- that EXIF parsing doesn't happen outside `worker/`.

**Concrete scenario:** Insights Dev/Agent, mid-sprint, needs "photos with a lens attached"
count for a stat tile. Rather than extend `useReadablePhotos()` (which they've been told
is the *only* sanctioned input and shouldn't be touched to "add browse-specific filtering
smell"), they import the store directly: `useGalleryStore(s => s.photos)` and filter
locally in the component. Nothing red-flags this in PR review beyond a human noticing —
`turbo lint`/`turbo test`/`turbo build` all pass, because no rule targets it. Meanwhile the
Browse Dev/Agent, filtering via `useFilteredPhotos()` as instructed, is fully compliant.
Both merge; the store's "single canonical read path" invariant is now silently broken by
one of the two, and nothing in CI would have caught it before or after.

**Fix direction:** either add an `eslint-plugin-boundaries` (or equivalent
import-restriction) rule scoped per feature folder to the Lint/CI gate row, explicitly
alongside `no-arbitrary-value`, or accept this is enforced by review only and say so.

---

## Finding 5 — AD-2's worker↔main message protocol has no defined shape; progress ticks and error/crash handling are unspecified

**Severity: Medium-High — matches the exact suspicion in the brief.**

AD-2 says: *"The main thread only posts photo files/batches to the worker and receives
normalized `Photo` records + progress ticks back."* That's the entire contract. No
message envelope/discriminated union is given (e.g. is it
`{type:'progress', done, total} | {type:'photo', photo} | {type:'done'} | {type:'error', ...}`?).
No statement of what happens when ExifReader throws on a single corrupt/HEIC-edge-case
file mid-batch — does the worker: (a) catch per-file and emit a `Photo` with
`readable:false` and continue, (b) skip the file and adjust `total`, or (c) let the
exception propagate and crash/terminate the worker, aborting the rest of the batch?

**Concrete scenario:**
- Worker-side Dev/Agent implements a `try/catch` per file inside the loop, and on failure
  posts a `Photo` with `readable: false` and all optional fields absent (consistent with
  their reading of Finding 2) — the batch always completes, `progress` ticks are simply
  `{done: number, total: number}` incremented once per file regardless of success.
- Ingest-UI-side Dev/Agent, working only from the same AD-2 sentence, assumes the more
  defensive interpretation (reasonable given "must not freeze the UI" language elsewhere
  and general web-worker best practice): that a per-file throw becomes a `postMessage`
  of shape `{type: 'error', fileName, message}`, and builds the progress bar / ingest
  screen to render a distinct "N failed to import" toast whenever it receives one, with
  `progress` ticks shaped as `{percent: number}` (a single derived number, computed
  worker-side) rather than `{done, total}`.
- At integration, the UI never receives `{type:'error', ...}` messages (worker never sends
  them) and the progress bar destructures `msg.percent`, which is `undefined` on every
  tick the worker actually sends (`{done, total}`) — the progress bar never advances,
  and the promised "N failed to import" UX (reasonably inferred from NFRs, never actually
  specified) never fires. Both sides individually satisfy the one sentence in AD-2.

**Fix direction:** add a minimal discriminated-union message type to AD-2 (or to AD-4's
neighborhood, since it's the wire contract) — e.g. name and shape
`WorkerMessage = {type:'progress', done:number, total:number} | {type:'photo', photo:Photo} | {type:'complete'} | {type:'error', fileName:string, reason:string}` — and state the
per-file-failure policy explicitly (continue batch vs. abort).

---

## Finding 6 — AD-5's "no arbitrary values" likely only covers Tailwind class literals, not inline `style` props or CSS-in-JS, and there is no stated activation contract for the token CSS

**Severity: Medium.**

AD-5's rule: *"`packages/eslint-config`'s `no-arbitrary-value` rule ... fails CI on any
literal color/spacing value where a token exists."* In practice, ESLint rules targeting
"arbitrary values" (the term is borrowed from Tailwind's `p-[13px]` bracket syntax)
typically pattern-match className strings or Tailwind config, not arbitrary JS object
literals like `style={{ background: '#3366ff' }}`. The spine doesn't say the rule's scope
covers `style` props, CSS-in-JS template literals, or raw `.css` files.

**Concrete scenario:**
- `packages/ui` Dev/Agent building `HistogramBar` needs a dynamically computed bar width
  (`${pct}%`) and, for a one-off accent color not worth adding as a new token yet, writes
  `style={{ width: \`${pct}%\`, backgroundColor: '#3366ff' }}`. `turbo lint` passes — the
  `no-arbitrary-value` rule (as commonly implemented) only inspects `className`/Tailwind
  usage, not inline `style` objects — this is a real, common escape hatch.
- Landing Dev/Agent building `pillar-card` never does this, uses only token-backed
  Tailwind classes.
- Result: visual drift (SM-2, the exact risk AD-5 exists to prevent) between the two apps
  sharing `packages/ui`, with CI green on both sides, because the AD names an enforcement
  mechanism without pinning its actual scope (inline styles, CSS Modules, styled-components,
  etc. all commonly slip past className-only linters).

Separately: it's never stated *how* `packages/theme`'s CSS custom properties get injected
at runtime — must every consuming app import a `packages/theme/dist/index.css` (or
equivalent) at its root, or is the Tailwind preset alone sufficient (it is not, for raw
`var(--m-*)` usage in non-Tailwind contexts)? Two apps' root-layout authors could
independently decide differently, with one app silently falling back to `initial`/unset
custom-property values for anything referencing `--m-*` directly outside Tailwind classes.

**Fix direction:** state explicitly that `no-arbitrary-value` must cover `style` props and
any CSS-in-JS in scope, and name the exact import/activation point for the theme runtime
CSS in both apps' root entry files.

---

## Finding 7 — Store write-access and `thumbnailUrl` lifecycle ownership are unspecified, creating a use-after-revoke race

**Severity: Medium.**

The Consistency Conventions table says "Zustand is the only client state mechanism" and
AD-3 names the *read* selectors precisely, but nothing names which module(s) may call
`setState`/write actions on the store, nor who owns the `thumbnailUrl` object-URL
lifecycle beyond the one clause in AD-4: *"client-generated object URL, revoked on
Ingest reset."*

**Concrete scenario:**
- Ingest Dev/Agent implements "reset" (e.g. a "start new batch" button) as: revoke every
  current photo's `thumbnailUrl` via `URL.revokeObjectURL`, then `setState({photos: []})`.
  Reasonable, and matches AD-4's clause literally.
- Photo-detail Dev/Agent, working independently, builds the full-screen modal that reads
  `photo.thumbnailUrl` (or a related object URL for the enlarged view) and, for a smooth
  transition, caches it in local component state/`ref` while the modal is open, assuming
  (nothing in the spine says otherwise) that once a `Photo` is fetched from the store it
  remains valid for the lifetime of the component that's rendering it.
- If a user opens Photo-detail, then somehow triggers a new Ingest reset in the same
  session (e.g. backgrounds the tab, picks more photos, or simply a double-render/HMR
  edge case an AI dev-agent's implementation doesn't guard against) — the modal's cached
  URL is now revoked out from under it, producing a broken image with no error boundary,
  because no AD states an ownership/lifecycle contract between the two features for this
  shared, mutable, side-effectful resource.

**Fix direction:** name the exact module/action allowed to call `setState` (e.g. "only
`store/actions.ts` exports mutators; features call actions, never `setState` directly")
and state the `thumbnailUrl` revoke contract's interaction with any-open Photo-detail view
(e.g. "reset is disabled while Photo-detail is open" or "Photo-detail must not outlive a
reset — no caching beyond the render that reads it").

---

## Summary of gaps requiring a spine update (not just this review doc)

1. **New/adjusted AD-3 selector** for unreadable-count / total-count access from Insights
   without granting raw-store access (Finding 1 — contradicts a named FR today).
2. **Definition of what sets `readable = false`**, and confirmation that Insights math
   must not assume `readable ⇒ any field present` (Finding 2).
3. **Named canonical location + exact field list** for the EXIF-badge caption's 3 fields
   (Finding 3).
4. **CI-enforceable boundary rule** (import-restriction lint) backing AD-3's "single
   selector" rule, not just prose (Finding 4).
5. **Discriminated-union message contract** for the AD-2 worker protocol, plus a stated
   per-file-failure policy (Finding 5).
6. **Explicit scope statement** for `no-arbitrary-value` (inline styles/CSS-in-JS) and a
   named activation point for theme runtime CSS (Finding 6).
7. **Named store-write-access convention** and a `thumbnailUrl` lifecycle/ownership
   contract across Ingest and Photo-detail (Finding 7).

None of these findings require rejecting the spine's overall shape — the layering (AD-1),
worker isolation (AD-2), and token system (AD-5) are sound at the level they operate.
The gaps are all at the next level down: the spine states *intent* correctly but under-
specifies the *mechanism* (exact selector names, message shapes, enforcement rules) needed
for two independent, fully-compliant builders to converge rather than merely coexist.
