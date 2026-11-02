import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import type { BlogCategory } from "../types/blog.types";

interface CategoryWithType {
  id: string;
  title: string;
  type: { key: string };
}

/**
 * Fetches the real category-filter pills for /blog (design-references/
 * blog.png's "All Posts / Travel Tips / Travel Information / Adventure"
 * row). Only 2 of those 4 are real: `category_types` (where "Blog" vs.
 * e.g. "Destination"/"Trip Style" lives) has no public read endpoint
 * (category-type.routes.ts is admin-only), so this searches categories
 * by title instead and keeps only ones whose own `type.key === "blog"`
 * — confirmed directly against the dev DB that exactly two categories
 * exist under the real "Blog" category type ("Travel Tips", used by 229
 * of 237 real posts; "Travel Information", used by 9). "Adventure" has
 * no matching category anywhere and isn't real — dropped rather than
 * invented, same call as every other unbacked mockup element this
 * session (the /map listing's repeated-card placeholders, this same
 * post's "package-block"/gear-checklist shortcodes).
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const page = await apiFetch<Paginated<CategoryWithType>>(
    "/categories?search=Travel&perPage=20",
    { next: { revalidate: 3600, tags: ["blog-categories"] } },
  );
  return page.items
    .filter((category) => category.type.key === "blog")
    .map((category) => ({ id: category.id, title: category.title }));
}
