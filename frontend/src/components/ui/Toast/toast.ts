export type ToastKind = "success" | "error";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

type Listener = () => void;

const DURATION_MS = 6000;
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  items = [...items, { id, kind, message }];
  emit();
  setTimeout(() => dismissToast(id), DURATION_MS);
}

/** Show a toast from anywhere in client code. Needs `<Toaster />` mounted once (root layout). */
export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getToasts = () => items;
// One shared empty array: React requires the server snapshot to be referentially stable between calls.
const NO_TOASTS: ToastItem[] = [];
export const getServerToasts = (): ToastItem[] => NO_TOASTS;
