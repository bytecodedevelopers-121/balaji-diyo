"use client";

import { useState } from "react";
import { FillImage } from "@/components/ui/FillImage";
import { Lightbox } from "@/components/ui/ImageGallery/Lightbox";
import type { PackageDetail } from "../data";
import { EmptyNote, SectionRow } from "./SectionRow";

/** Every distinct photo for the trip: the hero set plus each itinerary day's photos. */
function collectPhotos(trip: PackageDetail): string[] {
  const urls = [
    ...trip.heroImages,
    ...trip.detailedItinerary.flatMap((leg) =>
      leg.days.flatMap((day) => (day.photos ?? []).filter((media) => media.type === "image").map((media) => media.url)),
    ),
  ];
  return [...new Set(urls.filter(Boolean))];
}

/** "Media Gallery" — a photo grid for the trip; clicking a photo opens it full screen. */
export function MediaGallerySection({ trip }: { trip: PackageDetail }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = collectPhotos(trip);
  if (photos.length === 0) {
    return (
      <SectionRow id="media-gallery" label="Media Gallery">
        <EmptyNote>Photos for this trip will be added soon.</EmptyNote>
      </SectionRow>
    );
  }

  const images = photos.map((src, index) => ({ src, alt: `${trip.title} — photo ${index + 1}` }));

  return (
    <SectionRow id="media-gallery" label="Media Gallery">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setLightboxIndex(index)}
            aria-label={`View ${image.alt} full screen`}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl bg-brand-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            <FillImage
              src={image.src}
              alt={image.alt}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null ? (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      ) : null}
    </SectionRow>
  );
}
