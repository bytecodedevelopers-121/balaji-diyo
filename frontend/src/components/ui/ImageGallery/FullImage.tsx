import Image from "next/image";
import { cn } from "@/lib/utils";

interface FullImageProps {
  src: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  /** Extra classes for the visible (foreground) photo, e.g. a hover transform. */
  className?: string;
  /**
   * Set false to skip the blurred backdrop layer and let the parent's own
   * background show through the letterbox instead. Defaults to true so
   * existing callers (hero gallery) keep the blurred-fill look; the
   * itinerary day gallery opts out per client feedback (2026-09-22).
   */
  showBlurBackdrop?: boolean;
}

/**
 * Fills its `relative overflow-hidden` parent while showing the *whole*
 * photo — `object-contain`, never cropped. Client feedback (2026-09-21):
 * the package-detail photo tiles used `object-cover`, which trimmed the
 * top/bottom off anything whose aspect ratio differed from its tile (e.g.
 * a 617×522 group photo in the 767×480 lead tile lost its banner text).
 *
 * By default the letterbox space left over is filled with a blurred,
 * enlarged copy of the same photo instead of an empty bar, so mismatched
 * ratios still read as a finished tile. The backdrop is decorative
 * (`alt=""`, hidden from assistive tech) and points at the same
 * URL/`sizes` as the foreground, so it's served from the same optimized-
 * image cache entry rather than costing a second download.
 */
export function FullImage({ src, alt, sizes, preload = false, className, showBlurBackdrop = true }: FullImageProps) {
  return (
    <>
      {showBlurBackdrop ? (
        <Image
          src={src}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          className="scale-125 object-cover opacity-70 blur-2xl"
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={cn("object-contain", className)}
      />
    </>
  );
}
