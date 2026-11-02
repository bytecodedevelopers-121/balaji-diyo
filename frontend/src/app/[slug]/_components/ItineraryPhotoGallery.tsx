"use client";

import { useState } from "react";
import { FullImage } from "@/components/ui/ImageGallery/FullImage";
import { Lightbox } from "@/components/ui/ImageGallery/Lightbox";
import type { GalleryImage } from "@/components/ui/ImageGallery";
import { cn } from "@/lib/utils";

interface ItineraryDayMedia {
  url: string;
  type: "image" | "video";
}

interface ItineraryPhotoGalleryProps {
  photos: ItineraryDayMedia[];
  dayTitle: string;
}

/**
 * Keeps the itinerary card's compact three-column layout while using the
 * same full-screen viewer as the package hero gallery — for photos only.
 * The shared `Lightbox` is a generic, site-wide image viewer, so a video
 * tile plays inline via its own native `<video>` controls instead of
 * joining the lightbox's photo set; each photo tile's `imageIndex` below
 * (its position within that photo-only subset, as it's interleaved with
 * any video tile) is precomputed via `reduce` rather than a counter
 * mutated during render.
 */
export function ItineraryPhotoGallery({ photos, dayTitle }: ItineraryPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const images: GalleryImage[] = photos
    .filter((item) => item.type === "image")
    .map((item, index) => ({ src: item.url, alt: `${dayTitle} — photo ${index + 1}` }));

  const tiles = photos.reduce<{ item: ItineraryDayMedia; key: string; imageIndex: number }[]>((acc, item, index) => {
    const imageIndex = item.type === "image" ? acc.filter((tile) => tile.item.type === "image").length : -1;
    acc.push({ item, key: `${item.url}-${index}`, imageIndex });
    return acc;
  }, []);

  const extraCount = tiles.length - 1;

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map(({ item, key, imageIndex }, index) => {
          // Below `sm`, only the first tile is shown (see extraCount badge below); the
          // rest stay in the DOM — untouched for the sm:grid-cols-3 layout and so the
          // Lightbox's image set/indices don't have to change between breakpoints.
          const hiddenOnMobile = index > 0 ? "hidden sm:block" : "";
          const badge =
            index === 0 && extraCount > 0 ? (
              <span
                aria-hidden="true"
                className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white sm:hidden"
              >
                +{extraCount}
              </span>
            ) : null;

          if (item.type === "video") {
            return (
              <div key={key} className={cn("relative", hiddenOnMobile)}>
                <video
                  src={item.url}
                  controls
                  playsInline
                  aria-label={`${dayTitle} — video`}
                  className="aspect-4/3 w-full rounded-2xl bg-brand-neutral-100 object-cover"
                />
                {badge}
              </div>
            );
          }

          const image = images[imageIndex];

          return (
            <button
              key={key}
              type="button"
              onClick={() => setLightboxIndex(imageIndex)}
              aria-label={`View ${image.alt} full screen`}
              className={cn(
                "group relative aspect-4/3 cursor-zoom-in overflow-hidden rounded-2xl bg-brand-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
                hiddenOnMobile,
              )}
            >
              <FullImage
                src={image.src}
                alt={image.alt}
                sizes="(min-width: 640px) 33vw, 100vw"
                className="transition-transform duration-300 group-hover:scale-[1.02]"
                showBlurBackdrop={false}
              />
              {badge}
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null ? (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}
