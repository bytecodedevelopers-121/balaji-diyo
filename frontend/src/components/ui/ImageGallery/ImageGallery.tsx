"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { FullImage } from "./FullImage";
import { Lightbox } from "./Lightbox";
import { ImagesIcon } from "./icons";

export interface GalleryImage {
  src: string;
  /** Required — also doubles as the lightbox caption when no separate `caption` is given. */
  alt: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
  /**
   * How many tiles the collage shows before folding the rest behind a
   * "+N photos" overlay on the last visible tile. Defaults to 4, which
   * is the largest layout this component knows how to lay out (1 lead
   * tile + 3 supporting tiles) — pass a lower number for a smaller
   * gallery, images beyond it are still reachable through the lightbox.
   */
  maxTiles?: number;
}

/**
 * Full-bleed photo collage that opens an interactive, keyboard- and
 * touch-navigable lightbox (`Lightbox`) on click. Generic over any
 * `images` list — not tied to trip/package content — so it can be
 * reused anywhere a set of photos needs a preview grid (stories,
 * reviews, place pages, ...).
 *
 * Layout adapts to how many images are handed in (1 through 4+) rather
 * than assuming a fixed count, since callers won't always have exactly
 * four photos to show. Every image is still reachable through the
 * lightbox regardless of how many tiles the collage itself shows.
 */
export function ImageGallery({
  images,
  className,
  maxTiles = 4,
}: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openAt = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  if (images.length === 0) return null;

  // Mosaic only knows how to lay out 1–4 visible tiles (anything past
  // the 4th photo folds into the "+N" overlay on the last tile), so
  // clamp maxTiles into that range regardless of what the caller passes.
  const tileCount = Math.min(images.length, Math.min(4, Math.max(1, maxTiles)));
  const hiddenCount = images.length - tileCount;

  return (
    <div className={cn("relative", className)}>
      {/*
        Below `sm`: just the single lead photo, full-width (client-
        requested 2026-09-03 — the multi-tile stack this used to render
        here, one tile per photo up to 4, made the mobile package-detail
        header read as a long scroll of photos instead of one hero
        image). Every other photo is still reachable — tapping the tile
        or the "Show all images" pill opens the same Lightbox at index
        0, which swipes through the full `images` list — so nothing is
        actually dropped, just not shown as its own tile on this narrow
        a screen. A floating pill (not the desktop mosaic's dark "+N
        photos" dimmed overlay — that reads as hidden-photo-count on a
        folded tile, which doesn't apply here since there's only ever
        one tile) is the client-requested affordance instead, so the
        photo itself stays fully visible. `hidden sm:block`/`sm:hidden`
        below swap between this single photo and the desktop mosaic
        rather than trying to make one grid serve both.
      */}
      {/*
        White frame (client-requested 2026-09-21): `p-2` here is the same
        8px as every `gap-2` between tiles inside `Mosaic`, so the outer
        border and the gutters between photos read as one consistent
        white line — change them together, not separately. Padding sits
        inside the caller's fixed height (border-box), so the collage's
        overall size doesn't grow.
      */}
      <div className="hidden h-full bg-white p-2 sm:block">
        <Mosaic
          images={images.slice(0, tileCount)}
          hiddenCount={hiddenCount}
          onOpen={openAt}
        />
      </div>
      <div className="overflow-hidden rounded-2xl bg-white p-2 sm:hidden">
        <Tile
          image={images[0]}
          index={0}
          onOpen={openAt}
          preload
          sizes="100vw"
          // 16:10 (Tile's default) to match the recommended Featured upload —
          // the old fixed 320px height was near-square on phones and left
          // blurred bars above/below the photo.
          showAllImagesButton={images.length > 1}
        />
      </div>
      {lightboxIndex !== null ? (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      ) : null}
    </div>
  );
}

