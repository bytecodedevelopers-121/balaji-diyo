import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { PackageDetail } from "@/app/[slug]/data";
import { getPlaceSlugMaps } from "@/features/attractions/api/get-place-slug-map";
import { mapPackageDetail } from "../lib/map-package-detail";
import type { PackageResponse } from "../types/package-response.types";

/**
 * Fetches one package from `GET /packages/:slug` (the public, isActive-only
 * lookup — backend's `findPublicBySlug`) and maps it into the page's
 * `PackageDetail` shape via `mapPackageDetail`. Returns `null` on a 404,
 * same convention as `getTeamMemberBySlug`, so the `[slug]` resolver and
 * `/book-now/[slug]` can both call `notFound()` themselves.
 *
 * Tagged `"packages"` + a per-slug `` `package:${slug}` `` tag, matching
 * `getTeamMemberBySlug`'s own tagging convention, so a single package's
 * admin edit can revalidate just that page.
 */
export async function getPackageBySlug(slug: string): Promise<PackageDetail | null> {
  try {
    // In parallel, not sequential — `getPlaceSlugMaps` never throws
    // (see its own doc comment), so it can't affect this function's
    // 404 handling for the package fetch itself below.
    const [pkg, placeSlugMaps] = await Promise.all([
      apiFetch<PackageResponse>(`/packages/${slug}`, {
        next: { revalidate: 900, tags: ["packages", `package:${slug}`] },
      }),
      getPlaceSlugMaps(),
    ]);
    return mapPackageDetail(pkg, placeSlugMaps);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
