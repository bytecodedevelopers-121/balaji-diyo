import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import { getPopularTrips } from "@/features/trips/api/get-trips";
import { PackageCard, type CardTrip } from "@/components/ui/PackageCard";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { SAMPLE_TREKS } from "@/lib/sample-trips";

/**
 * "10 Best Treks – Offered for 2026" — a 4-up grid of trek cards right
 * under the hero (photo, rating, duration, title, "Price from"). Data is
 * the admin-curated "popular" pool (`isPopular`, ordered by
 * `popularSortOrder`). Renders nothing when there are no trips, so an
 * empty or unreachable API never leaves a bare heading.
 */
const TREKS_PAGE = "/trekking-routes-in-nepal";



export async function BestTreksSection() {
  const fetched: CardTrip[] = await getPopularTrips(8).catch(() => []);
  const trips =
    fetched.length === 0 && SHOW_SAMPLE_DATA ? SAMPLE_TREKS : fetched;
  if (trips.length === 0) return null;

  return (
    <section className="bg-site-bg px-4 pt-6 pb-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy">
              <Mountain aria-hidden="true" className="size-4" />
              Best Sellers
            </p>
            <h2 className="font-display text-[clamp(22px,5vw,32px)] leading-tight font-bold text-brand-neutral-1000">
              10 Best Treks – Offered for 2026
            </h2>
          </div>
          <Link
            href={TREKS_PAGE}
           className="hidden shrink-0 items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy transition-colors hover:bg-logo-sun sm:inline-flex"
          >
            View All Treks
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
          href={TREKS_PAGE}
         className="mt-6 inline-flex items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy sm:hidden"
        >
          View All Treks
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
export { SAMPLE_TREKS };