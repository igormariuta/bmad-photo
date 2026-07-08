import type { ReactNode } from "react";

export interface GlitchTextProps {
  children: ReactNode;
}

/**
 * One-shot settle-in on mount: jitter + accent/error chromatic ghost,
 * resolving to static type after 900ms — never a repeating auto-beat loop
 * (DESIGN.md's "motion is a single restrained gesture" rule overrides the
 * ported primitive's original default). The `.hero-glitch` keyframes live in
 * app.css so `prefers-reduced-motion: reduce` can collapse them via a pure
 * CSS media query, with no JS branch needed.
 */
export function GlitchText({ children }: GlitchTextProps) {
  return <span className="hero-glitch">{children}</span>;
}
