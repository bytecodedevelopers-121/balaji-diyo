"use client";

import { useState } from "react";
import { FillImage } from "@/components/ui/FillImage";
import { Lightbox } from "@/components/ui/ImageGallery/Lightbox";

/**
 * One photo beside a "Highlight of the day" caption — the day's own photo,
 * else its leg's. Clicking the photo opens it full screen in the shared
 * `Lightbox`.
 */
export function DayHighlight({ title, image }: { title: string; image?: string }) {
  const [open, setOpen] = useState(false);
  if (!image) return null;

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-[#e7dfd2] pt-4 sm:flex-row sm:items-start sm:gap-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${title} photo full screen`}
        className="relative aspect-[3/2] w-full shrink-0 cursor-zoom-in overflow-hidden rounded-md bg-brand-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 sm:w-[204px]"
      >
        <FillImage src={image} alt={title} className="object-cover" sizes="204px" />
      </button>
      <div>
        <p className="text-[15px] font-semibold text-brand-neutral-900">Highlight of the day</p>
        <p className="mt-2 text-[13px] text-brand-neutral-800">{title}</p>
      </div>

      {open ? <Lightbox images={[{ src: image, alt: title }]} startIndex={0} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
