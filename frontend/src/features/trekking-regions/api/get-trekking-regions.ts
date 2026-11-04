import { apiFetch } from "@/lib/api/api-client";
import { toNumber } from "@/lib/decimal";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { sampleTripsForRegion } from "@/lib/sample-trips";
import type { Paginated } from "@/types/api.types";
import type { RawPackagePriceGroup, Trip } from "@/features/trips/types/trip.types";
import type { TrekkingRegion, TrekkingRegionDetail } from "../types/trekking-region.types";

export const TREKKING_REGION_SLUGS = [
  "everest-region-treks",
  "annapurna-region-treks",
  "langtang-region-treks",
  "restricted-area-trekking",
] as const;

const trekkingRegionSlugSet = new Set<string>(TREKKING_REGION_SLUGS);

type RawRegionTrip = Trip & {
  priceGroups?: RawPackagePriceGroup[];
  testimonials?: Array<{ reviewRating?: number | string | null }>;
};

function withCardStats(trip: RawRegionTrip): Trip {
  const prices = (trip.priceGroups ?? [])
    .map((group) => toNumber(group.offerUnitPrice) ?? toNumber(group.unitPrice))
    .filter((price): price is number => price !== undefined && price > 0);
  const ratings = (trip.testimonials ?? [])
    .map((review) => toNumber(review.reviewRating))
    .filter((rating): rating is number => rating !== undefined && rating > 0);

  return {
    ...trip,
    priceFrom: prices.length ? Math.min(...prices) : undefined,
    rating: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : undefined,
    reviewCount: ratings.length,
  };
}

/** Sample regions (used only while the database has none): menu slug → region title. */
const SAMPLE_REGION_TITLES: Record<string, string> = {
  "everest-region-treks": "Everest Region",
  "annapurna-region-treks": "Annapurna Region",
  "langtang-region-treks": "Langtang Region",
  "restricted-area-trekking": "Manaslu Region",
};

function sampleRegion(slug: string): TrekkingRegion | null {
  const title = SAMPLE_REGION_TITLES[slug];
  if (!SHOW_SAMPLE_DATA || !title) return null;
  const trips = sampleTripsForRegion(title);
  return {
    id: `sample-${slug}`,
    title,
    description: null,
    slug,
    parentId: null,
    imageUrl: trips[0]?.imageUrl ?? null,
    packageCount: trips.length,
  };
}

function sampleRegions(): TrekkingRegion[] {
  return Object.keys(SAMPLE_REGION_TITLES)
    .map(sampleRegion)
    .filter((region): region is TrekkingRegion => region !== null);
}

function sampleRegionDetail(slug: string): TrekkingRegionDetail | null {
  const region = sampleRegion(slug);
  if (!region) return null;
  return {
    region,
    trips: sampleTripsForRegion(region.title),
    meta: { currentPage: 1, totalPages: 1 },
  };
}

export async function getTrekkingRoutesCategory(): Promise<TrekkingRegion> {
  return apiFetch<TrekkingRegion>("/categories/slug/trekking-routes-in-nepal", {
    next: { revalidate: 900, tags: ["trekking-regions"] },
  });
}

/**
 * Resolves to `[]` instead of throwing when the parent category is missing
 * or the API is unreachable, so a missing record (e.g. an empty production
 * database during `next build`) can't fail prerendering of the overview page.
 */
export async function getTrekkingRegions(): Promise<TrekkingRegion[]> {
  try {
    const parent = await getTrekkingRoutesCategory();
    const result = await apiFetch<Paginated<TrekkingRegion>>(
      `/categories?parentId=${parent.id}&isActive=true&perPage=50`,
      { next: { revalidate: 900, tags: ["trekking-regions"] } },
    );
    const regions = result.items.filter((region) => region.slug && trekkingRegionSlugSet.has(region.slug));
    return regions.length > 0 ? regions : sampleRegions();
  } catch {
    return sampleRegions();
  }
}

export async function getTrekkingRegionDetail(slug: string, page = 1): Promise<TrekkingRegionDetail | null> {
  if (!trekkingRegionSlugSet.has(slug)) return null;

  try {
    const region = await apiFetch<TrekkingRegion>(`/categories/slug/${slug}`, {
      next: { revalidate: 900, tags: ["trekking-regions", `trekking-region-${slug}`] },
    });
    const result = await apiFetch<Paginated<RawRegionTrip>>(
      `/packages?categoryId=${region.id}&page=${page}&perPage=6`,
      { next: { revalidate: 900, tags: ["trips", `trekking-region-${slug}`] } },
    );
    return { region, trips: result.items.map(withCardStats), meta: result.meta };
  } catch {
    return sampleRegionDetail(slug);
  }
}
