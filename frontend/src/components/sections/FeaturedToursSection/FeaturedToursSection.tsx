import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import type { CardTrip } from "@/components/ui/PackageCard";
import { FeaturedTripCard } from "./FeaturedTripCard";
import { getFeaturedTrips } from "@/features/trips/api/get-trips";

/**
 * "10 Best Tours & Holidays for 2026" — same card grid as the Best Sellers
 * section, fed by the admin's "featured" pool (`isFeatured`). Renders
 * nothing when there are no trips, so an empty or unreachable API never
 * leaves a bare heading.
 */
const TOURS_PAGE = "/nepal-tour-packages";


/** Desktop scatter positions around the centred heading: left %, top px, tilt deg. */
const SLOTS = [
  { x: 2.4, y: 77, r: -9 },
  { x: 20.2, y: 15, r: 6 },
  { x: 53.4, y: 15, r: -6 },
  { x: 76.5, y: 35, r: 8 },
  { x: 8.9, y: 350, r: 6 },
  { x: 78.5, y: 305, r: -8 },
  { x: 0.8, y: 585, r: -5 },
  { x: 35.6, y: 615, r: 5 },
  { x: 63.6, y: 635, r: -7 },
  { x: 82.2, y: 575, r: 8 },
]

export async function FeaturedToursSection() {
  const trips: CardTrip[] = await getFeaturedTrips(10).catch(() => []);
  if (trips.length === 0) return null;

  return (
    <section className="overflow-hidden bg-site-bg px-4 pt-12 pb-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="relative mx-auto w-full max-w-[1240px]">
        <div className="mb-8 flex justify-center min-[1120px]:pointer-events-none min-[1120px]:absolute min-[1120px]:inset-x-0 min-[1120px]:top-[46%] min-[1120px]:z-10 min-[1120px]:mb-0 min-[1120px]:-translate-y-1/2">
          <div className="pointer-events-auto flex w-full max-w-[420px] flex-col items-center text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-pill border border-logo-sun/50 bg-logo-sun/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-logo-navy uppercase">
              <Mountain aria-hidden="true" className="size-3.5" />
              Featured Trips
              <span aria-hidden="true">/</span>
              {trips.length} Handpicked
            </p>
            <h2 className="font-playfair-display text-[clamp(28px,6vw,44px)] leading-[1.1] font-bold text-logo-navy-dark">
              10 Best Tours &amp;
              <span className="block text-logo-sun italic">Holidays for 2026</span>
            </h2>
            <p className="mt-4 max-w-[340px] text-body-s text-brand-neutral-800">
              Handcrafted Himalayan adventures — treks, tours, safaris and scenic escapes, all led by local experts.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={TOURS_PAGE}
                className="inline-flex items-center gap-2 rounded-pill border border-logo-sun bg-brand-neutral-000 px-5 py-2 text-body-s font-semibold text-logo-navy shadow-sm transition-colors hover:bg-logo-sun"
              >
                View All Tours
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-x-5 gap-y-9 min-[640px]:grid-cols-2 min-[1120px]:block min-[1120px]:h-[880px]">
          {trips.map((trip, i) => {
            const slot = SLOTS[i % SLOTS.length];
            return (
              <li
                key={trip.id}
                className="group/slot min-[1120px]:absolute min-[1120px]:left-(--x) min-[1120px]:top-(--y) min-[1120px]:z-0 min-[1120px]:w-[220px] min-[1120px]:rotate-(--r) min-[1120px]:transition-transform min-[1120px]:duration-300 min-[1120px]:hover:z-20 min-[1120px]:hover:rotate-0 min-[1120px]:hover:scale-105"
                style={{ "--x": `${slot.x}%`, "--y": `${slot.y}px`, "--r": `${slot.r}deg` } as React.CSSProperties}
              >
                <div className="min-[1120px]:trip-float" style={{ animationDelay: `${(i % 5) * -1.2}s` }}>
                  <FeaturedTripCard trip={trip} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
