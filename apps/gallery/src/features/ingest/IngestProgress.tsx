import { StatBar } from "@bmad/ui";
import { useIngestProgress } from "../../store/ingestStore";

/**
 * Renders while a batch is being parsed in the worker. No close/cancel
 * affordance renders here at all (not a disabled one) — this story doesn't
 * add any code path off this screen; Story 2.4's Insights view is what
 * eventually replaces it once Ingest completes (AC #3).
 */
export function IngestProgress() {
  const { done, total } = useIngestProgress();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center">
      <div aria-live="polite">
        <StatBar
          label={`Parsing ${done}/${total}`}
          value={(done / total) * 100}
          cells={48}
          lowThreshold={0}
        />
      </div>
    </div>
  );
}
