"use client";

import { tripHref } from "@/lib/trip-href";
import Link from "next/link";
import { CarouselNavButton } from "@/components/ui/CarouselNavButton";
import { useScrollCarousel } from "@/hooks/useScrollCarousel";
import { FillImage } from "@/components/ui/FillImage";

export interface CarouselTrip {
  id: string;
  slug: string;
  image: string;
  duration?: string;
  title: string;
  priceFrom?: string;
}

/**
 * The scrollable card row for `PopularTripsSection` — split into its own
 * Client Component because scrolling needs a ref + click handlers, while
 * the section itself stays a Server Component (it does the `getFeaturedTrips`
 * fetch). Cards link to the real package detail page (tripHref(trip.slug),
 * same flat-URL route `[slug]/page.tsx` resolves); the prev/next buttons
 * were previously decorative (`aria-hidden`/`tabIndex={-1}`, no data to
 * page through) — now real, since the section can pull more than 2
 * featured packages.
 *
 * **Restyled 2026-08-27** onto the shared `CarouselNavButton` /
 * `useScrollCarousel` (a dark circle overlaid inset on the card).
 * Standardized so Trips/Trips Lineup/Blog/Testimonials all share one
 * carousel-nav look instead of four near-identical copies.
 *
 * **Shown on mobile too, 2026-09-14** (direct request) — originally
 * hidden below `md` (`hidden md:flex`) on the reasoning that the row
 * already scrolls fine on swipe and each full-viewport-width card
 * (`w-full` — a fixed `390px` was tried first per a literal Figma-frame
 * number, but that only matched one device width) left no comfortable
 * spot for a button. `CarouselNavButton` was always designed to overlay
 * flush on the card edge rather than sit in an outer gutter specifically
 * so it *can* work at any breakpoint (see that component's own comment)
 * — this just stops opting out of that on mobile.
 */
export function TripsCarousel({ trips }: { trips: CarouselTrip[] }) {
  const { scrollerRef, canScrollLeft, canScrollRight, scrollByPage } =
    useScrollCarousel<HTMLDivElement>([trips]);

  return (
    <div className="relative mx-auto w-full max-w-[1312px]">
      <CarouselNavButton
        direction="left"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollLeft}
        label="Previous journeys"
      />
      <CarouselNavButton
        direction="right"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollRight}
        label="Next journeys"
      />

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={tripHref(trip.slug)}
            className="group relative h-[460px] w-full shrink-0 snap-start overflow-hidden rounded-card md:aspect-[5/4] md:h-auto md:basis-[calc(50%-12px)]"
          >
            <FillImage
              src={trip.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105" sizes="(min-width:1024px) 25vw, 80vw" />
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "var(--gradient-photo-scrim)" }}
              aria-hidden="true"
            />

            <span className="absolute top-6 left-6 rounded-pill border border-secondary-500 bg-secondary-500/20 px-4 py-[5px] text-body-m font-medium text-secondary-500">
              View photos
            </span>
            <span
              aria-hidden="true"
              className="absolute top-6 right-6 flex size-10 items-center justify-center rounded-full bg-brand-neutral-000 text-brand-neutral-1000"
            >
              <ArrowUpRightIcon />
            </span>

            <div className="absolute right-6 bottom-6 left-6 text-brand-neutral-000">
              {trip.duration && (
                <div className="flex items-center gap-3 text-body-m">
                  <span className="rounded-pill border border-brand-neutral-000/60 px-3 py-1 capitalize">
                    {trip.duration}
                  </span>
                </div>
              )}
              <p className="mt-3 text-heading-xl font-bold">{trip.title}</p>
              <p className="mt-1 text-body-m">
                from <span className="font-bold">{trip.priceFrom ?? "Contact us"}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}
