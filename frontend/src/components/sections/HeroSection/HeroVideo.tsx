"use client";

import { useRef, useState } from "react";

/**
 * Hero background: plays the clips in the admin-chosen `videos` one after another, looping
 * the whole playlist. Muted/inline so autoplay is allowed; hidden for
 * `prefers-reduced-motion` (the poster image behind it shows instead).
 * `preload="metadata"` is load-bearing — see HeroSection's comment.
 */
export function HeroVideo({ videos, poster }: { videos: string[]; poster: string }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);

  function playNext() {
    setIndex((current) => (current + 1) % videos.length);
  }

  // No clips chosen: the poster photo (rendered by HeroSection) is the background.
  if (videos.length === 0) return null;
  const current = videos[index % videos.length];

  return (
    <video
      ref={ref}
      key={current}
      autoPlay
      muted
      playsInline
      preload="metadata"
      poster={poster}
      aria-hidden="true"
      onEnded={playNext}
      onError={playNext}
      className="absolute inset-0 size-full object-cover motion-reduce:hidden"
    >
      <source src={current} type={current.endsWith(".webm") ? "video/webm" : current.endsWith(".mov") ? "video/quicktime" : "video/mp4"} />
    </video>
  );
}
