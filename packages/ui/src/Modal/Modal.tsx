import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

export type ModalVariant = "default" | "wide";

export interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  labelledBy: string;
  /** `"default"` (max-w-md, padded) suits prose/form content. `"wide"` (max-w-5xl, no
   * built-in padding) is for media-heavy content that needs to manage its own layout
   * edge-to-edge, e.g. a photo alongside a detail panel. */
  variant?: ModalVariant;
  /** Render-prop, not plain children — callers need `close` to dismiss from inside (e.g. after
   * a successful form submit). */
  children: (close: () => void) => ReactNode;
}

/** Portals to `document.body`. Relies on `.dark` being applied on `documentElement` (see
 * Theme-toggle) — a body-level portal remains a descendant of `<html>` either way, so the
 * theme's CSS variables resolve correctly regardless of where in the tree Modal is mounted. */
export function Modal({ isOpen, onOpenChange, labelledBy, variant = "default", children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Captured synchronously during render (not inside an effect) the instant `isOpen` flips
  // true — this runs before commit, so it still sees the real invoker even if that invoker
  // unmounts in the same batch that opens this Modal (e.g. a Menu item closing itself while
  // opening a ConfirmModal). An effect would be too late: the DOM mutation that removes the
  // invoker, and the browser's own focus-to-body shift that follows it, both happen during
  // commit, before any effect (even useLayoutEffect) runs.
  if (isOpen && !wasOpenRef.current) {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  wasOpenRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) return;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog)?.focus();

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === dialog,
      );
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (!firstEl || !lastEl) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === firstEl || !dialog.contains(active)) {
          event.preventDefault();
          lastEl.focus();
        }
      } else if (active === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, onOpenChange]);

  if (!mounted || !isOpen) return null;

  const close = () => onOpenChange(false);

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: "var(--m-z-modal)" }}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      {/* The close handler lives here, not on the backdrop div above — this
       * centering wrapper is also `inset-0` and painted on top of it, so it
       * alone receives every click outside the dialog. The dialog's own
       * stopPropagation prevents this from firing for in-dialog clicks.
       * `grid place-items-center`, not `flex items-center justify-center`
       * (round-5 bug fix, 2026-07-08) — flexbox's centering clips an
       * overflowing child at its *start* when the container scrolls (a
       * well-known flex-center-plus-overflow issue), which silently hid the
       * top of any dialog taller than the viewport with no way to scroll to
       * it. CSS Grid's `place-items: center` centers the same way for
       * content that fits, but doesn't clip the start when it overflows. */}
      <div
        onClick={close}
        className="absolute inset-0 grid place-items-center overflow-y-auto py-6"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          className={`m-0 w-full border-2 border-t-2 border-dim border-t-accent bg-bg shadow-none outline-none ${
            variant === "wide" ? "max-w-5xl" : "max-w-md"
          }`}
        >
          {variant === "wide" ? children(close) : <div className="px-9 pt-8.5 pb-9">{children(close)}</div>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
