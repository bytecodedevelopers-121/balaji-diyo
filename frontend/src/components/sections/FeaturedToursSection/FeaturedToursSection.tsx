import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import { PackageCard, type CardTrip } from "@/components/ui/PackageCard";
import { getFeaturedTrips } from "@/features/trips/api/get-trips";

/**
 * "10 Best Tours & Holidays for 2026" — same card grid as the Best Sellers
 * section, fed by the admin's "featured" pool (`isFeatured`). Renders
 * nothing when there are no trips, so an empty or unreachable API never
 * leaves a bare heading.
 */
const TOURS_PAGE = "/nepal-tour-packages";

/**
 * Sample cards shown ONLY in development when the API has no featured
 * trips yet (fresh/empty database). Never rendered in production.
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

export async function FeaturedToursSection() {
  const fetched: CardTrip[] = await getFeaturedTrips(8).catch(() => []);
  const trips =
    fetched.length === 0 && process.env.NODE_ENV !== "production" ? SAMPLE_TOURS : fetched;
  if (trips.length === 0) return null;

  return (
    <section className="bg-site-bg px-4 pt-12 pb-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto w-full max-w-[1280px]">
        <div suppressHydrationWarning className="reveal mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy">
              <Mountain aria-hidden="true" className="size-4" />
              Featured Trips
            </p>
            <h2 className="font-display text-[clamp(22px,5vw,32px)] leading-tight font-bold text-brand-neutral-1000">
              10 Best Tours &amp; Holidays for 2026
            </h2>
          </div>
          <Link
            href={TOURS_PAGE}
            className="hidden shrink-0 items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy transition-colors hover:bg-logo-sun sm:inline-flex"
          >
            View All Tours
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-x-5 gap-y-9 min-[640px]:grid-cols-2 min-[1120px]:grid-cols-4">
          {trips.map((trip) => (
            <li key={trip.id}>
              <PackageCard trip={trip} />
            </li>
          ))}
        </ul>

        <Link
          href={TOURS_PAGE}
          className="mt-6 inline-flex items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy sm:hidden"
        >
          View All Tours
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
