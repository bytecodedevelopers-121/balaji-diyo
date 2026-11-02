import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import type { TrekkingRoute } from "../types/trekking-route.types";

/**
 * Fetches one page of the public trekking-route listing from
 * `GET /package-maps`. Explicitly passes `isActive=true` — the endpoint
 * has no public/admin split the way blog's does, so an inactive trip
 * map would otherwise show up here too (see GetPackageMapsDto's own
 * comment on this filter being opt-in, admin listings keep seeing
 * everything).
 *
 * Real pagination, unlike getTeamMembers()'s "perPage=100, no real
 * paging" shortcut — there are 48 real trip maps today (legacy-migrated,
 * see [[boundless-legacy-migration]]), not a handful.
 *
 * Revalidation: PackageMapService (backend/src/modules/package-map/
 * package-map.service.ts) posts to `"trekking-routes"` on every mutation,
 * matching this tag exactly — a 900s time-based fallback either way.
 *
 * `categoryId` narrows to trip maps whose owning Package shares that
 * region/style category — TrekkingRouteDetailSection's own "Related
 * Maps" section (2026-09-03), mirroring `getBlogs`'s own `categoryId`
 * filter.
 */
export async function getTrekkingRoutes(
  page: number,
  perPage = 12,
  categoryId?: string,
): Promise<Paginated<TrekkingRoute>> {
  const params = new URLSearchParams({
    isActive: "true",
    page: String(page),
    perPage: String(perPage),
  });
  if (categoryId) params.set("categoryId", categoryId);

  return apiFetch<Paginated<TrekkingRoute>>(`/package-maps?${params.toString()}`, {
    next: { revalidate: 900, tags: ["trekking-routes"] },
  });
}
