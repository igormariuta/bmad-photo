import { HeaderBar } from "@bmad/ui";
import { AddMoreControl } from "../features/ingest/AddMoreControl";
import { EmptyState } from "../features/ingest/EmptyState";
import { IngestProgress } from "../features/ingest/IngestProgress";
import { Insights } from "../features/insights/Insights";
import { useHasCommittedOnce, useIngestedFileCount, useIsIngestComplete } from "../store/ingestStore";

export function App() {
  const ingestedFileCount = useIngestedFileCount();
  const ingestComplete = useIsIngestComplete();
  const hasCommittedOnce = useHasCommittedOnce();

  if (ingestedFileCount === 0) {
    return <EmptyState />;
  }

  // The very first Ingest still takes over the full screen (Story 2.3); only
  // a later "Add more" batch keeps the persistent Header-bar visible while it
  // parses (Dev Notes' [ASSUMPTION] — Insights is what's temporarily swapped).
  if (!ingestComplete && !hasCommittedOnce) {
    return <IngestProgress />;
  }

  return (
    <>
      <HeaderBar wordmark="EXIF " wordmarkAccent="GALLERY" actions={<AddMoreControl />} />
      {ingestComplete ? <Insights /> : <IngestProgress />}
    </>
  );
}
