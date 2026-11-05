"use client";

import { useState } from "react";

/** "Share" button: opens the device share sheet when available, else copies the page link. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked: nothing to do.
    }
  }

  return (
    <button type="button" onClick={handleClick} className="flex items-center gap-2 text-[14px] text-brand-neutral-900 hover:text-primary-500">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" strokeLinecap="round" />
      </svg>
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
