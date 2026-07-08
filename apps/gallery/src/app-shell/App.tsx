import { useState } from "react";
import { HeaderBar, UnderlineTabs, type UnderlineTabItem } from "@bmad/ui";
import { Browse } from "../features/browse/Browse";
import { AddMoreControl } from "../features/ingest/AddMoreControl";
import { EmptyState } from "../features/ingest/EmptyState";
import { IngestProgress } from "../features/ingest/IngestProgress";
import { Insights } from "../features/insights/Insights";
import { useHasCommittedOnce, useIngestedFileCount, useIsIngestComplete } from "../store/ingestStore";

type GalleryTabId = "insights" | "browse";

const GALLERY_TABS: UnderlineTabItem[] = [
  { id: "insights", label: "Insights" },
  { id: "browse", label: "Browse" },
];

export function App() {
  const ingestedFileCount = useIngestedFileCount();
  const ingestComplete = useIsIngestComplete();
  const hasCommittedOnce = useHasCommittedOnce();
  const [currentTab, setCurrentTab] = useState<GalleryTabId>("insights");

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
    <div className="flex h-screen flex-col">
      <HeaderBar wordmark="EXIF " wordmarkAccent="GALLERY" actions={<AddMoreControl />} />
      {ingestComplete ? (
        <>
          <UnderlineTabs
            ariaLabel="Gallery views"
            current={currentTab}
            onSelect={(id) => setCurrentTab(id as GalleryTabId)}
            tabs={GALLERY_TABS}
            className="px-gutter"
          />
          {/* Both panels stay mounted at all times (no client-side router
           * exists) — only the inactive one is visually hidden, via its own
           * scrollable region, so switching tabs never resets its scroll
           * position (AC #2). */}
          <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel" hidden={currentTab !== "insights"}>
            <Insights />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel" hidden={currentTab !== "browse"}>
            <Browse />
          </div>
        </>
      ) : (
        <IngestProgress />
      )}
    </div>
  );
}
