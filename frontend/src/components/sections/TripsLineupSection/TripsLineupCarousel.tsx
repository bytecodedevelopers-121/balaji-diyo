"use client";

import Link from "next/link";
import { CarouselNavButton } from "@/components/ui/CarouselNavButton";
import { useScrollCarousel } from "@/hooks/useScrollCarousel";
import { FillImage } from "@/components/ui/FillImage";

export interface LineupTrip {
  id: string;
  slug: string;
  image: string;
  duration?: string;
  title: string;
  priceFrom?: string;
}

/**
 * The scrollable 3-up card row for `TripsLineupSection` ("Trips" / "The
 * 2026/27 Lineup"), transcribed from Figma Frame 1000006084. Same
 * scroll-by-page client pattern as `PopularTripsSection`'s
 * `TripsCarousel` (a ref + prev/next handlers), just a taller
 * portrait card (`h-[460px]`, full viewport width on mobile, and
 * `aspect-[4/5]` on desktop) shown 3-up instead of 2-up, and no "View
 * photos" pill — this mock only has the top-right arrow badge, the
 * duration pill, and the title/price, so the shared overlay content is
 * a straight subset of `TripsCarousel`'s. No star-rating badge either:
 * the mock shows one, but (per the same call already made on the
 * Holidays row) there's no real rating field on `Package` in the
 * backend to back it with — see `PopularTripsSection.tsx`'s own
 * comment for that precedent.
 *
 * Card width was a fixed `390px` below `md` until 2026-09-22 — broke at
 * viewport widths under ~430px (e.g. 540×720), the exact "only matched
 * one device width" mistake `TripsCarousel`'s own comment already
 * warned about. Now `w-full` like that carousel, with no scroller
 * padding, so `CarouselNavButton`'s `left-0`/`right-0` sits flush on
 * the one visible card at every width instead of drifting onto the
 * next one.
 *
 * Nav buttons use the shared `CarouselNavButton` / `useScrollCarousel`
 * — see `TripsCarousel`'s own comment for why (standardized 2026-08-27
 * across Trips/Trips Lineup/Blog/Testimonials). **Shown on mobile too,
 * 2026-09-14** (direct request) — see `TripsCarousel`'s own comment for
 * the same change there; was previously hidden below `md`.
 */
export function TripsLineupCarousel({ trips }: { trips: LineupTrip[] }) {
  const { scrollerRef, canScrollLeft, canScrollRight, scrollByPage } =
    useScrollCarousel<HTMLDivElement>([trips]);

  return (
    <div className="relative mx-auto w-full max-w-[1312px]">
      <CarouselNavButton
        direction="left"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollLeft}
        label="Previous trips"
      />
      <CarouselNavButton
        direction="right"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollRight}
        label="Next trips"
      />

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={`/${trip.slug}`}
            className="group relative h-[460px] w-full shrink-0 snap-start overflow-hidden rounded-[24px] md:aspect-[4/5] md:h-auto md:basis-[calc(33.333%-16px)]"
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
