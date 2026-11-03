import Link from "next/link";
import { Clock, TrendingUp } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";
import type { CardTrip } from "@/components/ui/PackageCard";

/**
 * Compact photo card for the scattered Featured Trips layout. Local to this
 * section — the shared `PackageCard` used elsewhere is left untouched.
 */
export function FeaturedTripCard({ trip }: { trip: CardTrip }) {
  return (
    <Link
      href={`/${trip.slug}`}
      className="group block overflow-hidden rounded-[18px] bg-brand-neutral-000 shadow-[0_12px_28px_rgba(6,74,112,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-navy"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-brand-neutral-200">
        {trip.imageUrl ? (
          <FillImage
            src={trip.imageUrl}
            alt=""
            aria-hidden="true"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="240px"
          />
        ) : null}
        {trip.badge ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-pill bg-logo-sun px-2.5 py-1 text-[10px] font-bold text-logo-navy-dark shadow-sm">
            <TrendingUp aria-hidden="true" className="size-3" />
            {trip.badge}
          </span>
        ) : null}
      </span>
      <span className="block px-4 pt-3 pb-4">
        <span className="font-playfair-display block min-h-[2.6em] text-[14px] leading-[1.3] font-bold text-logo-navy-dark">
          {trip.title}
        </span>
        <span className="mt-2 flex items-center justify-between gap-2">
          {trip.duration && trip.durationType ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-logo-navy">
              <Clock aria-hidden="true" className="size-3 text-logo-sun" />
              {trip.duration} {trip.durationType.toLowerCase()}
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-pill bg-[#e8eef8] px-2.5 py-1 text-[11px] font-bold text-logo-navy-dark">
            {trip.priceFrom !== undefined ? `From US$${trip.priceFrom}` : "Contact us"}
          </span>
        </span>
      </span>
    </Link>
  );
}
