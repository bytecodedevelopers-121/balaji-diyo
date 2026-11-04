"use client";

import { Camera, Heart } from "lucide-react";
import { toggleWishlist, useWishlist, type WishlistItem } from "@/features/wishlist/wishlist-store";
import { SharePopover } from "./SharePopover";

const roundButton =
  "grid size-9 place-items-center rounded-full bg-logo-navy text-white transition-opacity hover:opacity-90";

/** Title-bar quick actions: jump to the photo gallery, save to the wishlist, share. */
export function TripActions({ item, url }: { item: WishlistItem; url: string }) {
  const saved = useWishlist().some((i) => i.slug === item.slug);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="View photos"
        onClick={() => document.getElementById("trip-hero")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className={roundButton}
      >
        <Camera aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        onClick={() => toggleWishlist(item)}
        className={roundButton}
      >
        <Heart aria-hidden="true" className="size-4" fill={saved ? "#f8c028" : "currentColor"} stroke={saved ? "#f8c028" : "currentColor"} />
      </button>
      <SharePopover url={url} title={item.title} iconOnly />
    </div>
  );
}
