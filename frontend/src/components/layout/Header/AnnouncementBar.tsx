"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "boundless:announcement-dismissed";

/** Edit this copy to change the "Hot News" strip. */
const ANNOUNCEMENT =
  "Lukla flights operate from Manthali Airport in peak season — October, November, March, April and May";

/**
 * Dismissible strip above the main header row. Dismissal lasts for the
 * browser session (sessionStorage, wrapped in try/catch — it can throw
 * in private windows).
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readDismissed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AnnouncementBar() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => false);
  if (dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // storage unavailable — dismissal just won't persist
    }
    listeners.forEach((listener) => listener());
  }

  return (
    <div className="relative flex items-center justify-center gap-3 bg-logo-sun px-10 py-1.5 text-logo-navy-dark">
      <span className="shrink-0 rounded-[4px] bg-logo-navy-dark px-1.5 py-0.5 text-[10px] leading-none font-bold text-brand-neutral-000 uppercase">
        Hot News
      </span>
      <p className="min-w-0 truncate text-[12px] font-medium">{ANNOUNCEMENT}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 rounded-sm p-1 focus-visible:outline-2 focus-visible:outline-logo-navy-dark md:right-6"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
