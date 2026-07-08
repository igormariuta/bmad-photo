export interface StatBarProps {
  label: string;
  value: number;
  cells: number;
  /** Below this percentage the fill flips to the error color. Chosen since generic StatBar
   * reuse might linger there; Story 2.3's ingest progress only rises, so it rarely matters. */
  lowThreshold?: number;
  className?: string;
}

/** Rendered as real cell elements (not `█`/`░` text glyphs) — different monospace fonts paint
 * a full block glyph with more visual ink than a light-shade glyph even at an identical
 * line-height/box height, which read as "the fill is taller than the row" despite both being
 * geometrically the same size. Fixed-size boxes side-step font rendering entirely. */
export function StatBar({ label, value, cells, lowThreshold = 10, className = "" }: StatBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  // Rounded once and reused for both the fill count and the displayed/announced
  // percentage (round-5 bug fix, 2026-07-08) — `value` is often a raw division
  // (e.g. done/total * 100) that rarely lands on a whole number, and the text
  // previously rendered that unrounded value verbatim (e.g. "83.33333333333333%").
  const displayPct = Math.round(pct);
  const filled = Math.round((pct / 100) * cells);
  const critical = pct < lowThreshold;
  const fillClassName = critical ? "bg-error" : "bg-accent";
  const textClassName = critical ? "text-error" : "text-accent";

  return (
    <div
      className={`grid items-center gap-4 ${className}`}
      style={{ gridTemplateColumns: "7rem 1fr auto" }}
    >
      <span className="text-eyebrow text-muted2 uppercase">{label}</span>
      <span
        role="progressbar"
        aria-label={label}
        aria-valuenow={displayPct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex h-3 items-center gap-px"
      >
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-3 w-1 flex-none ${i < filled ? fillClassName : "bg-dim"}`}
          />
        ))}
      </span>
      <span className={`text-caption leading-none tabular-nums ${textClassName}`}>{displayPct}%</span>
    </div>
  );
}
