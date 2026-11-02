import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Fixed bottom bar shown whenever the browser goes offline. Always mounted —
 * toggles a Tailwind transform/transition so it slides in/out rather than
 * being conditionally rendered (which would skip the exit animation).
 */
export function OfflineBanner() {
  const { isOffline } = useOnlineStatus();

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2",
        "bg-amber-100 px-4 py-2.5 text-center text-sm font-medium text-amber-900",
        "shadow-[0_-2px_8px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out",
        isOffline ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
    >
      You are offline. Changes are disabled until your connection is back.
    </div>
  );
}
