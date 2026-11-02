import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFeaturedTrips, getPopularTrips } from "@/features/trips/api/get-trips";
import { TripsCarousel } from "./TripsCarousel";

/**
 * "Holidays" / "Most Popular Journeys" — transcribed from
 * design-references/homepage.png (y≈1550–2360 at 1440px). Plain/white
 * background throughout (the black strip behind the cards read off the
 * screenshot doesn't exist in the real Figma file; corrected per
 * direct confirmation — see ServicesSection's comment for the same
 * correction). Card overlay text stays white regardless, since it
 * sits on each photo's own gradient scrim, not the section background.
 *
 * A second, separate trip-card section further down the reference
 * ("Trips" / "The 2026/27 Lineup", 3 cards) is `TripsLineupSection`,
 * built out 2026-08-27 — see that component's own comment.
 *
 * **API-integrated 2026-08-20**: pulls `GET /packages?isFeatured=true`
 * via `getFeaturedTrips()`. No `rating` field exists anywhere on
 * `Package` (the mock's "4.2 (48)" was never backed by real data), so
 * that badge is dropped for real cards rather than fabricated — revisit
 * if a real per-package rating aggregate ever gets built. Falls back to
 * the original 2 hardcoded cards only if no package is flagged
 * `isFeatured` yet, same empty-state precedent as `DepartureTable`.
 *
 * **Made clickable + scrollable 2026-08-24**: the source screenshot's
 * prev/next arrows were originally decorative (only 2 cards existed to
 * page through). Real data has 7 packages flagged `isFeatured` today, so
 * this now fetches up to 10 and hands them to `TripsCarousel` (a small
 * Client Component — scrolling needs a ref + click handlers) for a real
 * horizontally-scrollable row; each card links to its real package page
 * (`/${trip.slug}`).
 *
 * **Gained a second `dataSource` option 2026-09-22**: `getPopularTrips()`
 * (`GET /packages?isPopular=true`, ordered by each package's own
 * `popularSortOrder`) was added alongside the original `getFeaturedTrips()`
 * so callers can pick either pool. Direct feedback settled which section
 * uses which: the homepage keeps this "Most Popular Journeys" slot on the
 * *featured* pool (`dataSource="featured"`, the default — unchanged), and
 * `TripsLineupSection` further down ("Trips"/"The 2026/27 Lineup") is the
 * one that pulls the *popular* pool — see that component's own comment.
 * `dataSource="popular"` still exists on this component for any future
 * caller that wants it; nothing on the homepage currently passes it.
 */

const FALLBACK_TRIPS = [
  {
    id: "fallback-heli-tour",
    slug: "everest-base-camp-helicopter-tour",
    image: "/images/trips/featured-heli-tour.jpg",
    duration: "03 Days",
    title: "Everest Base Camp Helicopter Tour",
    priceFrom: "USD 1150",
  },
  {
    id: "fallback-annapurna-trek",
    slug: "annapurna-base-camp-trek",
    image: "/images/trips/featured-annapurna-trek.jpg",
    duration: "11 Days",
    title: "Annapurna Base Camp Trek",
    priceFrom: "USD 580",
  },
];

export async function PopularTripsSection({
  eyebrow,
  title = "Most Popular Journeys",
  description,
  dataSource = "featured",
}: {
  /** Overrides for reuse outside the homepage — e.g. the trip-enquiry thank-you page's "Explore More Trips" heading. Same data/carousel either way, only the copy changes. */
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Which pool to pull trips from — `"featured"` (default, `isFeatured`/`sortOrder`) or `"popular"` (`isPopular`/`popularSortOrder`, the homepage's actual "Most Popular Journeys" curation). */
  dataSource?: "featured" | "popular";
} = {}) {
  const featured = await (dataSource === "popular" ? getPopularTrips(10) : getFeaturedTrips(10));

  const trips =
    featured.length > 0
      ? featured.map((trip) => ({
          id: trip.id,
          slug: trip.slug,
          image: trip.imageUrl ?? "/images/trips/featured-heli-tour.jpg",
          duration: trip.duration && trip.durationType ? `${trip.duration} ${trip.durationType}` : undefined,
          title: trip.title,
          priceFrom: trip.priceFrom !== undefined ? `USD ${trip.priceFrom}` : undefined,
        }))
      : FALLBACK_TRIPS;

  // `py-[50px]` on one outer `<section>` with an internal `mt-[26px]`
  // between the heading and the carousel, was two separately-padded
  // inner `<div>`s (`py-16` then `py-10`) stacked with no shared section
  // wrapper — that gave this section an asymmetric 64px-top/40px-bottom
  // footprint, out of step with every sibling homepage section's plain,
  // symmetric `py-*` (2026-09-03, direct request, two passes — see
  // AboutSection.tsx's own comment for the fuller reasoning on both the
  // unification and the follow-up 6px trim).
  return (
    <section className="py-[2px] sm:py-[25px]">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-16">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="center"
          className="mx-auto max-w-xl"
        />
      </div>

      <div className="mt-[26px] px-6 md:px-16">
        <TripsCarousel trips={trips} />
      </div>
    </section>
  );
}
