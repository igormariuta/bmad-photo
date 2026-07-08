export interface HistogramBarProps {
  /** Bucket name, e.g. "24mm" or "100–400". */
  label: string;
  /** 0-100 share within this dimension. */
  value: number;
  /** Raw count backing `value`, shown alongside the percentage. */
  count: number;
  cells?: number;
  className?: string;
}

/**
 * Extends StatBar's (packages/ui) block-cell visual language with a
 * right-aligned count — Insights needs both, unlike the generic StatBar.
 * Kept Gallery-local (not packages/ui): Insights is its only consumer
 * anywhere in this project.
 */
export function HistogramBar({ label, value, count, cells = 48, className = "" }: HistogramBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const filled = Math.round((pct / 100) * cells);

  return (
    <div
      className={`grid h-5 items-center gap-3 rounded ${className}`}
      style={{ gridTemplateColumns: "72px 1fr auto" }}
    >
      <span className="truncate text-data-label text-muted2 uppercase">{label}</span>
      <span
        role="img"
        aria-label={`${label}: ${pct}% of ${count} photo${count === 1 ? "" : "s"}`}
        className="flex h-5 items-center gap-px"
      >
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-3 w-1 flex-none ${i < filled ? "bg-accent" : "bg-dim"}`}
          />
        ))}
      </span>
      <span className="text-caption leading-none text-accent tabular-nums">
        {count} · {pct}%
      </span>
    </div>
  );
}
