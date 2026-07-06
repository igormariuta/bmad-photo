# Story 2.1: Empty State & Client-side Photo Ingest

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder (primary user),
I want to open the Gallery and select a batch of photos from my device,
so that I can begin analyzing my shooting habits without any account or upload step.

## Acceptance Criteria

1. **Given** the Gallery is opened with no photos yet Ingested, **when** the app renders, **then** the empty-state shows the privacy promise and a single "Add photos" button, with no header/tabs/panel chrome visible. [Source: planning-artifacts/epics.md#Story 2.1]
2. **Given** the empty-state, **when** the user taps "Add photos", **then** the native photo picker opens (mobile: phone photo library; desktop: file picker), and multiple photos can be selected in one action; **and** no network request carries photo bytes or Metadata (verifiable in the network inspector, per NFR1). [Source: planning-artifacts/epics.md#Story 2.1]
3. **Given** a first-Ingest selection, **when** the selection exceeds 100 photos, **then** the action is rejected with a message stating the limit, before any file reaches the worker. [Source: planning-artifacts/epics.md#Story 2.1]
4. **Given** the empty-state's privacy-promise copy, **when** it is written, **then** it follows the plain, non-editorializing voice/tone contract (e.g. "Nothing uploads. Nothing's stored.") — no marketing fluff or exclamation-point energy. [Source: planning-artifacts/epics.md#Story 2.1]

## Dev Notes — read this first

**This is Epic 2's first story — it deliberately does not deliver a complete end-to-end flow.** The EXIF worker doesn't exist until Story 2.2, the progress UI is Story 2.3, and the Insights dashboard is Story 2.4. This story's honest scope is: the empty-state screen, the native picker, and the ≤100 cap check on the *first* Ingest only (cumulative-cap-across-actions and dedup are explicitly Story 2.5's job, not this one, since the store starts empty here — there's nothing yet to dedupe against).

- **Depends on Epic 1 fully implemented** (`packages/theme`, `packages/ui`'s `Button`, `Loading`, `InfoBox`). Uses `apps/gallery/src/app-shell/`, `features/ingest/`, and `store/` — all placeholder folders from Story 1.1's structural seed, now getting their first real content.
- **What happens after a valid (≤100) selection, given the worker doesn't exist yet:** store the raw `File[]` in a minimal Zustand store slot and render `packages/ui`'s `Loading` (block form, from Story 1.5) as a transitional placeholder. This is intentionally a stub — Story 2.2 replaces "store raw files" with the real worker pipeline producing `Photo[]`, and Story 2.3 replaces this `Loading` placeholder with the real determinate `StatBar` progress UI. Note this explicitly in code comments so it isn't mistaken for a forgotten feature by whoever picks up Story 2.2.
- **Chrome-gating for this story only needs two states, not three:** empty-state (nothing ingested) vs. the transitional placeholder (a valid selection was made). There is no header/tabs/Insights view to gate yet — `Header-bar` itself isn't built by any Epic 1 story (checked: it's absent from both Story 1.4's and 1.5's inherited-component lists, since DESIGN.md marks it "New") and Story 2.4 is the first place it's actually required, so building it here would be premature. `app-shell`'s job in this story is only: `photosSelected ? <TransitionalPlaceholder /> : <EmptyState />`.
- **Minimal store shape needed now (extended by Story 2.2, not finalized here):** something like `{ rawFiles: File[] }` with an `ingestFiles(files: File[])` action. Story 2.2 is what introduces the real canonical `Photo[]` + the `useReadablePhotos`/`useUnreadableCount`/`useFacetFilters`/`useFilteredPhotos` selectors from AD-3 — don't build those selectors here, there's no `Photo` data yet to select over.
- **Native picker mechanics:** a plain `<input type="file" accept="image/*" multiple>` — **no** `capture` attribute (that would force the camera instead of offering the photo library/file picker choice). This is what gives mobile Safari its native photo-library picker and desktop browsers their native file picker, with zero custom UI needed for the picker itself.
- **The 100-cap check is purely a client-side count of the selected `FileList`**, done synchronously in the input's `onChange` handler, before anything is written to the store or dispatched anywhere — there is no worker yet in this story for the check to precede, but the same "validate before dispatch" principle carries forward once Story 2.2 adds one.
- **NFR1 verification is procedural, not code:** since this story adds no `fetch`/`XHR` call anywhere, the "no network request carries photo bytes" AC is satisfied by omission — verify with the browser's Network tab as a manual check, not a new mechanism to build.

## Tasks / Subtasks

- [ ] Task 1: Minimal Ingest store slot (AC: #2, #3)
  - [ ] In `apps/gallery/src/store/`, add a Zustand store holding `rawFiles: File[]` and an `ingestFiles(files: File[]): void` action that replaces `rawFiles` (first-Ingest only — no append/dedupe logic yet, that's Story 2.5)
  - [ ] Do not export the raw store directly (AD-3 convention, applies even to this minimal shape) — export a small hook (e.g. `useIngestedFileCount()`) for whatever needs to read it in this story
- [ ] Task 2: Empty-state screen (AC: #1, #4)
  - [ ] Build in `apps/gallery/src/features/ingest/` (per Story 1.1's structural seed): full-screen centered layout — eyebrow, H1, one-line privacy-promise body copy, single primary `Button` (from `packages/ui`, Story 1.4) labeled "Add photos", plus a smaller sub-line below the button
  - [ ] **Copy is now confirmed by the real mockup (`mockups/gallery-empty-state.html`), not a drafted approximation — use it verbatim:** eyebrow `"// EXIF GALLERY"`; H1 `"See how you actually shoot."` (rendered on two lines in the mockup); privacy-promise body `"Nothing uploads. Nothing's stored."`; button `"Add photos"`; sub-line below the button: `"Reads EXIF entirely in your browser — focal length, ISO, shutter, time of day. Close the tab and it's gone."`
  - [ ] No header/tabs/panel chrome renders alongside this screen (Dev Notes: `app-shell` gates on `rawFiles.length === 0`)
- [ ] Task 3: Native picker + cap check (AC: #2, #3)
  - [ ] Wire the "Add photos" `Button` to a hidden `<input type="file" accept="image/*" multiple>` (a real `<button>` triggering a visually-hidden file input's native picker is the standard accessible pattern — don't rely on styling the raw `<input>` itself)
  - [ ] In the input's `onChange`: if `event.target.files.length > 100`, reject — render the limit message (plain phrasing, e.g. *"Pick 100 photos or fewer."*) in `packages/ui`'s `InfoBox` (Story 1.5) rather than inventing new markup for it; this is an informational limit notice, not a form validation error, so `InfoBox` fits better than `FieldError`/`ErrorMessage`. Do **not** call `ingestFiles` at all
  - [ ] If `event.target.files.length <= 100`, call `ingestFiles(Array.from(event.target.files))`
- [ ] Task 4: Transitional post-selection placeholder (AC: #2)
  - [ ] `app-shell` renders `packages/ui`'s `Loading` (block form) when `rawFiles.length > 0` — this is intentionally temporary, see Dev Notes; leave a code comment pointing at Story 2.2/2.3 as the stories that replace it
- [ ] Task 5: Verify (AC: #1, #2, #3, #4)
  - [ ] Empty-state renders with no chrome on first load
  - [ ] Selecting ≤100 photos transitions to the placeholder, no network requests fire (check DevTools Network tab)
  - [ ] Selecting >100 photos shows the limit message and does not transition away from the empty-state
  - [ ] Copy review: privacy-promise line reads as a plain statement of fact, not marketing copy

## Project Structure Notes

```text
apps/gallery/src/
  app-shell/          # gains: empty-state vs. placeholder gating logic
  features/ingest/    # gains: empty-state screen, picker wiring, cap-check message
  store/              # gains: minimal rawFiles slot (extended by Story 2.2)
```

No new packages/apps; no changes to `packages/ui`/`packages/theme` in this story.

### References

- [Source: planning-artifacts/epics.md#Story 2.1] — acceptance criteria origin, exact privacy-copy example
- [Source: planning-artifacts/epics.md#Epic 2 intro] — "In this epic, Browse does not yet exist... no dead/unreachable navigation" (confirms the intentionally transitional nature of intermediate story states)
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-3] — store-not-exported-directly convention, applied even to this minimal shape
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-7] — first-Ingest vs. cumulative-cap distinction (this story is first-Ingest only)
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#NFR1, #NFR2] — privacy (no network egress) and Ingest cap origin
- [Source: ux-designs/ux-BMAD/DESIGN.md#Components — empty-state] — full-screen centered layout spec
- [Source: ux-designs/ux-BMAD/mockups/gallery-empty-state.html] — confirmed final copy (eyebrow, H1, privacy line, button, sub-line)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
