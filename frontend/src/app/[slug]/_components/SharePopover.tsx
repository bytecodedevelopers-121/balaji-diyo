"use client";

import { useEffect, useRef, useState } from "react";
import { buildSocialShareLinks, SocialShareIcon } from "@/lib/share/social-share-links";
import { ShareIcon } from "./icons";

/**
 * TripHeader's "Share" button. Figma only ever shows the closed pill
 * (no expanded state sampled), same situation `DatePicker.tsx` documents
 * for its own popover — so, like that component, this is a genuine
 * addition built from the app's own tokens (`rounded-2xl`,
 * `shadow-card-strong`, primary/secondary colors) rather than an
 * invented, unrelated look. The behavior itself isn't invented, though:
 * it mirrors the live production package-detail page's own "Share"
 * button — a row of platform sharer-intent links (`buildSocialShareLinks`,
 * shared with the blog page's inline `ShareButtons`), not the
 * `navigator.share()` Web Share API — plus a "Copy link" action, which
 * production doesn't have but every share-popover pattern elsewhere
 * expects.
 */
export function SharePopover({ url, title }: { url: string; title: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const links = buildSocialShareLinks(url, title);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((isOpen) => {
      const next = !isOpen;
      // Reset the "Copied!" state whenever the popover re-opens.
      if (next) setCopied(false);
      return next;
    });
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be denied (permissions, non-secure context);
      // the popover just stays open with no visible link to fall back to.
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-pill border border-secondary-500 px-3 py-2 font-poppins text-body-s font-medium text-secondary-500 sm:gap-3 sm:px-5 sm:py-2.5 sm:text-body-m"
      >
        <ShareIcon className="size-3.5 sm:size-4.5" />
        Share
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 w-64 rounded-2xl border border-brand-neutral-200 bg-white p-4 shadow-card-strong"
        >
          <p className="font-poppins text-body-s font-medium text-brand-neutral-700">Share this trip</p>
          <div className="mt-3 flex items-center gap-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Share on ${link.label}`}
                className="flex size-9 items-center justify-center rounded-md text-brand-neutral-000 transition-opacity hover:opacity-90"
                style={{ backgroundColor: link.color }}
              >
                <SocialShareIcon platform={link.label} />
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-pill border border-brand-neutral-300 py-2 font-poppins text-body-s font-medium text-brand-neutral-900 transition-colors hover:bg-brand-neutral-100"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
