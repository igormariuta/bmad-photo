import { useRef, useState, type ChangeEvent } from "react";
import { Button, InfoBox } from "@bmad/ui";
import { MAX_PHOTOS_PER_INGEST } from "../../store/ingestStore";
import { ingestPhotos, isImageFile } from "./ingestPhotos";

/**
 * First-run screen: no Ingested photos yet. No header/tabs/panel chrome
 * renders alongside this — app-shell gates on fileCount === 0.
 */
export function EmptyState() {
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  function handleAddPhotosClick() {
    fileInputRef.current?.click();
  }

  function handleAddFolderClick() {
    folderInputRef.current?.click();
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    // Folder picks hand back every file in the tree, including non-image junk the input's own
    // `accept` can't filter out for a directory selection — drop those before the cap check.
    // Must copy to a plain array (`Array.from`) *before* resetting `event.target.value` below —
    // `event.target.files` is a live FileList tied to the input, and resetting `value` clears it
    // out from under any reference still pointing at it (round-22 regression, 2026-07-08 — this
    // exact gotcha is already documented in AddMoreControl.tsx's own handler, which orders these
    // two steps correctly; this one didn't, and both "Add photos" and "Add folder" silently did
    // nothing as a result).
    const images = Array.from(files).filter(isImageFile);
    event.target.value = "";
    if (images.length === 0) {
      return;
    }

    // Client-side count check, synchronous, before any file reaches the
    // worker (AD-2): an over-cap batch must never be posted to it.
    if (images.length > MAX_PHOTOS_PER_INGEST) {
      setLimitMessage(`Pick ${MAX_PHOTOS_PER_INGEST} photos or fewer.`);
      return;
    }

    setLimitMessage(null);
    ingestPhotos(images);
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
      <div className="flex gap-3">
        <Button type="button" onClick={handleAddPhotosClick}>
          Add photos
        </Button>
        <Button type="button" variant="outline" onClick={handleAddFolderClick}>
          Add folder
        </Button>
      </div>
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
      {/* `webkitdirectory` (non-standard, no JSX prop) is set imperatively on mount — lets the
       * user pick a whole folder (or, one "Add folder" click at a time, several) instead of
       * hand-selecting every file inside it (round-22, 2026-07-08, user request). */}
      <input
        ref={(el) => {
          folderInputRef.current = el;
          if (el) el.webkitdirectory = true;
        }}
        type="file"
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
