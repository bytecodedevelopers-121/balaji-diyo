"use client";

import Link from "next/link";
import { CarouselNavButton } from "@/components/ui/CarouselNavButton";
import { useScrollCarousel } from "@/hooks/useScrollCarousel";
import { FillImage } from "@/components/ui/FillImage";

export interface CarouselTile {
  label: string;
  href: string;
  image: string;
}

/**
 * The scrollable tile row for `JourneySection`, split into its own
 * Client Component the same way `BlogCarousel` is from `BlogSection` —
 * `useScrollCarousel` needs a ref + click handlers, while the section
 * itself stays a Server Component (it does the `getCategoryBySlug`
 * fetches).
 *
 * **Nav buttons added 2026-09-14** (direct request) — originally this
 * row had none at all (`JourneySection`'s own prior comment: "explicit
 * call to skip the arrow-button pattern the site's other carousels use,
 * since a fixed set of 4 tiles doesn't need paging controls"). Unlike
 * Trips/Trips Lineup/Blog, the desktop layout here isn't a carousel at
 * all — `md:grid md:grid-cols-4` shows all 4 tiles at once — so the
 * shared `CarouselNavButton` is shown only below `md` (`md:hidden`, the
 * mirror image of those other three carousels' now-removed
 * `hidden md:flex`), where it's the only page-through affordance
 * alongside native swipe.
 */
export function JourneyCarousel({ tiles }: { tiles: CarouselTile[] }) {
  const { scrollerRef, canScrollLeft, canScrollRight, scrollByPage } =
    useScrollCarousel<HTMLDivElement>([tiles]);

  return (
    <div className="relative">
      <CarouselNavButton
        direction="left"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollLeft}
        label="Previous adventures"
        className="md:hidden"
      />
      <CarouselNavButton
        direction="right"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollRight}
        label="Next adventures"
        className="md:hidden"
      />

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 py-3 scroll-px-5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-[9px] md:overflow-visible md:px-[9px] md:py-0"
      >
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group relative aspect-[314/460] w-[calc(100vw-40px)] shrink-0 snap-start overflow-hidden md:aspect-[3/4] md:h-auto md:w-full"
          >
            <FillImage
              src={tile.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" sizes="(min-width:1024px) 25vw, 70vw" />
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "var(--gradient-photo-scrim)" }}
              aria-hidden="true"
            />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-poppins text-heading-xl font-bold text-brand-neutral-000 uppercase">
              {tile.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