function Mosaic({
  images,
  hiddenCount,
  onOpen,
}: {
  images: GalleryImage[];
  hiddenCount: number;
  onOpen: (index: number) => void;
}) {
  switch (images.length) {
    case 1:
      return (
        <div className="h-full gap-2">
          <Tile
            image={images[0]}
            index={0}
            onOpen={onOpen}
            preload
            sizes="100vw"
          />
        </div>
      );

    case 2:
      return (
        <div className="grid h-full grid-cols-2 gap-2">
          {images.map((image, index) => (
            <Tile
              key={image.src}
              image={image}
              index={index}
              onOpen={onOpen}
              preload={index === 0}
              sizes="50vw"
            />
          ))}
        </div>
      );

    case 3:
      return (
        <div className="grid h-full grid-cols-[1.4fr_1fr] gap-2">
          <Tile
            image={images[0]}
            index={0}
            onOpen={onOpen}
            preload
            sizes="55vw"
          />
          <div className="grid grid-rows-2 gap-2">
            <Tile
              image={images[1]}
              index={1}
              onOpen={onOpen}
              sizes="35vw"
            />
            <Tile
              image={images[2]}
              index={2}
              onOpen={onOpen}
              sizes="35vw"
            />
          </div>
        </div>
      );

    default: {
      // Always exactly 4 images here — ImageGallery clamps maxTiles to
      // 4 and only falls through to this layout once there are that
      // many tiles to show. `hiddenCount` (images beyond these 4) is
      // folded into a "+N photos" overlay on the last tile.
      const [lead, second, third, fourth] = images;
      return (
        <div className="grid h-full grid-cols-1 gap-2 sm:grid-cols-[1fr_0.7fr]">
          <Tile
            image={lead}
            index={0}
            onOpen={onOpen}
            preload
            sizes="(max-width: 640px) 100vw, 55vw"
            wrapperClassName="aspect-16/10 sm:aspect-auto sm:h-full"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-rows-[0.62fr_0.38fr]">
            <Tile
              image={second}
              index={1}
              onOpen={onOpen}
              sizes="(max-width: 640px) 100vw, 40vw"
              wrapperClassName="aspect-16/10 sm:aspect-auto sm:h-full"
            />
            <div className="grid grid-cols-2 gap-2">
              <Tile
                image={third}
                index={2}
                onOpen={onOpen}
                sizes="(max-width: 640px) 50vw, 20vw"
                wrapperClassName="aspect-16/10 sm:aspect-auto sm:h-full"
              />
              <Tile
                image={fourth}
                index={3}
                onOpen={onOpen}
                sizes="(max-width: 640px) 50vw, 20vw"
                wrapperClassName="aspect-16/10 sm:aspect-auto sm:h-full"
                overlayCount={hiddenCount > 0 ? hiddenCount : undefined}
              />
            </div>
          </div>
        </div>
      );
    }
  }
}

function Tile({
  image,
  index,
  onOpen,
  preload = false,
  sizes,
  wrapperClassName,
  overlayCount,
  showAllImagesButton = false,
}: {
  image: GalleryImage;
  index: number;
  onOpen: (index: number) => void;
  preload?: boolean;
  sizes: string;
  wrapperClassName?: string;
  overlayCount?: number;
  /** Mobile single-tile "Show all images" pill — see call-site comment. */
  showAllImagesButton?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={cn(
        "group relative block aspect-16/10 w-full cursor-pointer overflow-hidden rounded-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 sm:aspect-auto sm:h-full",
        wrapperClassName,
      )}
      aria-label={
        showAllImagesButton
          ? "Show all images"
          : overlayCount
            ? `Show ${overlayCount} more photo${overlayCount === 1 ? "" : "s"}`
            : `View photo: ${image.alt}`
      }
    >
      <FullImage
        src={image.src}
        alt={image.alt}
        sizes={sizes}
        preload={preload}
        className="transition-transform duration-300 group-hover:scale-105"
      />
      {overlayCount ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition-colors group-hover:bg-black/60">
          <span className="flex items-center gap-2 font-poppins text-body-m font-medium text-white">
            <ImagesIcon className="size-5" />+{overlayCount} photos
          </span>
        </div>
      ) : null}
      {showAllImagesButton ? (
        // Figma spec: 123×32, radius 40, padding 6px/12px, gap 10px,
        // Poppins medium 12px/19.2px (that line-height/letter-spacing
        // pair is exactly `text-body-s`'s own token values already).
        // Width left to content + `whitespace-nowrap` rather than a
        // literal `w-[123px]` — the real Poppins webfont renders this
        // label a bit wider than Figma's own measurement, so a hard
        // 123px wrapped it onto two lines instead of matching the
        // reference's single-line pill.
        <span className="absolute right-3 bottom-3 flex h-8 items-center gap-2.5 rounded-[40px] bg-brand-neutral-000 px-3 py-1.5 font-poppins text-body-s font-medium whitespace-nowrap text-brand-neutral-900 shadow-card-strong">
          <ImagesIcon className="size-4" />
          Show all images
        </span>
      ) : null}
    </button>
  );
}
