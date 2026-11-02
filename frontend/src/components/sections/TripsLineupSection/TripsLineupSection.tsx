import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPopularTrips } from "@/features/trips/api/get-trips";
import { TripsLineupCarousel } from "./TripsLineupCarousel";

/**
 * "Trips" / "The 2026/27 Lineup" — the second, separate trip-card
 * section further down design-references/homepage.png, transcribed
 * from Figma Frame 1000006084 (fixed 1312px width, 24px top padding,
 * 44px gap between the heading and the card row). Previously left
 * unbuilt (see `PopularTripsSection.tsx`'s own comment for that
 * history) — built out 2026-08-27.
 *
 * **Switched to the `isPopular` pool 2026-09-22** (`getPopularTrips()`,
 * same call `PopularTripsSection` can make via its `dataSource` prop),
 * per direct feedback — "Most Popular Journeys" above shows featured
 * trips, this section shows popular ones, by explicit request. No more
 * tail-slice-to-dedup trick: that existed only because this section and
 * `PopularTripsSection` used to share the same `getFeaturedTrips()` pool;
 * now they're two independent pools so a straight fetch is enough.
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

export async function TripsLineupSection() {
  const popular = await getPopularTrips(9);

  const trips =
    popular.length > 0
      ? popular.map((trip) => ({
          id: trip.id,
          slug: trip.slug,
          image: trip.imageUrl ?? "/images/trips/featured-heli-tour.jpg",
          duration: trip.duration && trip.durationType ? `${trip.duration} ${trip.durationType}` : undefined,
          title: trip.title,
          priceFrom: trip.priceFrom !== undefined ? `USD ${trip.priceFrom}` : undefined,
        }))
      : FALLBACK_TRIPS;

  if (trips.length === 0) return null;

  // `py-[50px]`, was `py-16` then `py-14` — see AboutSection.tsx's own
  // comment (2026-09-03, two passes).
  return (
    <section className="bg-brand-neutral-000 py-[2px] sm:py-[25px]">
      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-[44px] pt-6 md:px-16">
        <SectionHeading
          eyebrow="Trips"
          title="The 2026/27 Lineup"
          description="A handpicked selection of trips for the upcoming season, across Nepal, Bhutan, and Tibet."
          align="center"
          className="mx-auto max-w-xl px-6 md:px-0"
        />
        <TripsLineupCarousel trips={trips} />
      </div>
    </section>
  );
}
