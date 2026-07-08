import type { ReactNode } from "react";

export type PanelTone = "accent" | "muted";

export interface PanelProps {
  caption: string;
  /** Defaults to 'accent' — the caption color most Panel consumers want. */
  tone?: PanelTone;
  /** Defaults to false — the real Insights mockup shows card chrome with no
   * border; Story 4.2's Pillar-card is the consumer that opts into one. */
  bordered?: boolean;
  children: ReactNode;
  className?: string;
}

const TONE_CLASS_NAME: Record<PanelTone, string> = {
  accent: "text-accent",
  muted: "text-muted2",
};

/** Shared card+caption chrome reused by Histogram-bar panels (Story 2.4) and
 * Pillar-card (Story 4.2). */
export function Panel({
  caption,
  tone = "accent",
  bordered = false,
  children,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`bg-card p-card-padding ${bordered ? "border-2 border-dim" : ""} ${className}`}
    >
      <div className={`mb-4 text-eyebrow uppercase ${TONE_CLASS_NAME[tone]}`}>{caption}</div>
      {children}
    </section>
  );
}
