import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";

/** Just enough of `GET /packages`'s list-item shape to read a slug. */
interface PackageSlugItem {
  slug: string | null;
}

/**
 * All public package slugs, for `generateStaticParams` on both `/[slug]`
 * (via `resolve-content.ts`) and `/book-now/[slug]`. One over-fetch page
 * — same reasoning as `getUpcomingDepartures`/`getTrips`'s own
 * `perPage=100` — the packages table is small enough that real pagination
 * isn't needed here.
 */
export async function getAllPackageSlugs(): Promise<string[]> {
  const page = await apiFetch<Paginated<PackageSlugItem>>("/packages?perPage=200", {
    next: { revalidate: 900, tags: ["packages"] },
  });
  return page.items.map((item) => item.slug).filter((slug): slug is string => Boolean(slug));
}
