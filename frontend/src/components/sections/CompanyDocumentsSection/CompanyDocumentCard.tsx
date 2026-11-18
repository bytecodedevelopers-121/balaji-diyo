"use client";

import { useState } from "react";
import { Lightbox } from "@/components/ui/ImageGallery/Lightbox";
import type { GalleryImage } from "@/components/ui/ImageGallery/ImageGallery";
import type { CompanyDocument } from "@/features/company-documents/types/company-document.types";

interface CompanyDocumentCardProps {
  document: CompanyDocument;
}

/**
 * Client component (thumbnail needs an onClick + lightbox state) for a
 * single card on /company-documents. All cards share one size (4:3 frame) and the scan is
 * fitted inside it, so the grid is even and nothing is cropped; the lightbox shows it full size.
 *
 * Clicking a real scan opens the shared `Lightbox` (same full-screen
 * zoom/pan viewer used by trip photo galleries) at full resolution, so
 * the "fully displayed" image is still one click away even where the
 * thumbnail box has to letterbox it.
 */
/** Every card is the same size, whatever the scan's shape: the whole image fits inside (nothing cropped). */
const CARD = "overflow-hidden rounded-[6px] border border-brand-neutral-300 bg-white p-2 shadow-[0_2px_10px_rgba(6,74,112,0.1)]";
const FRAME = "aspect-[4/3] w-full";

export function CompanyDocumentCard({ document }: CompanyDocumentCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!document.imageUrl) {
    return (
      <div className={CARD}>
        <div className={FRAME}>
          <img src="/images/company-documents/document-placeholder.svg" alt={document.title} className="size-full object-contain" />
        </div>
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
        className={`${CARD} block w-full cursor-zoom-in transition-shadow hover:shadow-[0_6px_20px_rgba(6,74,112,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy`}
      >
        <span className={`${FRAME} block`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={document.imageUrl} alt={document.title} loading="lazy" className="size-full object-contain" />
        </span>
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
