import { getAllPackageSlugs, getPackageDetail, type PackageDetail } from "./data";
import { getTrekkingRegionDetail, TREKKING_REGION_SLUGS } from "@/features/trekking-regions/api/get-trekking-regions";
import type { TrekkingRegionDetail } from "@/features/trekking-regions/types/trekking-region.types";
import { getCategoryBySlug, getAllCategorySlugsWithPackages } from "@/features/trips/api/get-category-by-slug";
import { getTripsByCategory } from "@/features/trips/api/get-trips";
import type { Category } from "@/features/trips/types/category.types";
import type { Trip } from "@/features/trips/types/trip.types";
import type { PaginationMeta } from "@/types/api.types";

/**
 * Flat-URL content resolver for this route.
 *
 * The legacy site put every page — packages, blog posts, static pages,
 * destinations, stories — at a single top-level `/<slug>`, and the
 * migration needs to preserve those URLs exactly. The backend already
 * models this: `Package`/`Blog`/`Page`/`Place`/`Story` all resolve their
 * slug through a shared, polymorphic `UrlInfo` table keyed by
 * `ownerType` + `urlSlug` (see `backend/prisma/schema.prisma`) rather
 * than each having its own `slug` column — clearly built to support
 * exactly this "one flat namespace, many content types" resolution.
 *
 * There is no cross-type resolver endpoint on the backend yet (only a
 * per-module `findPublicBySlug`, each scoped to its own `ownerType`), so
 * this resolves client-side by trying each known content type in a
 * fixed priority order and returning the first hit — this function is
 * the seam to swap for a single `GET /resolve?slug=` call once that
 * endpoint exists, without changing `page.tsx`.
 *
 * IMPORTANT — uniqueness caveat: the backend's `UrlInfo` unique
 * constraint is `[ownerType, urlSlug]`, i.e. per content type, not
 * global. Two different content types could in principle claim the
 * same slug; if that ever happens, this resolver silently prefers
 * whichever type is checked first below. Confirmed clean against the
 * current migrated content as of this pass — re-check after any bulk
 * content import.
 *
 * Package detail, trekking-region, and real legacy category-browse pages
 * (e.g. `/nepal-peak-climbing` — see `features/trips/api/get-category-by-slug.ts`
 * for exactly which category slugs are real, not internal taxonomy) are
 * wired today. Add each new type here, in the same
 * order the real resolver will need to check them, as its template
 * ships — e.g.:
 *   const blog = await getBlogPostDetail(slug);
 *   if (blog) return { type: "blog", data: blog };
 *
 * "category" is checked last — least specific of the three, and real
 * content (a package/trekking-region) should always win a slug collision
 * if one somehow existed (none confirmed as of this pass).
 */
export interface CategoryDetail {
  category: Category;
  trips: Trip[];
  meta: PaginationMeta;
}

export type ResolvedContent =
  | { type: "package"; data: PackageDetail }
  | { type: "trekking-region"; data: TrekkingRegionDetail }
  | { type: "category"; data: CategoryDetail };

/**
 * `page` only ever affects the "category" branch — a package/trekking-
 * region slug resolves to one fixed detail page, not a paginated list,
 * so callers that don't need pagination-aware resolution (`generateMetadata`,
 * matching blog's and /map's own precedent of not varying metadata per
 * page) can just omit it.
 */
export async function resolveContentBySlug(slug: string, page = 1): Promise<ResolvedContent | null> {
  const trekkingRegion = await getTrekkingRegionDetail(slug, page);
  if (trekkingRegion) {
    return { type: "trekking-region", data: trekkingRegion };
  }

  const pkg = await getPackageDetail(slug);
  if (pkg) {
    return { type: "package", data: pkg };
  }

  const category = await getCategoryBySlug(slug);
  if (category) {
    const { items: trips, meta } = await getTripsByCategory(category.id, page);
    return { type: "category", data: { category, trips, meta } };
  }

  return null;
}

/** All slugs this resolver can currently serve, for `generateStaticParams`. */
export async function getAllResolvableSlugs(): Promise<string[]> {
  // Concatenate future content types' slug lists here as they're added,
  // e.g. [...getAllPackageSlugs(), ...getAllBlogSlugs(), ...].
  return [...(await getAllPackageSlugs()), ...TREKKING_REGION_SLUGS, ...(await getAllCategorySlugsWithPackages())];
}
