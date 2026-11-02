"use client";

import { useEffect, useState } from "react";

/** Scroll distance (px) past which the button appears. */
const SHOW_AFTER_PX = 400;

/**
 * Floating "back to top" arrow for mobile and tablet (hidden at `lg`+).
 * Stacked just above `WhatsAppButton` (bottom-right) — bottom-center got
 * covered by the Tawk launcher (bottom-left), whose "we are online" bar
 * stretches past the middle of narrow screens — see `TawkChat.tsx`.
 * Lifted clear of the package detail page's mobile booking bar by the
 * same `#mobile-booking-bar` rule in `globals.css` that lifts WhatsApp.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      id="global-scroll-top-button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-7 bottom-[92px] z-40 flex size-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-card-strong transition-opacity hover:opacity-90 lg:hidden ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
