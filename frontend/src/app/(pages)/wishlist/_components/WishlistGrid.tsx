"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PackageCard } from "@/components/ui/PackageCard";
import { WISHLIST_DEFAULTS, type WishlistContent } from "@/features/page-content/wishlist-defaults";
import { toggleWishlist, useWishlist } from "@/features/wishlist/wishlist-store";

/** Trips saved with the heart on a package page, as the same cards used across the site. */
export function WishlistGrid({ content = WISHLIST_DEFAULTS.content }: { content?: WishlistContent["content"] } = {}) {
  const items = useWishlist();

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <EmptyState
          title={content.emptyTitle}
          description={content.emptyText}
          action={
            <Link href={content.buttonHref} className="mt-2 font-semibold text-logo-navy underline">
              {content.buttonLabel}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug} className="relative">
          <PackageCard trip={item} />
          <button
            type="button"
            onClick={() => toggleWishlist(item)}
            aria-label={`Remove ${item.title} from wishlist`}
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-logo-navy shadow transition-colors hover:bg-logo-sun"
          >
            <Heart aria-hidden="true" className="size-4" fill="#f8c028" stroke="#d98a00" />
          </button>
        </li>
      ))}
    </ul>
  );
}
