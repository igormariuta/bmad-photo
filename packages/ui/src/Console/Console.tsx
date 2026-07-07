import type { ReactNode } from "react";

export interface ConsoleProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function Console({ title, children, className = "" }: ConsoleProps) {
  return (
    <div className={`border-2 border-dim bg-card ${className}`}>
      <div className="flex items-center gap-2 border-b-2 border-dim px-3 py-2">
        <span aria-hidden="true" className="size-2 border-2 border-error" />
        <span aria-hidden="true" className="size-2 border-2 border-dim" />
        <span className="ml-1 text-caption text-muted2">{title}</span>
      </div>
      <div className="px-3 py-3 font-body text-caption break-words text-muted">{children}</div>
    </div>
  );
}
