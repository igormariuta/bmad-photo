export interface SpecProps {
  label: string;
  value: string;
}

/**
 * Gallery-local, single-consumer (PhotoDetailModal) — a label/value metadata
 * row. Label-over-value (rather than side-by-side) reads better in the
 * narrow detail-panel column it lives in.
 */
export function Spec({ label, value }: SpecProps) {
  return (
    <div className="border-b-2 border-dim py-3">
      <div className="text-data-label text-muted2 uppercase">{label}</div>
      <div className="mt-1 text-body text-accent tabular-nums">{value}</div>
    </div>
  );
}
