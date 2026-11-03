"use client";

import { useState } from "react";
import { DownloadIcon } from "./icons";

/**
 * TripHeader's "Download PDF" button — POSTs `{ slug }` to this repo's
 * own `/api/brochure` Route Handler (see `app/api/brochure/route.ts`)
 * and saves the returned PDF, mirroring the live production site's own
 * button byte-for-byte in behavior: same endpoint shape, same
 * fetch → blob → object URL → synthetic `<a download>` click →
 * `revokeObjectURL` sequence, same `disabled` state while the PDF
 * renders server-side (a multi-page brochure isn't instant).
 */
export function DownloadPdfButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/brochure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!response.ok) {
        console.error("PDF generation failed");
        return;
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${slug}-brochure.pdf`;
      link.click();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className={
        compact
          ? "flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-brand-neutral-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          : "flex items-center gap-1.5 rounded-pill border border-primary-500 px-3 py-2 font-poppins text-body-s font-medium text-primary-500 disabled:cursor-not-allowed disabled:opacity-50 sm:gap-3 sm:px-5 sm:py-2.5 sm:text-body-m"
      }
    >
      {isGenerating ? (
        <svg className="size-3.5 animate-spin sm:size-4.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <DownloadIcon className="size-3.5 sm:size-4.5" />
      )}
      {isGenerating ? "Generating PDF..." : compact ? "Download" : "Download PDF"}
    </button>
  );
}
