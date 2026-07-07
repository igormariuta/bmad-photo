import type { ReactNode } from "react";
import "./Label.css";

export interface LabelProps {
  children: ReactNode;
  /** Shows a blinking caret after the text. */
  caret?: boolean;
  /** Full style override — replaces the default token classes rather than merging with them. */
  className?: string;
}

const DEFAULT_CLASS_NAME = "text-eyebrow text-accent uppercase";

export function Label({ children, caret = false, className }: LabelProps) {
  return (
    <span className={className ?? DEFAULT_CLASS_NAME}>
      {children}
      {caret && (
        <span aria-hidden="true" className="label-caret ml-1">
          ▎
        </span>
      )}
    </span>
  );
}
