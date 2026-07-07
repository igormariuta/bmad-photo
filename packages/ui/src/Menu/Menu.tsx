import { useEffect, useRef, useState, type ReactNode } from "react";
import { EllipsisHorizontalCircleIcon } from "@heroicons/react/24/outline";
import { ICON_BUTTON_CLASS_NAME } from "../Button/Button";

export interface MenuItem {
  id: string;
  label: string;
  /** Pre-sized by the caller, e.g. `<PencilSquareIcon className="size-4" />`. */
  icon: ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

export interface MenuProps {
  triggerLabel: string;
  items: MenuItem[];
}

/** Opens an inline icon-row to the LEFT of the trigger, not a dropdown list. A `danger` item
 * typically calls back into a ConfirmModal open-state setter rather than acting immediately. */
export function Menu({ triggerLabel, items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center text-muted2 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <EllipsisHorizontalCircleIcon className="size-5" />
      </button>

      {open && (
        <div
          role="menu"
          style={{ zIndex: "var(--m-z-dropdown)" }}
          className="absolute inset-y-0 right-full mr-1 flex items-center gap-3"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              aria-label={item.label}
              title={item.label}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`${ICON_BUTTON_CLASS_NAME} size-8 ${
                item.danger ? "text-error hover:border-error hover:text-error" : ""
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
