import { apiFetch } from "@/lib/api/api-client";
import { toNumber } from "@/lib/decimal";
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
    return regions;
  } catch {
    return [];
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
    return null;
  }
}
