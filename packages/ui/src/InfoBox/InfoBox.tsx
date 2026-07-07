import type { ReactNode } from "react";

export type InfoBoxTone = "info" | "danger";

export interface InfoBoxProps {
  children: ReactNode;
  /** Defaults to 'info' (accent). 'danger' (error) is for warnings/destructive-outcome notes. */
  tone?: InfoBoxTone;
  className?: string;
}

const TONE_CLASS_NAME: Record<InfoBoxTone, string> = {
  info: "border-l-accent bg-accent/5",
  danger: "border-l-error bg-error/5",
};

/** The note surface every other story in this project should reach for — not a one-off
 * per-feature treatment. */
export function InfoBox({ children, tone = "info", className = "" }: InfoBoxProps) {
  return (
    <div className={`border-l-2 p-card-padding text-caption text-muted ${TONE_CLASS_NAME[tone]} ${className}`}>
      {children}
    </div>
  );
}
