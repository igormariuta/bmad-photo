import { HeaderBar } from "@bmad/ui";
import { EmptyState } from "../features/ingest/EmptyState";
import { IngestProgress } from "../features/ingest/IngestProgress";
import { Insights } from "../features/insights/Insights";
import { useIngestedFileCount, useIsIngestComplete } from "../store/ingestStore";

export function App() {
  const ingestedFileCount = useIngestedFileCount();
  const ingestComplete = useIsIngestComplete();

  if (ingestedFileCount === 0) {
    return <EmptyState />;
  }

  if (!ingestComplete) {
    return <IngestProgress />;
  }

  return (
    <>
      <HeaderBar wordmark="EXIF " wordmarkAccent="GALLERY" />
      <Insights />
    </>
  );
}
