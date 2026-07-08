import { InfoBox, Panel, Sparkline } from "@bmad/ui";
import { useFilteredPhotos, useUnreadableCount } from "../../store/ingestStore";
import { computeInsights, sortRowsForTrend, type HistogramDimension } from "./aggregations";
import { HistogramBar } from "./HistogramBar";

// Only these 4 dimensions get a trend chart (round-8, 2026-07-08, user
// request) — megapixel/camera lost theirs. Its bar-list still sits in the
// same left `grid-cols-2` column as the charted dimensions above it, with
// the right column simply empty (round-15, 2026-07-08, user correction —
// an earlier attempt widened the bar instead of keeping the same column
// boundary, which the user pointed out with a screenshot: "I meant it stays
// one column at 50 percent, so everything's consistent"), so every Panel's
// label/bar/count columns line up down the whole page regardless of
// whether a chart is present.
const TREND_DIMENSION_KEYS = ["lens", "aperture", "shutter", "iso"];
// Every Panel's bar-list uses the same cell count — they're always in the
// same half-width column now (see above), so the count/percentage-text
// headroom concern that originally set this (round-8 user report) applies
// uniformly.
const BAR_CELLS = 32;

/**
 * Every dimension with any data gets its own full-width `Panel`, stacked
 * exactly as before (round-6 redesign, 2026-07-08, corrected same-day per
 * user feedback — an initial version wrongly split dimensions across two
 * separate panel groups instead of leaving each Panel where it was). A
 * dimension with zero rows renders no Panel at all (round-8, 2026-07-08,
 * user request — previously showed an empty "No data for this batch."
 * Panel).
 *
 * The bar-list (always the left `grid-cols-2` column, even for non-trend
 * dimensions — see `BAR_CELLS`/`TREND_DIMENSION_KEYS` above) always shows
 * every bucket — uncapped. `lens`/`aperture`/`shutter`/`iso`
 * additionally get a small companion `Sparkline` (`packages/ui`) in an even
 * 50/50 `grid-cols-2` split, vertically centered against the bar-list
 * (round-7, user reference screenshot); its series reads left-to-right in
 * ascending natural order via `sortRowsForTrend`, not the bar-list's
 * descending-by-count order — a trend line sorted by count would zig-zag
 * meaninglessly. The chart plots every bucket, uncapped, same as the
 * bar-list (round-11, 2026-07-08, user request superseding round-8/10's
 * top-5-by-share cap and its "// Top 5" eyebrow — both removed, along with
 * `topRowsByShare`/`MAX_ROWS_SHOWN` in `aggregations.ts`, now unused
 * anywhere) — a permanent label row no longer needs to fit under the
 * chart, since each point's bucket label now shows in a small custom tooltip
 * on hover instead (`Sparkline`'s `labels` prop; round-14 replaced its
 * initial native-`title` implementation — the browser's own hover delay/
 * styling read as unresponsive), so there's nothing left
 * to overflow regardless of point count.
 */
function DimensionPanel({ dimension }: { dimension: HistogramDimension }) {
  const isTrend = TREND_DIMENSION_KEYS.includes(dimension.key);
  const barList = (
    <div className="flex flex-col gap-2">
      {dimension.rows.map((row) => (
        <HistogramBar key={row.label} label={row.label} value={row.value} count={row.count} cells={BAR_CELLS} />
      ))}
    </div>
  );

  const trendRows = isTrend ? sortRowsForTrend(dimension.key, dimension.rows) : [];

  return (
    <Panel caption={dimension.caption}>
      <div className="grid grid-cols-2 items-center gap-8">
        {barList}
        {isTrend && (
          <Sparkline
            series={trendRows.map((row) => row.count)}
            labels={trendRows.map((row) => row.label)}
            gradientId={`insights-trend-${dimension.key}`}
            ariaLabel={`${dimension.caption.replace("// ", "")} distribution across ${trendRows.length} bucket${trendRows.length === 1 ? "" : "s"}, from ${trendRows[0]!.label} to ${trendRows[trendRows.length - 1]!.label}`}
          />
        )}
      </div>
    </Panel>
  );
}

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

  const dimensions = computeInsights(filteredPhotos).filter((d) => d.rows.length > 0);

  if (dimensions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-eyebrow text-accent uppercase">// INSIGHTS</p>
        <p className="text-body text-fg">No data for this batch.</p>
      </div>
    );
  }

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
        <div key={dimension.key} className="mt-7">
          <DimensionPanel dimension={dimension} />
        </div>
      ))}
    </div>
  );
}
