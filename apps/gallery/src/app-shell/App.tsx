import { useState } from "react";
import { HeaderBar, UnderlineTabs, type UnderlineTabItem } from "@bmad/ui";
import { Browse } from "../features/browse/Browse";
import { FacetPanel } from "../features/browse/FacetPanel";
import { AddMoreControl } from "../features/ingest/AddMoreControl";
import { EmptyState } from "../features/ingest/EmptyState";
import { IngestProgress } from "../features/ingest/IngestProgress";
import { Insights } from "../features/insights/Insights";
import { useHasCommittedOnce, useIngestedFileCount, useIsIngestComplete } from "../store/ingestStore";

type GalleryTabId = "browse" | "insights";

// Browse first — photos are the primary thing a user wants to see;
// Insights is a bonus (user direction, 2026-07-08).
const GALLERY_TABS: UnderlineTabItem[] = [
  { id: "browse", label: "Browse" },
  { id: "insights", label: "Insights" },
];

export function App() {
  const ingestedFileCount = useIngestedFileCount();
  const ingestComplete = useIsIngestComplete();
  const hasCommittedOnce = useHasCommittedOnce();
  const [currentTab, setCurrentTab] = useState<GalleryTabId>("browse");

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
        // Single page-level scroll region (UX fix, 2026-07-08 — previously
        // the sidebar and each tab panel each had their own independent
        // overflow-y-auto, producing two/three visible scrollbars at once).
        // Trade-off: switching tabs no longer preserves each tab's own
        // scroll position independently (Story 3.1's original AC #2) since
        // there's one shared scroll position now — accepted deliberately,
        // same as the AD-3/AC #5 reversal above.
        <div className="mx-auto flex min-h-0 w-full max-w-container-max flex-1 flex-col gap-10 overflow-y-auto px-gutter py-8 lg:flex-row">
          {/* Facet-panel is global (dev-story fix-up, 2026-07-08) — one
           * persistent instance to the left of both tabs, filtering
           * Browse's grid and Insights' aggregate numbers alike. Desktop
           * only for now (mobile slide-up sheet deferred — see
           * deferred-work.md). */}
          <aside
            aria-label="Facets"
            className="hidden flex-none border-2 border-dim bg-panel p-card-padding lg:block lg:w-sidebar-width"
          >
            <FacetPanel />
          </aside>
          <div className="flex min-w-0 flex-1 flex-col gap-7">
            <UnderlineTabs
              ariaLabel="Gallery views"
              current={currentTab}
              onSelect={(id) => setCurrentTab(id as GalleryTabId)}
              tabs={GALLERY_TABS}
            />
            {/* Both panels stay mounted at all times (no client-side router
             * exists) — only the inactive one is visually hidden. */}
            <div role="tabpanel" hidden={currentTab !== "browse"}>
              <Browse />
            </div>
            <div role="tabpanel" hidden={currentTab !== "insights"}>
              <Insights />
            </div>
          </div>
        </div>
      ) : (
        <IngestProgress />
      )}
    </div>
  );
}
