import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import { lowestPrice } from "../lib/lowest-price";
import type { RawPackagePriceGroup, Trip } from "../types/trip.types";

/**
 * Fetches the public trip (package) listing from `GET /packages`.
 *
 * The customize-trip page uses this list for its searchable package
 * selector. The homepage's PopularTripsSection remains independent.
 * Fetch enough rows for the selector in one request and cache them under
 * the shared `"trips"` tag.
 */
export async function getTrips(): Promise<Trip[]> {
  const page = await apiFetch<Paginated<Trip>>("/packages?perPage=100", {
    next: { revalidate: 3600, tags: ["trips"] },
  });
  return page.items;
}

/** Raw list-item shape from `GET /packages` — just the fields `getFeaturedTrips` reads, not the full `packageInclude` payload. */
type RawFeaturedTrip = Trip & { priceGroups?: RawPackagePriceGroup[] };

/** Re-exported for map-package-detail.ts's own `priceFrom` — same "lowest real PriceGroup price, offer preferred" rule. */
export { lowestPrice };

/**
 * Fetches the homepage's featured trips (`GET /packages?isFeatured=true`)
 * for `PopularTripsSection`. Separate from `getTrips()` above — that one
 * pulls the full unfiltered list for a selector, this pulls a small
 * curated set and derives `priceFrom` from each package's real
 * PriceGroup rows (`Package.price` itself is unused/0 on real migrated
 * data, see `Trip.priceFrom`'s own comment).
 */
export async function getFeaturedTrips(limit = 2): Promise<Trip[]> {
  const page = await apiFetch<Paginated<RawFeaturedTrip>>(
    `/packages?isFeatured=true&perPage=${limit}`,
    { next: { revalidate: 3600, tags: ["trips"] } },
  );
  return page.items.map((item) => ({ ...item, priceFrom: lowestPrice(item.priceGroups) }));
}

/**
 * Fetches the homepage's "Most Popular Journeys" trips
 * (`GET /packages?isPopular=true`), ordered by each package's own
 * `popularSortOrder` — independent of `getFeaturedTrips()` above (own flag,
 * own sort field), so an admin can curate/order this section without
 * touching the Featured carousel or "The 2026/27 Lineup".
 */
export async function getPopularTrips(limit = 10): Promise<Trip[]> {
  const page = await apiFetch<Paginated<RawFeaturedTrip>>(
    `/packages?isPopular=true&perPage=${limit}`,
    { next: { revalidate: 3600, tags: ["trips"] } },
  );
  return page.items.map((item) => ({ ...item, priceFrom: lowestPrice(item.priceGroups) }));
}

/**
 * Fetches one page of real packages tagged under one real legacy
 * category-browse page (`GET /packages?categoryId=`, the many-to-many
 * `Package.categories` relation — confirmed already supported
 * server-side) — used by the flat `/<slug>` resolver's "category"
 * content type (see `get-category-by-slug.ts`), the real destination
 * `JourneySection`'s tiles link to. Paginated 6-per-page, the same way as
 * BlogListingSection, driving the same shared `Pagination` component.
 */
export async function getTripsByCategory(
  categoryId: string,
  page = 1,
  perPage = 6,
): Promise<Paginated<Trip>> {
  const result = await apiFetch<Paginated<RawFeaturedTrip>>(
    `/packages?categoryId=${categoryId}&page=${page}&perPage=${perPage}`,
    { next: { revalidate: 3600, tags: ["trips", `category:${categoryId}`] } },
  );
  return {
    items: result.items.map((item) => ({ ...item, priceFrom: lowestPrice(item.priceGroups) })),
    meta: result.meta,
  };
}
