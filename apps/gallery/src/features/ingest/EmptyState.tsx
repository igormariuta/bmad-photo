import { useRef, useState, type ChangeEvent } from "react";
import { Button, InfoBox } from "@bmad/ui";
import { ingestPhotos } from "./ingestPhotos";

const MAX_PHOTOS_PER_INGEST = 100;

/**
 * First-run screen: no Ingested photos yet. No header/tabs/panel chrome
 * renders alongside this — app-shell gates on fileCount === 0.
 */
export function EmptyState() {
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddPhotosClick() {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    // Client-side count check, synchronous, before any file reaches the
    // worker (AD-2): an over-cap batch must never be posted to it.
    if (files.length > MAX_PHOTOS_PER_INGEST) {
      setLimitMessage(`Pick ${MAX_PHOTOS_PER_INGEST} photos or fewer.`);
      event.target.value = "";
      return;
    }

    setLimitMessage(null);
    ingestPhotos(Array.from(files));
    // Reset so re-selecting the exact same file(s) still fires a change event.
    event.target.value = "";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center">
      <p className="text-eyebrow text-accent uppercase">// EXIF GALLERY</p>
      <h1 className="font-display text-h1 text-fg">
        See how you
        <br />
        actually shoot.
      </h1>
      <p className="text-body text-fg">Nothing uploads. Nothing&rsquo;s stored.</p>
      <Button type="button" onClick={handleAddPhotosClick}>
        Add photos
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <p className="max-w-xs text-caption text-muted">
        Reads EXIF entirely in your browser — focal length, ISO, shutter, time of day. Close the
        tab and it&rsquo;s gone.
      </p>
      <div role="alert">
        {limitMessage && <InfoBox tone="danger">{limitMessage}</InfoBox>}
      </div>
    </div>
  );
}
