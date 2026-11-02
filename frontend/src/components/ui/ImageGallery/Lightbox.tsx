"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "./ImageGallery";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";

interface LightboxProps {
  images: GalleryImage[];
  startIndex: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD_PX = 50;
const ZOOM_SCALE = 2.25;

/**
 * Full-screen image preview built on the native `<dialog>` element —
 * `showModal()` gets us the top-layer stacking, a real `::backdrop`,
 * and a built-in focus trap + Escape-to-close for free, so this only
 * has to add what `<dialog>` doesn't cover: arrow-key/swipe navigation,
 * a thumbnail rail, and click-to-zoom/pan.
 *
 * Mounted by `ImageGallery` only while open (not hidden via CSS), so
 * `showModal()` in the mount effect is the one time it needs to run.
 */
export function Lightbox({ images, startIndex, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragOrigin = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const dragMoved = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const thumbRailRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  const current = images[index];

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      setZoomed(false);
      setPan({ x: 0, y: 0 });
    },
    [count],
  );
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  // Open as a native modal on mount. Deliberately no cleanup here:
  // `dialog.close()` fires the native "close" event synchronously,
  // which our onClose handler below treats as a real user close and
  // uses to unmount this component via the parent's state — calling
  // it from this effect's own cleanup would mean React's dev-mode
  // Strict Mode double-invoke (mount → cleanup → mount, simulating a
  // remount) closes the dialog for real before the second mount ever
  // runs, so the lightbox would open and immediately vanish. Letting
  // React just remove the (still-open) <dialog> node on unmount is
  // enough — there's no dangling modal state to clean up.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Arrow-key navigation — <dialog> already handles Escape natively.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (count < 2) return;
      if (event.key === "ArrowLeft") goPrev();
      else if (event.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext, count]);

  // Keep the active thumbnail in view as the index changes.
  useEffect(() => {
    const rail = thumbRailRef.current;
    const active = rail?.children[index] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The <dialog> element itself is as big as its own padding box, so
    // a click that lands outside the inner content but inside <dialog>
    // is a click on the backdrop area.
    if (event.target === dialogRef.current) onClose();
  }

  function toggleZoom() {
    setZoomed((z) => !z);
    setPan({ x: 0, y: 0 });
  }

  function handleImagePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!zoomed) return;
    dragOrigin.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    dragMoved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleImagePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    const origin = dragOrigin.current;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved.current = true;
    setPan({ x: origin.panX + dx, y: origin.panY + dy });
  }

  function handleImagePointerUp() {
    dragOrigin.current = null;
  }

  // A plain click/tap toggles zoom; the tail end of a pan drag (pointerup
  // fires right before click) must not also toggle it back off.
  function handleImageClick() {
    if (dragMoved.current) {
      dragMoved.current = false;
      return;
    }
    toggleZoom();
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (zoomed || count < 2) return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (zoomed || count < 2 || touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-label={`${current.alt || "Image preview"} — photo ${index + 1} of ${count}`}
      className="m-0 max-h-none max-w-none border-0 bg-brand-neutral-1000 p-0 outline-none open:flex open:h-dvh open:w-dvw open:flex-col backdrop:bg-brand-neutral-1000"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="font-poppins text-body-s font-medium text-white/80">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleZoom}
            className="flex size-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            aria-pressed={zoomed}
          >
            {zoomed ? <ZoomOutIcon className="size-5" /> : <ZoomInIcon className="size-5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Close image preview"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {count > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-1 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4"
            aria-label="Previous photo"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
        ) : null}

        <div
          className={cn(
            "relative size-full max-h-full max-w-full touch-pan-y overflow-hidden",
            zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
          )}
          onClick={handleImageClick}
          onPointerDown={handleImagePointerDown}
          onPointerMove={handleImagePointerMove}
          onPointerUp={handleImagePointerUp}
          onPointerLeave={handleImagePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            sizes="100vw"
            draggable={false}
            className="object-contain transition-transform duration-200 ease-out select-none"
            style={{
              transform: zoomed
                ? `scale(${ZOOM_SCALE}) translate(${pan.x / ZOOM_SCALE}px, ${pan.y / ZOOM_SCALE}px)`
                : undefined,
            }}
          />
        </div>

        {count > 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-1 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4"
            aria-label="Next photo"
          >
            <ChevronRightIcon className="size-6" />
          </button>
        ) : null}
      </div>

      {current.caption ? (
        <p className="px-6 pb-2 text-center font-poppins text-body-s text-white/70">{current.caption}</p>
      ) : null}

      {count > 1 ? (
        <div
          ref={thumbRailRef}
          // `justify-center-safe`, not plain `justify-center` (direct
          // request: center the thumbnail strip instead of it sitting
          // flush left when there are only a few photos) — the "safe"
          // variant falls back to left-aligned/scrollable-from-the-start
          // once the strip actually overflows its width, so a gallery
          // with enough photos to need `overflow-x-auto` doesn't lose
          // access to its first thumbnails behind the centered content
          // (a real risk with plain `justify-center` on an overflowing
          // flex row — https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content#safe).
          className="flex justify-center-safe gap-2 overflow-x-auto px-4 pb-4 pt-1 [&::-webkit-scrollbar]:hidden sm:px-6"
          style={{ scrollbarWidth: "none" }}
          aria-label="Photos"
        >
          {images.map((image, thumbIndex) => (
            <button
              key={image.src}
              type="button"
              aria-current={thumbIndex === index}
              aria-label={`Go to photo ${thumbIndex + 1}`}
              onClick={() => goTo(thumbIndex)}
              className={cn(
                "relative size-14 shrink-0 overflow-hidden rounded-md ring-2 ring-offset-2 ring-offset-black transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-16",
                thumbIndex === index ? "ring-white opacity-100" : "ring-transparent opacity-60 hover:opacity-90",
              )}
            >
              <Image
                src={image.src}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </dialog>
  );
}
