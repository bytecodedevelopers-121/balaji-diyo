"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/ImageGallery/Lightbox";
import type { GalleryImage } from "@/components/ui/ImageGallery/ImageGallery";
import type { CompanyDocument } from "@/features/company-documents/types/company-document.types";
import { FillImage } from "@/components/ui/FillImage";

interface CompanyDocumentCardProps {
  document: CompanyDocument;
}

/**
 * Client component (thumbnail needs an onClick + lightbox state) for a
 * single card on /company-documents. The thumbnail box uses a fixed
 * `aspect-[4/5]` with `object-contain` rather than `object-cover` —
 * these are scanned certificates/documents of varying real dimensions
 * (full A4 pages, landscape scans, ...), not uniformly-shaped photos,
 * so cropping to fill the box was cutting content off. `object-contain`
 * shows the whole scan (letterboxed) instead, matching the no-image
 * placeholder branch below it which already worked this way.
 *
 * Clicking a real scan opens the shared `Lightbox` (same full-screen
 * zoom/pan viewer used by trip photo galleries) at full resolution, so
 * the "fully displayed" image is still one click away even where the
 * thumbnail box has to letterbox it.
 */
export function CompanyDocumentCard({ document }: CompanyDocumentCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!document.imageUrl) {
    return (
      <div className="relative aspect-[3/4] overflow-hidden rounded-[6px] border border-brand-neutral-300 bg-white shadow-[0_2px_10px_rgba(6,74,112,0.1)]">
        <img
          src="/images/company-documents/document-placeholder.svg"
          alt={document.title}
          className="absolute inset-0 size-full object-contain p-8"
        />
      </div>
    );
  }

  const images: GalleryImage[] = [
    {
      src: document.imageUrl,
      alt: document.title,
      caption: document.description ?? undefined,
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={`View full document: ${document.title}`}
        className="relative aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-[6px] border border-brand-neutral-300 bg-white shadow-[0_2px_10px_rgba(6,74,112,0.1)] transition-shadow hover:shadow-[0_6px_20px_rgba(6,74,112,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
      >
        <FillImage
          src={document.imageUrl}
          alt={document.title}
          className="absolute inset-0 size-full object-contain p-4 transition-transform duration-300 hover:scale-105" sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
      </button>
      {lightboxOpen ? (
        <Lightbox
          images={images}
          startIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </>
  );
}
