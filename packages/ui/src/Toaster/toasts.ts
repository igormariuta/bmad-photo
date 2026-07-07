export interface Toast {
  id: string;
  tone: "success" | "error";
  message: string;
}

let toasts: Toast[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): Toast[] {
  return toasts;
}

function addToast(tone: Toast["tone"], message: string): string {
  nextId += 1;
  const id = String(nextId);
  toasts = [...toasts, { id, tone, message }];
  emit();
  return id;
}

export function addToastSuccess(message: string): string {
  return addToast("success", message);
}

export function addToastError(message: string): string {
  return addToast("error", message);
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}
