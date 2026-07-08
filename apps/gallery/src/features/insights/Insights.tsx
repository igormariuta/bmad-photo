import { InfoBox, Panel } from "@bmad/ui";
import { useFilteredPhotos, useUnreadableCount } from "../../store/ingestStore";
import { computeInsights } from "./aggregations";
import { HistogramBar } from "./HistogramBar";

/**
 * Renders once Ingest completes (app-shell's 3-way gate). Facet filters are
 * global (dev-story fix-up 2026-07-08, superseding Story 3.1/3.3's original
 * "Insights always shows the full readable set" design) — reads through
 * useFilteredPhotos() so its numbers narrow along with Browse's grid.
 * useUnreadableCount() stays against the raw ingested batch — unreadable
 * photos have no facet fields to filter on regardless of Facet-panel state.
 */
export function Insights() {
  const filteredPhotos = useFilteredPhotos();
  const unreadableCount = useUnreadableCount();

  if (filteredPhotos.length === 0) {
    // Could be "every Ingested photo was unreadable" or "the active Facet
    // filters matched nothing" — the message below is worded to stay true
    // either way rather than assuming a cause.
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-eyebrow text-accent uppercase">// INSIGHTS</p>
        <p className="text-body text-fg">
          No matching photos.
          {unreadableCount > 0 && ` ${unreadableCount} unreadable — always excluded.`}
        </p>
      </div>
    );
  }

  const dimensions = computeInsights(filteredPhotos);

  return (
    <div>
      <p className="text-eyebrow text-accent uppercase">// INSIGHTS</p>
      <p className="mt-4 text-body text-muted">
        Aggregate statistics across {filteredPhotos.length} matching photo
        {filteredPhotos.length === 1 ? "" : "s"} — updates live with the Facet-panel.
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
