"use client";

import { useSyncExternalStore } from "react";
import { dismissToast, getServerToasts, getToasts, subscribeToasts } from "./toast";

/** Renders the active toasts, top-right. Mount once in the root layout. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 left-4 z-[1000] flex flex-col items-end gap-3 sm:left-auto sm:w-[380px]"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.kind === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border-l-4 bg-white px-4 py-3 font-poppins text-[14px] leading-[22px] text-brand-neutral-1000 shadow-card-strong ${
            item.kind === "success" ? "border-success-800" : "border-error-700"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white ${
              item.kind === "success" ? "bg-success-800" : "bg-error-700"
            }`}
          >
            {item.kind === "success" ? "✓" : "!"}
          </span>
          <p className="flex-1">{item.message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(item.id)}
            className="shrink-0 text-[18px] leading-none text-brand-neutral-600 hover:text-brand-neutral-1000"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
