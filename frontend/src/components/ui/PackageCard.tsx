import Link from "next/link";
import { CalendarDays, Camera, Heart, Medal, Star } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";
import type { Trip } from "@/features/trips/types/trip.types";

export type CardTrip = Trip & { badge?: string };

/**
 * Shared package/trip card: photo, rating + duration row, title, price.
 * Used by the homepage Best Sellers grid and the category / trekking-region
 * listing pages. `badge` is an optional yellow corner label (no backend
 * field yet, so only set by callers that have one).
 */
export function PackageCard({ trip }: { trip: CardTrip }) {
  const hasRating = trip.rating !== undefined && trip.reviewCount;
  return (
    <div className="h-full">
      <Link
        href={`/${trip.slug}`}
        className="group relative flex h-full flex-col transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-navy"
      >
        {/* Photo, with the white details card tucked slightly over its bottom edge. */}
        <span className="relative block aspect-[3/2] w-full overflow-hidden rounded-[10px] bg-brand-neutral-200">
          {trip.imageUrl ? (
            <FillImage
              src={trip.imageUrl}
              alt=""
              aria-hidden="true"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1120px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : null}
        </span>
        <span className="relative -mt-4 flex flex-1 flex-col rounded-[10px] bg-brand-neutral-000 px-5 pt-5 pb-5 shadow-[0_6px_22px_rgba(6,74,112,0.16)] transition-shadow duration-300 group-hover:shadow-[0_12px_30px_rgba(6,74,112,0.26)]">
          <span className="flex items-center justify-between gap-2 text-[13px] text-brand-neutral-800">
            {hasRating ? (
              <span className="flex items-center gap-2">
                <span className="flex" role="img" aria-label={`Rated ${trip.rating} out of 5`}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      className={
                        i < Math.round(trip.rating ?? 0)
                          ? "size-3.5 fill-logo-sun text-logo-sun"
                          : "size-3.5 text-brand-neutral-400"
                      }
                    />
                  ))}
                </span>
                {trip.reviewCount} {trip.reviewCount === 1 ? "review" : "reviews"}
              </span>
            ) : (
              <span />
            )}
            {trip.duration && trip.durationType ? (
              <span className="flex items-center gap-2 text-[14px]">
                <span className="grid size-8 place-items-center rounded-full bg-logo-sun/25 text-[#d98a00]">
                  <CalendarDays aria-hidden="true" className="size-4" />
                </span>
                {trip.duration} {trip.durationType}
              </span>
            ) : null}
          </span>

          <span className="mt-4 text-[22px] leading-snug font-bold text-logo-navy">{trip.title}</span>

          <span aria-hidden="true" className="mt-5 flex gap-2.5 text-[#8aa2bd]">
            {[Camera, Heart].map((Icon, i) => (
              <span key={i} className="grid size-10 place-items-center rounded-full bg-[#dbe6f1]">
                <Icon className="size-[18px]" />
              </span>
            ))}
          </span>

          <span className="mt-auto flex items-center gap-3 pt-6">
            <span className="text-[15px] text-brand-neutral-800">Price from</span>
            <span aria-hidden="true" className="h-px flex-1 bg-brand-neutral-300" />
          </span>
          <span className="mt-1 text-[24px] leading-none font-bold text-[#d98a00]">
            {trip.priceFrom !== undefined ? `US$${trip.priceFrom}` : "Contact us"}
          </span>

          {trip.badge ? (
            <span className="absolute -right-2 bottom-4 flex items-center gap-1.5 rounded-[7px] bg-logo-sun px-3 py-2 text-[12px] leading-none font-bold text-logo-navy-dark uppercase shadow-[0_4px_12px_rgba(6,74,112,0.25)]">
              <Medal aria-hidden="true" className="size-4" />
              {trip.badge}
            </span>
          ) : null}
        </span>
      </Link>
    </div>
  );
}
