import { useEffect, useRef, useState, type RefObject } from "react";

interface SplitHalfProps {
  alt: string;
  src: string;
  loaded: boolean;
  onError: () => void;
  /** Right half of the split — clipped to show only its right 50% and
   * positioned above the left (`before`) image, which paints unclipped
   * underneath. */
  isAfter?: boolean;
  imgRef: RefObject<HTMLImageElement | null>;
}

/** One image layer of the split-compare frame. Falls back to a muted
 * placeholder (Dev Notes: `--m-panel` background, visible `alt` text) on
 * load failure instead of the browser's broken-image icon — styled to match
 * `ErrorMessage`'s muted aesthetic, not a reuse of that component. The
 * `<img>` is server-rendered, so its request can fail before `client:load`
 * hydration attaches `onError`; the mount-time `naturalWidth` check in the
 * parent catches that already-failed case, `onError` covers failures after. */
function SplitHalf({ alt, src, loaded, onError, isAfter, imgRef }: SplitHalfProps) {
  if (!loaded) {
    return (
      <div
        className={`absolute inset-y-0 flex items-center justify-center bg-panel p-4 text-center text-caption text-muted ${
          isAfter ? "right-0 w-1/2" : "left-0 w-1/2"
        }`}
      >
        {alt}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      onError={onError}
      className="absolute inset-0 h-full w-full object-cover"
      style={isAfter ? { clipPath: "inset(0 0 0 50%)" } : undefined}
    />
  );
}

interface SplitCompareProps {
  beforeSrc: string;
  beforeLabel: string;
  beforeAlt: string;
  afterSrc: string;
  afterLabel: string;
  afterAlt: string;
}

/** A single photo split down the middle by a vertical divider — left half is
 * the unedited source frame, right half is the same frame with a preset
 * applied. Both images are absolutely stacked at full size; the `after`
 * layer is clipped to its right 50% via `clip-path` so the two halves read
 * as one continuous photo, not two separate crops. Each half is named by its
 * own preset (`beforeLabel`/`afterLabel`, e.g. "Default preset" / "Chrome
 * preset") rather than a generic "BEFORE"/"AFTER" caption. */
function SplitCompare({
  beforeSrc,
  beforeLabel,
  beforeAlt,
  afterSrc,
  afterLabel,
  afterAlt,
}: SplitCompareProps) {
  const [beforeFailed, setBeforeFailed] = useState(false);
  const [afterFailed, setAfterFailed] = useState(false);
  const beforeRef = useRef<HTMLImageElement>(null);
  const afterRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const before = beforeRef.current;
    if (before && before.complete && before.naturalWidth === 0) {
      setBeforeFailed(true);
    }
    const after = afterRef.current;
    if (after && after.complete && after.naturalWidth === 0) {
      setAfterFailed(true);
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-data-label text-muted2 uppercase">{beforeLabel}</span>
        <span className="text-data-label text-muted2 uppercase">{afterLabel}</span>
      </div>
      <div className="relative mt-2 aspect-square w-full overflow-hidden border-2 border-dim">
        <SplitHalf
          alt={beforeAlt}
          src={beforeSrc}
          loaded={!beforeFailed}
          onError={() => setBeforeFailed(true)}
          imgRef={beforeRef}
        />
        <SplitHalf
          alt={afterAlt}
          src={afterSrc}
          loaded={!afterFailed}
          onError={() => setAfterFailed(true)}
          isAfter
          imgRef={afterRef}
        />
        <div className="absolute inset-y-0 left-1/2 border-l-2 border-dim" />
      </div>
    </div>
  );
}

export interface PresetComparisonProps {
  /** Unedited source frame, shared as the "before" half of both blocks below. */
  beforeSrc: string;
  /** Same frame with the Chrome preset applied. */
  chromeSrc: string;
  /** Same frame with the B&W preset applied. */
  bwSrc: string;
}

/** Landing-only (FR-2): two split-compare blocks demonstrating the preset
 * system on the same source frame — a Chrome preset and a B&W preset, both
 * built from shadow/highlight tone curves plus a Lightroom-style per-color
 * mixer. Wrapped in the same CSS-only scroll-reveal fade-up as Pillar-card
 * (Story 4.2) — a single fade for the whole section, since two static blocks
 * don't need the per-card stagger three Pillars did. */
export function PresetComparison({ beforeSrc, chromeSrc, bwSrc }: PresetComparisonProps) {
  return (
    <section className="scroll-reveal border-t-2 border-dim px-gutter py-section-rhythm">
      <div className="mx-auto max-w-container-max">
        <p className="text-eyebrow text-accent uppercase">// Presets</p>
        <h3 className="mt-6 font-display text-h3 text-fg">Shape it, don&rsquo;t just filter it.</h3>
        <p className="mt-4 max-w-2xl text-body text-muted">
          Shadow-to-highlight tone curves reshape contrast without crushing detail. A
          Lightroom-style per-color mixer mutes or boosts individual hues and shifts them
          independently &mdash; push yellow toward orange, pull green toward teal &mdash;
          without touching the rest of the frame.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-item-gap md:grid-cols-2">
          <SplitCompare
            beforeSrc={beforeSrc}
            beforeLabel="Default preset"
            beforeAlt="Unedited source frame"
            afterSrc={chromeSrc}
            afterLabel="Chrome preset"
            afterAlt="Same frame with the Chrome preset applied"
          />
          <SplitCompare
            beforeSrc={beforeSrc}
            beforeLabel="Default preset"
            beforeAlt="Unedited source frame"
            afterSrc={bwSrc}
            afterLabel="B&W preset"
            afterAlt="Same frame with the B&W preset applied"
          />
        </div>
      </div>
    </section>
  );
}
