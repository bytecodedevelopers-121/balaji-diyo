"use client";

import { useState } from "react";
import type { PackageDetail } from "../data";
import { EmptyNote } from "./SectionRow";

/** Accepts a bare YouTube id or a watch/short/embed URL. */
function youtubeId(value: string): string | null {
  const trimmed = value.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return match ? match[1] : null;
}

/** An uploaded video file (from the admin's drag-and-drop) rather than a YouTube link. */
function isVideoFile(value: string): boolean {
  return /\.(mp4|webm|mov|webp)(\?|$)/i.test(value.trim());
}

/**
 * "Video Reviews" — YouTube thumbnails with a play button; clicking one swaps
 * it for the embedded player. Shows a placeholder when the trip has no videos.
 */
export function VideoReviewsSection({ trip }: { trip: PackageDetail }) {
  const entries = (trip.videoIds ?? [])
    .map((value) => {
      const id = youtubeId(value);
      if (id) return { key: id, kind: "youtube" as const, id };
      if (isVideoFile(value)) return { key: value, kind: "file" as const, src: value };
      return null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section id="video-reviews" className="scroll-mt-32">
      <div className="rounded-sm bg-[#dcebf3] p-6 sm:p-8">
        <h3 className="text-[28px] leading-tight font-bold text-brand-neutral-900">Video Reviews</h3>
        {entries.length === 0 ? (
          <div className="mt-5">
            <EmptyNote>Video reviews from our travelers will be added soon.</EmptyNote>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) =>
              entry.kind === "file" ? (
                <div key={entry.key} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-brand-neutral-900">
                  {/\.webp(\?|$)/i.test(entry.src) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- animated WebP must stay unprocessed to keep animating
                    <img src={entry.src} alt={`${trip.title} video review`} className="size-full object-cover" />
                  ) : (
                    <video src={entry.src} controls playsInline preload="metadata" className="size-full object-cover" aria-label={`${trip.title} video review`} />
                  )}
                </div>
              ) : (
              <div key={entry.key} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-brand-neutral-900">
                {playing === entry.id ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${entry.id}?autoplay=1`}
                    title={`${trip.title} video review`}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 size-full"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(entry.id)}
                    aria-label={`Play ${trip.title} video review`}
                    className="group absolute inset-0 size-full text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- third-party YouTube thumbnail */}
                    <img src={`https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/80 transition-transform group-hover:scale-110">
                      <span className="ml-0.5 border-y-[7px] border-l-[12px] border-y-transparent border-l-brand-neutral-900" />
                    </span>
                    <span className="absolute inset-x-5 bottom-5 text-[15px] leading-tight font-semibold text-white">
                      {trip.title} Video Review
                      <span className="mt-2 block h-0.5 w-8 bg-white" />
                    </span>
                  </button>
                )}
              </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
