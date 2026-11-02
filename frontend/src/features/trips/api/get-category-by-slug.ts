import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import type { Paginated } from "@/types/api.types";
import type { Category } from "../types/category.types";

interface CategoryResponse {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  packageCount: number;
}

/**
 * Fetches one real legacy category-browse page (`GET
 * /categories/slug/:slug` — the public, isActive-only lookup, same
 * `findPublicBySlug` convention as team-member/blog/place) and maps it
 * into this page's `Category` shape. Returns `null` on a 404 *or* when
 * the category has no real packages tagged (`packageCount === 0`) — real
 * migrated data has 53 category slugs, but only ~13 of them are actual
 * browse pages with packages tagged via the many-to-many relation; the
 * rest are internal taxonomy dimensions (grade/meals/transportation/…)
 * that also happen to have a slug from the migration but were never
 * real public pages — resolving those would show a confusing empty grid
 * for a slug nobody should be linking to.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const category = await apiFetch<CategoryResponse>(`/categories/slug/${slug}`, {
      next: { revalidate: 900, tags: ["categories", `category:${slug}`] },
    });
    if (!category.slug || category.packageCount === 0) return null;
    return {
      id: category.id,
      title: category.title,
      slug: category.slug,
      description: category.description ? normalizeCmsHtml(category.description) : null,
      imageUrl: category.imageUrl,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** All real category-browse slugs (real `packageCount > 0`, same rule as `getCategoryBySlug`) — for `generateStaticParams`. 53 real category rows total, but only ~13 are real browse pages; the rest (grade/meals/transportation/… taxonomy dimensions) are filtered out here. */
export async function getAllCategorySlugsWithPackages(): Promise<string[]> {
  const page = await apiFetch<Paginated<CategoryResponse>>("/categories?perPage=100", {
    next: { revalidate: 900, tags: ["categories"] },
  });
  return page.items.filter((c) => c.slug && c.packageCount > 0).map((c) => c.slug as string);
}

/** Real package count for a category slug, or `null` if it can't be fetched (never throws — decorative use only). */
export async function getCategoryPackageCount(slug: string): Promise<number | null> {
  try {
    const category = await apiFetch<CategoryResponse>(`/categories/slug/${slug}`, {
      next: { revalidate: 900, tags: ["categories", `category:${slug}`] },
    });
    return category.packageCount > 0 ? category.packageCount : null;
  } catch {
    return null;
  }
}
