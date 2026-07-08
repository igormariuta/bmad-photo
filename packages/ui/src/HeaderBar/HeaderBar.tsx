import type { ReactNode } from "react";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";

export interface HeaderBarProps {
  /** Plain-colored portion of the wordmark, e.g. `"EXIF "` or `"LAZY "`. */
  wordmark: string;
  /** Accent-colored portion of the wordmark, e.g. `"GALLERY"` or `"CAM"`. */
  wordmarkAccent: string;
  /** Renders between the wordmark and the theme toggle. Empty by default — Landing (Story 4.1) passes nothing; Story 2.5's persistent "Add more" trigger is the first real consumer. */
  actions?: ReactNode;
}

/** Minimal fixed 64px bar: wordmark left, theme toggle right, no nav links —
 * there is nowhere else in either app to point. */
export function HeaderBar({ wordmark, wordmarkAccent, actions }: HeaderBarProps) {
  return (
    <header className="flex h-header-height items-center justify-between border-b-2 border-line bg-bg px-gutter">
      <span className="font-display text-h3 font-bold text-fg">
        {wordmark}
        <span className="text-accent">{wordmarkAccent}</span>
      </span>
      <div className="flex items-center gap-4">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
