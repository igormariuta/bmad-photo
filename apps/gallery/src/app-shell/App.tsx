import { Loading } from "@bmad/ui";
import { EmptyState } from "../features/ingest/EmptyState";
import { useIngestedFileCount } from "../store/ingestStore";

export function App() {
  const ingestedFileCount = useIngestedFileCount();

  if (ingestedFileCount > 0) {
    // Transitional placeholder only: Story 2.2 replaces "store raw files"
    // with the real worker pipeline producing Photo[], and Story 2.3
    // replaces this block Loading with the real determinate StatBar
    // progress UI. Not a forgotten feature — see Dev Notes on Story 2.1.
    return <Loading />;
  }

  return <EmptyState />;
}
