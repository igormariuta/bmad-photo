import { useRef, type KeyboardEvent } from "react";

export interface UnderlineTabItem {
  id: string;
  label: string;
}

export interface UnderlineTabsProps {
  ariaLabel: string;
  current: string;
  onSelect: (id: string) => void;
  tabs: UnderlineTabItem[];
  /** Draws its own 2px dim baseline rule with an accent underline on the active tab. Set
   * `false` when nesting under a container that already has its own bottom rule. */
  baseline?: boolean;
  className?: string;
}

export function UnderlineTabs({
  ariaLabel,
  current,
  onSelect,
  tabs,
  baseline = true,
  className = "",
}: UnderlineTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + direction + tabs.length) % tabs.length;
    const nextTab = tabs[next];
    if (!nextTab) return;
    onSelect(nextTab.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-stretch gap-7 ${baseline ? "border-b-2 border-dim" : ""} ${className}`}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === current;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`-mb-0.5 border-b-2 py-3 text-eyebrow uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active ? "border-accent text-fg" : "border-transparent text-muted2 hover:text-fg"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
