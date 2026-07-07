import type { ComponentType, ReactNode, SVGProps } from "react";
import { Label } from "../Label/Label";

export interface StatProps {
  /** Muted data-label tier — names the number, never the accent section-eyebrow. */
  label: string;
  /** Pre-formatted display string, e.g. "1,240". */
  value: string;
  /** Drives color only: positive → accent, negative → error, zero → muted. */
  signOf: number;
  sub?: string;
  subIcon?: ComponentType<SVGProps<SVGSVGElement>>;
}

function signClassName(signOf: number): string {
  if (signOf > 0) return "text-accent";
  if (signOf < 0) return "text-error";
  return "text-muted";
}

export function Stat({ label, value, signOf, sub, subIcon: SubIcon }: StatProps) {
  return (
    <div>
      <Label className="text-data-label text-muted2 uppercase">{label}</Label>
      <div
        className={`font-display mt-4 text-display leading-none font-bold tabular-nums ${signClassName(signOf)}`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-2 flex items-center gap-2.5 text-eyebrow text-muted2">
          {SubIcon ? <SubIcon aria-hidden="true" className="size-3.5" /> : null}
          {sub as ReactNode}
        </div>
      ) : null}
    </div>
  );
}
