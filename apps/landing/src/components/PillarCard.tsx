import type { CSSProperties } from "react";
import { Panel } from "@bmad/ui";

export interface PillarCardProps {
  /** Numbered eyebrow, e.g. "01". */
  eyebrow: string;
  title: string;
  body: string;
  /** Drives the ~90ms scroll-reveal stagger via --stagger. */
  stagger: 0 | 1 | 2;
  /** React's reconciliation key — not read by this component, declared so
   * `.astro` callers can pass it through `astro check`'s stricter typing of
   * framework-component props (unlike plain JSX/TSX, it doesn't otherwise
   * know `key` is special). */
  key?: string;
}

/** Landing-only (FR-2): Panel-identical chrome via `bordered`, wrapped in the
 * CSS-only scroll-reveal (app.css) that fades each card up once as it enters
 * the viewport. */
export function PillarCard({ eyebrow, title, body, stagger }: PillarCardProps) {
  return (
    <div className="scroll-reveal" style={{ "--stagger": stagger } as CSSProperties}>
      <Panel caption={eyebrow} bordered>
        <h3 className="font-display text-h3 text-fg">{title}</h3>
        <p className="mt-4 text-body text-muted">{body}</p>
      </Panel>
    </div>
  );
}
