"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WebStory } from "@/features/site-content/types";

const SLIDE_MS = 5000;

/** Full-screen story viewer: progress bars, auto-advance, tap right/left to go forward/back. */
export function StoryViewer({ story }: { story: WebStory }) {
  const [index, setIndex] = useState(0);
  const last = story.slides.length - 1;
  const slide = story.slides[index]!;
  const isVideo = !!slide.video;
  // Video slides advance when the clip ends; the progress bar runs for its length.
  const [videoSeconds, setVideoSeconds] = useState<number | null>(null);

  useEffect(() => {
    setVideoSeconds(null);
  }, [index]);

  useEffect(() => {
    if (index >= last || isVideo) return;
    const timer = window.setTimeout(() => setIndex((i) => i + 1), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, last, isVideo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
      else if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [last]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="relative h-full w-full max-w-[460px] overflow-hidden bg-brand-neutral-1000 md:h-[92vh] md:rounded-[14px]">
        {slide.video ? (
          <video
            key={slide.video}
            src={slide.video}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={(e) => setVideoSeconds(e.currentTarget.duration)}
            onEnded={() => setIndex((i) => Math.min(last, i + 1))}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.image} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        <div className="absolute inset-x-3 top-3 flex gap-1" aria-hidden="true">
          {story.slides.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
              <span
                // key restarts the fill animation each time this bar becomes the active one
                key={i === index ? `active-${index}` : `idle-${i}`}
                className={`block h-full bg-white ${i < index ? "w-full" : "w-0"}`}
                style={
                  i === index && (!isVideo || videoSeconds)
                    ? { animation: `story-fill ${isVideo ? videoSeconds : SLIDE_MS / 1000}s linear forwards` }
                    : undefined
                }
              />
            </span>
          ))}
        </div>

        <div className="absolute inset-x-3 top-8 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-white">{story.title}</p>
          <Link
            href="/travel-web-stories"
            aria-label="Close story"
            className="grid size-9 place-items-center rounded-full bg-black/40 text-xl text-white"
          >
            ×
          </Link>
        </div>

        <button
          type="button"
          aria-label="Previous story"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="absolute inset-y-20 left-0 w-1/3"
        />
        <button
          type="button"
          aria-label="Next story"
          onClick={() => (index >= last ? undefined : setIndex(index + 1))}
          className="absolute inset-y-20 right-0 w-2/3"
        />

        <button
          type="button"
          aria-label="Previous"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl text-brand-neutral-1000 shadow transition-opacity hover:bg-white disabled:opacity-30"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => setIndex((i) => Math.min(last, i + 1))}
          disabled={index === last}
          className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl text-brand-neutral-1000 shadow transition-opacity hover:bg-white disabled:opacity-30"
        >
          ›
        </button>

        <p className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-10 text-[20px] leading-snug font-semibold text-white">
          {slide.caption}
        </p>
      </div>
      <style>{`@keyframes story-fill { from { width: 0 } to { width: 100% } }`}</style>
    </div>
  );
}
