/**
 * Tiny toast store — no dependency. `toast.success(...)` / `toast.error(...)` from anywhere
 * (including the axios interceptor); `<Toaster />` renders whatever is queued.
 */
export type ToastVariant = "success" | "error";

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

const DURATION_MS = 3500;
const DEDUPE_MS = 800;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const recent = new Map<string, number>();

function emit() {
  listeners.forEach((listener) => listener());
}

function push(variant: ToastVariant, message: string) {
  // One save often fires several requests; show the same message only once.
  const key = `${variant}:${message}`;
  const now = Date.now();
  if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;
  recent.set(key, now);

  const id = nextId++;
  items = [...items, { id, variant, message }].slice(-4);
  emit();
  setTimeout(() => dismiss(id), DURATION_MS);
}

export function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getToasts = () => items;

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};
