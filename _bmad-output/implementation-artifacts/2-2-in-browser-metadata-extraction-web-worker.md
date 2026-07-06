# Story 2.2: In-browser Metadata Extraction (Web Worker)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the builder,
I want my photos' EXIF metadata extracted entirely in my browser via a background worker,
so that parsing doesn't freeze the UI and no data ever leaves my device.

## Acceptance Criteria

1. **Given** a batch of Ingested photo files, **when** they are parsed, **then** `apps/gallery/src/worker` owns all EXIF extraction via a fixed message contract (`progress`/`error`/`complete`), and the main thread never parses EXIF itself (AD-2). [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-2]
2. **Given** the worker's raw output, **when** it is normalized in `apps/gallery/src/worker/normalize.ts`, **then** it produces the `Photo` entity contract (AD-4), with megapixel-mode and camera-facing derivation covered by Vitest unit tests (AD-6). [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4, #AD-6]
3. **Given** a photo with missing or stripped Metadata, **when** it is parsed, **then** it is marked `readable: false` and counted, without crashing the batch parse. [Source: planning-artifacts/epics.md#Story 2.2]
4. **Given** the extraction pipeline runs end-to-end, **when** any file is processed, **then** no network call carries photo bytes or derived `Photo` field values (AD-8, NFR1). [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-8]

## Dev Notes — read this first

This is the most technically dense story in Epic 2. Read AD-2 and AD-4 in `ARCHITECTURE-SPINE.md` in full before starting — this section reconciles two things those two AD sections describe separately but that must work together correctly.

- **Depends on Story 2.1** (the minimal `rawFiles: File[]` store slot this story replaces with the real canonical store).
- **The exact `WorkerMessage` contract is architecture-fixed, don't reinvent it** (quoted verbatim from AD-2; the `Photo` type below is the same fields/types/order as AD-4 but with its inline comments summarized here rather than reproduced verbatim):
  ```typescript
  type WorkerMessage =
    | { type: "progress"; done: number; total: number }
    | { type: "error"; fileName: string }
    | { type: "complete"; photos: Photo[] };
  ```
  and the exact `Photo` entity (AD-4):
  ```typescript
  type Photo = {
    id: string;
    readable: boolean;
    focalLengthMm?: number;
    lensLabel?: string;
    iso?: number;
    apertureF?: number;
    shutterSpeedSec?: number;
    exposureCompEv?: number;
    capturedAt?: string;        // ISO-8601
    megapixelMode?: 12 | 48;
    camera?: "front" | "rear";
    thumbnailUrl: string;
  };
  ```
- **Reconciling AD-2's `complete` message with AD-4's thumbnailUrl timing — this is the subtle part, and it's a genuine looseness in the architecture doc, not just a careful-reading exercise.** AD-2's own TS snippet types `complete.photos` as `Photo[]`, which already requires `thumbnailUrl: string` — but AD-4's prose says that field is created on the main thread, after the worker hands off. Those two don't type-check together as literally written; the interpretation below is the fix, consistent with AD-7's own precedent of correcting a companion doc (EXPERIENCE.md) when an AD resolves an open gap. Worth flagging back to the architect that AD-2's snippet could use the same correction. AD-4 says `thumbnailUrl` is created on the **main thread**, immediately after receiving each photo from the worker, specifically because the worker passes back the underlying `Blob`/`File` (not a URL) — object URLs aren't guaranteed portable across execution contexts, and this matters concretely on mobile Safari, which this project explicitly must support. **Practical implication:** the worker's internal per-photo output before the main thread finishes assembling it is `Omit<Photo, 'thumbnailUrl'> & { blob: Blob }` — the worker posts this shape in its `complete` message, and the main thread (not the worker) does `URL.createObjectURL(blob)` for each entry to produce the final `Photo[]` (with `thumbnailUrl` filled in) that actually goes into the store. Don't create the object URL inside the worker even though `URL.createObjectURL` is technically callable there — that's the exact mistake AD-4 is warning against.
- **`error` messages vs. the final `photos` array are not redundant — both exist for a reason.** `error` messages are a live per-file progress signal (Story 2.3 consumes these for its progress UI). But the final `complete` message's `photos` array must **still contain one entry per input file**, including the unreadable ones (`readable: false`, all optional fields `undefined`) — `useUnreadableCount()` (Task 5) counts by filtering this same canonical array, not a separate error list. Don't drop unreadable files from the array; that would silently undercount them.
- **`readable: false` is reserved for "no usable EXIF/Metadata block at all"** (a whole-photo verdict) — distinct from a single field being individually `undefined` on an otherwise-`readable: true` photo (e.g. a photo with a valid EXIF block but no exposure-compensation tag: `readable: true`, `exposureCompEv: undefined`). Get this distinction right — it's what makes AD-4's per-field percentage rule in Story 2.4 work correctly.
- **`[ASSUMPTION]` Megapixel-mode derivation source:** derive from EXIF's own dimension tags (`PixelXDimension`/`PixelYDimension`, aka `ExifImageWidth`/`ExifImageHeight` depending on how ExifReader names them — confirm exact tag names against the installed ExifReader 4.41.0's own typings/docs at implementation time) rather than decoding the image via `createImageBitmap`. This is a deliberate choice, not an oversight: **browser HEIC decode support is inconsistent** (Safari decodes HEIC natively; Chromium/Firefox generally do not without a WASM decoder), and Lazy Cam — per AD-2 — defaults to HEIC. Reading EXIF byte metadata doesn't require the browser to be able to decode/render the image itself, so it sidesteps that gap entirely; `createImageBitmap` would not reliably work cross-browser for this project's actual source format. Compute `megapixels = (width × height) / 1_000_000`, bucket to the nearest of `{12, 48}` (e.g. threshold at 24MP: `>= 24 → 48`, else `→ 12`) — the exact threshold number isn't given anywhere upstream, this is a reasonable inferred midpoint, flag if wrong. If the dimension tags are absent, leave `megapixelMode` `undefined` for that photo (a per-field gap, not a whole-photo `readable: false`).
- **`[ASSUMPTION]` Camera-facing derivation:** check the EXIF `LensModel` tag's description for the substring `"front"` (case-insensitive) → `"front"`, else → `"rear"` — this matches Apple's own stock-Camera EXIF convention (e.g. `"iPhone 15 Pro front camera 2.69mm f/1.9"` vs `"...back camera..."`), which Lazy Cam (a native iOS app) most plausibly follows, but this is inferred by convention, not documented anywhere in this project's own specs — **flag for confirmation once real Lazy Cam sample files are available**, since Lazy Cam's own EXIF-writing behavior is out of this repo's scope to verify. If `LensModel` is absent, leave `camera` `undefined` (per-field gap).
- **`lensLabel` display value** (e.g. `"24mm"`) — derive from `FocalLength`, formatted to the nearest whole mm with a trailing `mm` unit, matching the Photo-grid-cell badge precedent (`mockups/gallery-browse.html`, Story 3.2's concern, not built here — just keep the format consistent for later reuse).
- **`[ASSUMPTION]` `capturedAt` format/timezone:** EXIF's `DateTimeOriginal` is natively `"YYYY:MM:DD HH:MM:SS"` with **no timezone information** — converting this to the `Photo.capturedAt` ISO-8601 string (AD-4) means treating it as local time with an unknown offset; there's no upstream guidance on whether to store it as a bare local-time ISO string (no `Z`/offset) or assume a offset. Store it as a timezone-naive ISO-8601 string (e.g. `"2026-06-14T18:32:05"`, no `Z`) rather than guessing an offset — this is what hour-of-day bucketing (Story 2.4) needs anyway, and inventing a false UTC offset would be worse than omitting one.
- **PRD FR-6 says "EXIF/XMP"; this story only reads EXIF tags via ExifReader, no XMP fallback.** Likely fine — Lazy Cam is presumed EXIF-only — but not independently confirmed; flag if photos with XMP-only metadata turn up as unexpectedly `readable: false` during testing.
- **This is the first story needing a real Vitest test suite anywhere in the repo** — Story 1.1 only pinned the version and left `turbo test` a no-op for packages without a `test` script. Add an actual Vitest config + test file to `apps/gallery` now.
- **AD-8/NFR1 compliance is procedural here too** (same as Story 2.1): this story introduces no `fetch`/`XHR` call anywhere in the worker or normalization path; verify via the Network tab rather than building a new mechanism.
- **Flag forward to Story 3.2 (Photo Grid, not built here):** since the thumbnail `<img>` will point at a `blob:` URL wrapping the original (possibly HEIC) file bytes, **rendering that thumbnail in a non-Safari browser may fail** (broken image) even though metadata extraction itself works fine cross-browser (per the dimension-tag choice above). This story doesn't need to solve that — it only needs to *not silently assume* HEIC will render everywhere. Surface this explicitly so Story 3.2 doesn't discover it cold.

## Tasks / Subtasks

- [ ] Task 1: Worker skeleton + message contract (AC: #1)
  - [ ] Create `apps/gallery/src/worker/exif-worker.ts`, loaded via Vite's worker import syntax (`new Worker(new URL('./exif-worker.ts', import.meta.url), { type: 'module' })`) from wherever Story 2.1's `ingestFiles` action now lives
  - [ ] Worker receives the `File[]` batch (structured-cloneable, so this just works via `postMessage`), posts one `progress` message per file **attempted** (`{ done, total }` — increment `done` for both successfully-parsed and errored files, so `done` reaches `total` even if some files fail; Story 2.3's progress bar depends on this), one `error` message per file that fails to parse (`{ fileName }`, without throwing/halting the loop), and exactly one `complete` message at the end
  - [ ] `import ExifReader from 'exifreader'` (or the package's actual named export — check 4.41.0's own docs) **only** inside this worker file — never in a main-thread module, per AD-2
- [ ] Task 2: EXIF field extraction (AC: #1, #3)
  - [ ] Per file: read via `ExifReader.load(...)`; extract `FocalLength` (drives `lensLabel`), `LensModel` (drives camera-facing derivation only — not `lensLabel`, see Task 3), `ISOSpeedRatings`/`ISO`, `FNumber`, `ExposureTime`, `ExposureBiasValue`, `DateTimeOriginal`, `PixelXDimension`/`PixelYDimension` — confirm exact tag names against the installed library version
  - [ ] If ExifReader throws or returns no usable EXIF block at all for a file: catch it, post an `error` message for that filename, and produce a `readable: false` entry for it in the eventual `photos` array (all optional fields `undefined`) — never let one bad file abort the batch
- [ ] Task 3: `normalize.ts` — raw ExifReader output → `Photo` (AC: #2, #3)
  - [ ] `apps/gallery/src/worker/normalize.ts` is the **one** place megapixel-mode and camera-facing derivation happens (AD-6) — no other file re-implements this logic
  - [ ] Implement the megapixel-mode bucketing and camera-facing detection exactly as described in Dev Notes, each returning `undefined` (not a guess) when its source tag is missing
  - [ ] Format `lensLabel` from `FocalLength` (nearest whole mm + `"mm"`)
  - [ ] Assign each `Photo` a stable `id` (not derived from filename, per AD-4) — e.g. a per-session incrementing counter or `crypto.randomUUID()`
- [ ] Task 4: Main-thread assembly — `thumbnailUrl` + store commit (AC: #1, #2)
  - [ ] On receiving the worker's `complete` message (shape: `Omit<Photo, 'thumbnailUrl'> & { blob: Blob }` per entry, see Dev Notes), the main thread calls `URL.createObjectURL(blob)` for each entry to produce the final `thumbnailUrl`, then commits the resulting `Photo[]` to the store
  - [ ] Replace Story 2.1's minimal `rawFiles` slot with the real canonical `Photo[]` store (`apps/gallery/src/store`) — the store itself remains not directly exported (AD-3)
- [ ] Task 5: `useReadablePhotos()` / `useUnreadableCount()` selectors only (AC: #2)
  - [ ] Add exactly these two selectors now — `useReadablePhotos()` (`photos.filter(p => p.readable)`) and `useUnreadableCount()` (`photos.filter(p => !p.readable).length`) — both needed by Story 2.4's Insights
  - [ ] **Do not** build `useFacetFilters()`/`useFilteredPhotos()` yet — those belong to Story 3.3 (Browse doesn't exist until Epic 3); building them now would be speculative ahead of need (PRD's SM-C1 counter-metric)
- [ ] Task 6: Vitest setup + AD-6 unit tests (AC: #2)
  - [ ] Add a Vitest config to `apps/gallery` (first real test suite in the repo — Story 1.1 only pinned the version)
  - [ ] Unit-test `normalize.ts`'s megapixel-mode and camera-facing derivation directly (no worker/browser APIs needed for these two pure functions) — cover: a `>=24MP`-dimension input buckets to 48, a `<24MP` input buckets to 12, missing dimension tags → `undefined`; a `LensModel` containing `"front"` → `"front"`, one without → `"rear"`, missing `LensModel` → `undefined`
- [ ] Task 7: Verify (AC: #1, #2, #3, #4)
  - [ ] Parse a batch including at least one file with no EXIF block at all — confirm it ends up `readable: false` in the final array and the batch still completes
  - [ ] Confirm the main thread's own bundle never imports `exifreader` (grep the built main-thread chunk, or just visually confirm the import statement's file location)
  - [ ] Network tab shows zero requests during the whole parse
  - [ ] `turbo test` runs the new Vitest suite and passes

## Project Structure Notes

```text
apps/gallery/src/
  worker/
    exif-worker.ts      # new — owns all EXifReader usage
    normalize.ts         # new — raw → Photo, megapixel/camera derivation (AD-6)
    normalize.test.ts    # new — Vitest unit tests
  store/                 # extended: rawFiles slot (2.1) → real Photo[] store + 2 selectors
```

### References

- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-2] — fixed worker message contract, ExifReader 4.41.0 vs. exifr rationale
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-4] — `Photo` entity shape, `thumbnailUrl` main-thread creation timing and rationale
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-6] — normalization derivation must be unit-tested, single location
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-3] — store-not-exported convention; selector set (only 2 of the eventual 4 built here)
- [Source: architecture/architecture-BMAD/ARCHITECTURE-SPINE.md#AD-8] — no network egress of photo/Metadata
- [Source: planning-artifacts/prds/prd-BMAD/prd.md#FR-6] — field list, "unreadable" concept origin
- [Source: planning-artifacts/epics.md#Story 2.2] — acceptance criteria origin

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
