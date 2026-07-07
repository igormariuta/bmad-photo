import { EmptyState } from "../features/ingest/EmptyState";
import { IngestProgress } from "../features/ingest/IngestProgress";
import { useIngestedFileCount } from "../store/ingestStore";

export function App() {
  const ingestedFileCount = useIngestedFileCount();

  if (ingestedFileCount > 0) {
    return <IngestProgress />;
  }

  return <EmptyState />;
}
