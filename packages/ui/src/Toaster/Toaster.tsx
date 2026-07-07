import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { dismissToast, getToasts, subscribeToasts, type Toast } from "./toasts";

const NO_TOASTS: readonly Toast[] = [];
const TIMEOUT_MS = 4000;

function ToastCard({ toast }: { toast: Toast }) {
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const isSuccess = toast.tone === "success";

  return (
    <button
      type="button"
      onClick={() => dismissToast(toast.id)}
      aria-label="Dismiss notification"
      className={`pointer-events-auto flex w-96 max-w-full cursor-pointer items-center gap-3 border-l-2 bg-card px-5 py-3 text-left ${
        isSuccess ? "border-l-accent" : "border-l-error"
      }`}
    >
      <p
        className={`min-w-0 flex-1 text-eyebrow font-semibold uppercase ${isSuccess ? "text-accent" : "text-error"}`}
      >
        {toast.message}
      </p>
      {isSuccess ? (
        <CheckIcon className="size-4 shrink-0 text-accent" />
      ) : (
        <ExclamationCircleIcon className="size-4 shrink-0 text-error" />
      )}
    </button>
  );
}

/** Singleton — mount once at each app's root. Renders the module-level toast store's
 * contents bottom-right; use `addToastSuccess`/`addToastError` from anywhere to push one. */
export function Toaster() {
  const [mounted, setMounted] = useState(false);
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => NO_TOASTS);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      style={{ zIndex: "var(--m-z-toast)" }}
      className="pointer-events-none fixed right-5 bottom-5 flex flex-col items-end gap-2"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}

export { addToastSuccess, addToastError } from "./toasts";
