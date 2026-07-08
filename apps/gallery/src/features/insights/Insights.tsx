import { InfoBox, Panel } from "@bmad/ui";
import { useReadablePhotos, useUnreadableCount } from "../../store/ingestStore";
import { computeInsights } from "./aggregations";
import { HistogramBar } from "./HistogramBar";

/**
 * Renders once Ingest completes (app-shell's 3-way gate) — the single view,
 * no facet-panel/filter UI (that's Browse's, Epic 3). Reads only through
 * useReadablePhotos()/useUnreadableCount() (AD-3) so it recomputes
 * automatically whenever the store changes (AC #3) — no manual trigger.
 */
export function Insights() {
  const readablePhotos = useReadablePhotos();
  const unreadableCount = useUnreadableCount();

  if (readablePhotos.length === 0) {
    // Every Ingested photo was unreadable — a valid informative outcome
    // (AC #5), not an error: no ErrorMessage, no error styling.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-eyebrow text-accent uppercase">// INSIGHTS</p>
        <p className="text-body text-fg">
          {unreadableCount} unreadable — no photos in this Ingest had usable metadata.
        </p>
      </div>
    );
  }

  const dimensions = computeInsights(readablePhotos);

  return (
    <div className="mx-auto max-w-article-max px-gutter py-8">
      <p className="text-eyebrow text-accent uppercase">// INSIGHTS</p>
      <p className="mt-4 text-body text-muted">
        Aggregate statistics across all {readablePhotos.length} readable photos in this Ingest —
        pure numbers, no filtering here.
      </p>
      {unreadableCount > 0 && (
        <InfoBox className="mt-5">
          {unreadableCount} unreadable — excluded from the numbers below.
        </InfoBox>
      )}
      {dimensions.map((dimension) => (
        <Panel key={dimension.key} caption={dimension.caption} className="mt-7">
          {dimension.rows.length === 0 ? (
            <p className="text-caption text-muted">No data for this batch.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {dimension.rows.map((row) => (
                <HistogramBar key={row.label} label={row.label} value={row.value} count={row.count} />
              ))}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}
