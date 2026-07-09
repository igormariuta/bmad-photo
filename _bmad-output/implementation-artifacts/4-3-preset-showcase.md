---
baseline_commit: 06de550662fda561e5ba710ba57698b2a014eb58
---

# Story 4.3: Preset Showcase

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Maya,
I want to see concrete examples of the preset tools,
so that I can evaluate whether they'd solve my problem.

## Acceptance Criteria

1. **Given** the preset-showcase section, **when** it renders, **then** a static before/after image pair (a tone-curve example and a color-mixer example) shows side-by-side on desktop / stacked on mobile, each half framed by a 2px border and labelled with a data-label caption (`"BEFORE"`/`"AFTER"`). [Source: planning-artifacts/epics.md#Story 4.3]
2. **Given** the preset explanation copy, **when** it renders, **then** it names concrete tools: shadow/highlight tone curves, and a Lightroom-style per-color mixer (mute/boost + hue shift, e.g. yellow→orange). [Source: planning-artifacts/epics.md#Story 4.3]
3. **Given** the section enters the viewport, **when** it is scrolled into view, **then** it fades up once, same treatment as Pillar-card. [Source: planning-artifacts/epics.md#Story 4.3]
4. **Given** an image fails to load, **when** the failure occurs, **then** it falls back to an ErrorMessage-style muted placeholder frame with alt text, never a broken-image icon. [Source: planning-artifacts/epics.md#Story 4.3]

## Dev Notes

- **Depends on Story 4.1** (page shell) and Story 4.2 (the scroll-triggered fade-up technique this story reuses verbatim).
- **`Preset-comparison` is Landing-local** (single consumer, FR-2).
- **Real image assets don't exist in this repo yet** — a tone-curve before/after pair and a color-mixer before/after pair need to be sourced or created as static assets. This is a content need, not something inferable from any planning doc; flag for the user/PM to provide or commission these before this story can ship visually complete (the component itself can and should still be built against placeholder image paths).
- **AC #4's "ErrorMessage-style" fallback is a styling reference, not a literal reuse of the `ErrorMessage` component** (which is a full-page, `error`/`status`-driven component from Story 1.5, not an inline image-fallback treatment, and isn't otherwise used anywhere on Landing). Build a small local fallback: on `<img>` load failure, swap to a muted placeholder frame (`--m-panel`/`--m-muted` background, 2px `--m-dim` border, visible `alt` text) — matching `ErrorMessage`'s general muted aesthetic language, not importing the component itself.
- **Fade-up reuses Story 4.2's exact technique** (`animation-timeline: view()`, `prefers-reduced-motion` collapse) — "same treatment as Pillar-card" means literally the same CSS mechanism, not a new one. Since this is one section (a before/after pair, not 3 discrete cards), a per-half 90ms stagger is optional — either a single fade for the whole section or a two-way stagger both satisfy "same treatment," pick whichever reads better once built.

## Tasks / Subtasks

- [x] Task 1: `Preset-comparison` (AC: #1) — `apps/landing/src/components/PresetComparison.tsx`
  - [x] Two image halves, each 2px `--m-dim` border, `data-label` caption (`"BEFORE"`/`"AFTER"`) — side-by-side on desktop, stacked on mobile
- [x] Task 2: Content (AC: #2)
  - [x] Copy naming concrete tools: shadow/highlight tone curves, and a Lightroom-style per-color mixer (mute/boost + hue shift, e.g. yellow→orange)
- [x] Task 3: Image-load fallback (AC: #4)
  - [x] `onError` swaps each half to the muted placeholder frame described in Dev Notes, with `alt` text still visible — never the browser's default broken-image icon
- [x] Task 4: Scroll-triggered fade-up (AC: #3)
  - [x] Reuse Story 4.2's CSS technique verbatim
- [x] Task 5: Verify (AC: #1–#4)
  - [x] Confirm layout at mobile/desktop widths, copy accuracy, fade-up behavior, and the fallback frame (test by pointing an image `src` at a 404 temporarily)

### Review Findings

3-layer adversarial code review (Blind Hunter, Edge Case Hunter, Acceptance Auditor) against the uncommitted working-tree diff (baseline `06de5506`, matching this story's own `baseline_commit`).

- [x] [Review][Decision] Preset-comparison scope: one before/after pair (2 images) vs. two separate pairs (4 images) — **Resolved by user (2026-07-09), superseding both original options:** the user supplied three real phone photos of the same frame (`preset-default.jpg`, `preset-chrome.jpg`, `preset-bw.jpg`) and redirected the design live to two split-compare blocks — one comparing the default preset against a Chrome preset, one against a B&W preset — each rendered as a single photo divided by a vertical line rather than two separately-bordered halves. This also supersedes AC #1's literal "each half framed by a 2px border and labelled with a data-label caption (`BEFORE`/`AFTER`)" text: the shipped UI frames the whole split photo once and labels each side by its own preset name (`"Default preset"` / `"Chrome preset"` / `"B&W preset"`, positioned above the photo) instead of a generic `BEFORE`/`AFTER` caption below it. AC #1's wording should be revisited to match; not changed here since Acceptance Criteria is outside this workflow's editable scope for a dev/review pass.
- [x] [Review][Patch] Fallback frame has no overflow guard for long `alt` text — resolved as part of the split-compare rewrite: each fallback placeholder now renders inside `SplitCompare`'s outer `overflow-hidden` container, so long `alt` text is clipped by the ancestor regardless of box size. [apps/landing/src/components/PresetComparison.tsx (`SplitCompare`'s wrapping `overflow-hidden` div)]
- [x] [Review][Patch] Fallback frame's `role="img"` + `aria-label` duplicated its own visible text content — resolved: the rewritten fallback (`SplitHalf`, not-loaded branch) is a plain text-content `<div>` with no `role`/`aria-label`, so there's nothing left to drift out of sync.
- [x] [Review][Patch] `<img>` elements had no `loading="lazy"` — resolved: `SplitHalf`'s `<img>` now sets `loading="lazy"`.
- [x] [Review][Defer] `<img>` load failure before hydration completes (disabled JS, blocked/slow script, or CSP) still risks a native broken-image icon, a literal (if narrow) gap against AC #4's "never a broken-image icon" — the mount-time `naturalWidth` check (still present in `SplitCompare`'s `useEffect`) only corrects an already-failed image *after* React hydrates. Deferred, pre-existing pattern: mirrors the SSR-then-post-mount-correction approach Story 4.1's code review already established as the accepted fix for this class of bug (`ThemeToggle`'s `useIsomorphicLayoutEffect`, chosen over `client:only` since dropping SSR was flagged as a worse regression) — every `client:load` island in this app carries the same residual no-JS-ever risk.
- [x] [Review][Defer] `SplitHalf`'s failed-state has no reset effect keyed on `src` — deferred, pre-existing pattern; not reachable via any current code path, both `SplitCompare` call sites pass static string literals that never change during the component's lifetime (same "unreachable via current static literal" reasoning Story 4.2's review already applied to `stagger`/array-growth).
- [x] [Review][Defer] `naturalWidth === 0` misclassifies a validly-loaded, zero-intrinsic-size image (e.g. a sizeless SVG) as failed — deferred; not reachable for this component's actual asset domain (real `.jpg` photography, always non-zero intrinsic size once loaded), only a concern if a future edit swaps in vector assets.
- [x] [Review][Defer] Landing has no automated regression test for the fallback logic that was already found broken once this session — deferred, pre-existing gap; matches Stories 4.1/4.2's already-established precedent that Landing has no unit-test framework configured.
- [x] [Review][Defer] A third `<h2>` on the page compounds the still-open heading-hierarchy gap Story 4.2's review already deferred (three `<h3>` pillar titles sitting directly under Hero's `<h1>` with no `<h2>` in between) [apps/landing/src/components/PresetComparison.tsx:136] — deferred; matches the same "revisit at a systemic a11y audit, not a one-off scope addition" resolution Story 4.2's review already reached for this exact class of issue.

## Project Structure Notes

```text
apps/landing/src/components/PresetComparison.tsx   # new — Landing-local
```

### References

- [Source: planning-artifacts/epics.md#Story 4.3, #UX-DR14] — acceptance criteria, component spec
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — preset-comparison] — layout, border, caption spec
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#4.3 Landing, #FR-10] — preset tool names
- [Source: 4-2-value-pillars.md#Task 4] — fade-up technique this story reuses

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5

### Debug Log References

### Completion Notes List

- **Initial implementation** (pre-review): `PresetComparison.tsx` as a single self-contained React component with one `BEFORE`/`AFTER` image pair against placeholder image paths (no real assets existed yet). Found and fixed a real hydration-race bug live: the server-rendered `<img>`'s native error event fired before `client:load` hydration attached `onError`, so the fallback never actually rendered — fixed with a mount-time `useEffect` checking `img.complete && img.naturalWidth === 0`.
- **Redesigned after code review, directed live by the user**: the user supplied three real phone photos of the same frame (`preset-default.jpg`, `preset-chrome.jpg`, `preset-bw.jpg`, moved into `src/assets/`) and asked for two "split-compare" blocks instead of the original two-separate-bordered-halves layout — each block is a single photo divided by a thin vertical line, left side is the default preset, right side is a named preset (Chrome / B&W), with `data-label` captions per side (`"Default preset"` / `"Chrome preset"` / `"B&W preset"`) positioned above the photo rather than a generic `BEFORE`/`AFTER` caption below it. This resolves the review's `[Decision]` finding but diverges from AC #1's literal wording (two bordered halves, `BEFORE`/`AFTER` caption) — flagged in Review Findings above; AC text itself wasn't changed since that's outside this workflow's editable scope.
- **Split-image mechanism**: both the `before` and `after` photo are absolutely-positioned at full size inside one `overflow-hidden` `aspect-square` frame; the `after` layer is clipped to its right 50% via inline `style={{ clipPath: "inset(0 0 0 50%)" }}` (inline style, not a Tailwind arbitrary-value class — same precedent as `PillarCard`'s `--stagger` custom property) so the two exposures read as one continuous photo. A zero-width `border-l-2 border-dim` div at `left-1/2` renders the visible divider line.
- **Real photography needed image optimization**: the source photos are real iPhone captures (4032×3024, 2.3–6.9MB each) — shipping them unprocessed would have been a real performance problem. Wired Astro's built-in Sharp-based `astro:assets` pipeline (`getImage()` in `index.astro`'s frontmatter, `width: 1200`) to resize/convert to `.webp` at build time, cutting each image to ~170–280KB. This required adding `sharp` as an explicit dependency of `@bmad/landing` (`apps/landing/package.json`) — pnpm's strict per-package resolution meant `sharp`, though already present as `astro`'s own optional dependency elsewhere in the workspace, wasn't resolvable from `apps/landing`'s own module graph without being listed there directly; `astro build` failed with `MissingSharp` until this was added and reinstalled.
- Fade-up: single `scroll-reveal` class on the whole `<section>` (no per-half stagger) — Dev Notes explicitly allowed either option for this "one section, not 3 cards" case.
- Applied all 3 `[Review][Patch]` findings from the code review (see Review Findings above): fallback text now clipped by the split-frame's own `overflow-hidden` (no separate guard needed after the redesign), dropped the redundant `role="img"`/`aria-label` pair (the fallback is a plain text node), added `loading="lazy"` to both `<img>` elements.
- turbo lint/build clean (10/10 full monorepo, forced no-cache); turbo test 113/113 (Gallery's suite, unaffected — Landing has no unit tests, matching Stories 4.1/4.2 precedent). Live-verified via headless Playwright against the rebuilt production output at each iteration: real photos load with zero console errors/404s, split divider sits at the horizontal midpoint with no ghosting/misalignment, Chrome/B&W halves are visually distinct from the default half, both blocks side-by-side at 1280px / stacked at 390px, labels render above each split photo as directed, `prefers-reduced-motion: reduce` collapses to `opacity: 1` immediately.

### File List

- `apps/landing/src/components/PresetComparison.tsx` (new)
- `apps/landing/src/pages/index.astro` (modified — imports the 3 preset photos, resizes them via `astro:assets` `getImage()`, mounts `PresetComparison` with the resulting URLs)
- `apps/landing/src/assets/preset-default.jpg` (new — real photo, default preset)
- `apps/landing/src/assets/preset-chrome.jpg` (new — real photo, Chrome preset)
- `apps/landing/src/assets/preset-bw.jpg` (new — real photo, B&W preset)
- `apps/landing/package.json` (modified — added `sharp` as an explicit dependency, required for `astro:assets` image optimization to resolve from this workspace package)
- `pnpm-lock.yaml` (modified — `pnpm install` after the `sharp` dependency addition)

## Change Log

- 2026-07-09: Story 4.3 implemented — initial `Preset-comparison` (single before/after image pair against placeholder paths, tone-curve + color-mixer copy) + muted image-load fallback frame + CSS-only scroll-reveal fade-up reused from Story 4.2. Found and fixed a real hydration-race bug where the fallback never rendered in practice with a mount-time `naturalWidth` check. Status → review.
- 2026-07-09: Code review (3-layer adversarial: Blind Hunter, Edge Case Hunter, Acceptance Auditor) — 1 decision, 3 patches, 5 deferred, 4 dismissed as noise. The decision finding (one pair vs. two) was superseded live by the user, who supplied real photography and redirected the design to two split-compare blocks (default vs. Chrome, default vs. B&W) with per-side preset-name labels above each photo, replacing the original two-bordered-halves/`BEFORE`-`AFTER` treatment. All 3 patches applied (fallback overflow now handled by the split-frame's own clipping, redundant `role="img"`/`aria-label` dropped, `loading="lazy"` added). Added `sharp` as an explicit `@bmad/landing` dependency to make Astro's built-in image optimization resolve correctly, shrinking the real photos from 2.3–6.9MB to ~170–280KB webp. turbo lint/build/test clean (10/10 tasks, forced no-cache); live-verified via headless Playwright across every layout iteration. Status → done.
