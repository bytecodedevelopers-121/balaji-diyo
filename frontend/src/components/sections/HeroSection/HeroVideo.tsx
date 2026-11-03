"use client";

import { useRef, useState } from "react";

const VIDEOS = ["/videos/hero-1.mp4", "/videos/hero-2.mp4"];

/**
 * Hero background: plays the clips in `VIDEOS` one after another, looping
 * the whole playlist. Muted/inline so autoplay is allowed; hidden for
 * `prefers-reduced-motion` (the poster image behind it shows instead).
 * `preload="metadata"` is load-bearing — see HeroSection's comment.
 */
export function HeroVideo() {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);

  function playNext() {
    setIndex((current) => (current + 1) % VIDEOS.length);
  }

  return (
    <video
      ref={ref}
      key={VIDEOS[index]}
      autoPlay
      muted
      playsInline
      preload="metadata"
      poster="/images/hero/hero-poster.jpg"
      aria-hidden="true"
      onEnded={playNext}
      onError={playNext}
      className="absolute inset-0 size-full object-cover motion-reduce:hidden"
    >
      <source src={VIDEOS[index]} type="video/mp4" />
    </video>
  );
}
