import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import type { CardTrip } from "@/components/ui/PackageCard";
import { FeaturedTripCard } from "./FeaturedTripCard";
import { getFeaturedTrips } from "@/features/trips/api/get-trips";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";

/**
 * "10 Best Tours & Holidays for 2026" — same card grid as the Best Sellers
 * section, fed by the admin's "featured" pool (`isFeatured`). Renders
 * nothing when there are no trips, so an empty or unreachable API never
 * leaves a bare heading.
 */
const TOURS_PAGE = "/nepal-tour-packages";

/**
 * Sample cards shown when the API has no featured
 * trips yet (fresh/empty database). Controlled by `SHOW_SAMPLE_DATA` (see lib/sample-data.ts).
 */
const SAMPLE_TOURS: CardTrip[] = [
  { id: "t1", slug: "nepal-tour-packages", title: "Spirit of Nepal Tour", imageUrl: "/images/journey/tour.jpg", duration: 10, durationType: "Days", priceFrom: 600, rating: 5, reviewCount: 10, badge: "Nepal Highlights" },
  { id: "t2", slug: "bhutan-tours", title: "Nepal and Bhutan Highlights", imageUrl: "/images/hero/hero-2.jpeg", duration: 12, durationType: "Days", priceFrom: 2200, rating: 5, reviewCount: 4, badge: "Two Countries" },
  { id: "t3", slug: "nepal-helicopter-tours", title: "Everest Base Camp Helicopter Tour with Landing", imageUrl: "/images/journey/heli.jpg", duration: 5, durationType: "Hours", priceFrom: 1400, badge: "Best Heli Tour" },
  { id: "t4", slug: "nepal-day-tours", title: "Kathmandu Day Tour - 1 Full Day", imageUrl: "/images/hero/hero-3.jpeg", duration: 1, durationType: "Day", priceFrom: 32, rating: 5, reviewCount: 6, badge: "Best of Kathmandu" },
  { id: "t5", slug: "nepal-tour-packages", title: "Nepal Premium Adventure", imageUrl: "/images/hero/hero-4.jpeg", duration: 12, durationType: "Days", priceFrom: 1200 },
  { id: "t6", slug: "nepal-tour-packages", title: "Chitwan Jungle Safari", imageUrl: "/images/hero/hero-1.png", duration: 3, durationType: "Days", priceFrom: 200, rating: 5, reviewCount: 3, badge: "Jungle Adventure" },
  { id: "t7", slug: "bhutan-tours", title: "Bhutan Highlights Tour", imageUrl: "/images/hero/12.jpeg", duration: 5, durationType: "Days", priceFrom: 1570, badge: "Bhutan Highlights" },
  { id: "t8", slug: "nepal-helicopter-tours", title: "Everest Heli Tour with Stay at Everest View Hotel", imageUrl: "/images/trips/featured-heli-tour.jpg", duration: 2, durationType: "Days", priceFrom: 3000, badge: "Himalayan Luxury Tour" },
];

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
  const fetched: CardTrip[] = await getFeaturedTrips(8).catch(() => []);
  const trips =
    fetched.length === 0 && SHOW_SAMPLE_DATA ? SAMPLE_TOURS : fetched;
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
