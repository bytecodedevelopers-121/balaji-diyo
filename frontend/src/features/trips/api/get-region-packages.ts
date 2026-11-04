import { isApiEnvelope } from "@/lib/api/api-response";
import type { Paginated } from "@/types/api.types";
import { lowestPrice } from "../lib/lowest-price";
import type { RawPackagePriceGroup, Trip } from "../types/trip.types";

type RawRegionTrip = Trip & { priceGroups?: RawPackagePriceGroup[] };

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok || (isApiEnvelope(body) && body.status === "error")) return null;
  return (isApiEnvelope(body) ? body.data : body) as T | null;
}

/**
 * The packages in one category/region, for the destination menu — resolved
 * client-side from the category's slug: `GET /categories/slug/:slug` for its
 * id, then `GET /packages?categoryId=`. Same direct browser fetch as
 * `searchTrips` (the server-only `apiFetch` can't be imported here).
 * Resolves to `[]` when the category or its packages can't be found.
 */
export async function getRegionPackages(
  slug: string,
  options?: { signal?: AbortSignal; perPage?: number },
): Promise<Trip[]> {
  const category = await getJson<{ id: string }>(`/categories/slug/${encodeURIComponent(slug)}`, options?.signal);
  if (!category?.id) return [];
  const page = await getJson<Paginated<RawRegionTrip>>(`/packages?categoryId=${category.id}&perPage=${options?.perPage ?? 12}`, options?.signal);
  return (page?.items ?? []).map((item) => ({ ...item, priceFrom: lowestPrice(item.priceGroups) }));
}

/**
 * Every distinct package across several categories (a country plus its trip
 * types and regions), fetched in parallel. A category that is missing or fails
 * simply contributes nothing.
 */
export async function getCategoriesTrips(slugs: string[], options?: { signal?: AbortSignal }): Promise<Trip[]> {
  const lists = await Promise.all(
    [...new Set(slugs)].map((slug) => getRegionPackages(slug, { signal: options?.signal, perPage: 50 }).catch(() => [])),
  );
  const seen = new Set<string>();
  return lists.flat().filter((trip) => (seen.has(trip.id) ? false : (seen.add(trip.id), true)));
}
