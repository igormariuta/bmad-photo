import { useRef, useState, type ChangeEvent } from "react";
import { Button, InfoBox } from "@bmad/ui";
import { checkAddMore, useIsIngestComplete } from "../../store/ingestStore";
import { ingestPhotos } from "./ingestPhotos";

/**
 * Persistent Header-bar "Add photos" trigger (AC #1) — passed into
 * Header-bar's `actions` slot (added in Story 2.4 for this). Dedupes and
 * cap-checks (AD-7) before any file reaches the worker; exact duplicates are
 * dropped silently, a would-exceed-cap selection is rejected wholesale.
 *
 * Disabled while a batch is already parsing (`!ingestComplete`) — otherwise a
 * second "Add more" dispatched before the first one commits reads stale
 * `fileCount`/`signatures` (the in-flight batch hasn't landed in the store
 * yet), letting the cap check and dedup both be bypassed.
 */
export function AddMoreControl() {
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ingestComplete = useIsIngestComplete();

  function handleAddPhotosClick() {
    setLimitMessage(null);
    fileInputRef.current?.click();
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    // `files` is captured as a plain array before the input reset below —
    // `input.files` is live and would otherwise go empty the moment
    // `value` is cleared, since it's the same FileList reference.
    const selected = Array.from(files);
    // Reset so re-selecting the exact same file(s) still fires a change event.
    event.target.value = "";

    const { accepted, rejectionMessage } = checkAddMore(selected);

    if (rejectionMessage) {
      setLimitMessage(rejectionMessage);
      return;
    }

    setLimitMessage(null);

    if (accepted.length === 0) {
      // Every selected file was an exact duplicate of one already Ingested —
      // silently dropped, no message, no worker dispatch (AD-7).
      return;
    }

    ingestPhotos(accepted);
  }

  return (
    <div className="relative">
      <Button type="button" onClick={handleAddPhotosClick} disabled={!ingestComplete}>
        Add photos
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={!ingestComplete}
        onChange={handleFilesSelected}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div role="alert" className="absolute right-0 top-full z-10 mt-2 w-72">
        {limitMessage && <InfoBox tone="danger">{limitMessage}</InfoBox>}
      </div>
    </div>
  );
}
