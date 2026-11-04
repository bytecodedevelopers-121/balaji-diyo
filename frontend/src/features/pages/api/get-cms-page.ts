import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import type { CmsPage } from "../types/cms-page.types";

/**
 * Fetches one CMS page from `GET /pages/:slug` — the public,
 * isActive-only lookup (backend's `PageService.findPublicBySlug`).
 * Returns `null` on a 404 instead of throwing, so callers can decide
 * between `notFound()` and rendering a static fallback.
 *
 * Tagged per-slug (`cms-page:${slug}`) alongside a shared `"cms-pages"`
 * tag — both matching exactly what the backend's PageService revalidates
 * after a create/update/delete, so admin edits show up without waiting
 * out the 900s timer. (That service had no revalidation at all until
 * this page became the first thing wired to it.)
 */
export async function getCmsPage(slug: string): Promise<CmsPage | null> {
  try {
    return await apiFetch<CmsPage>(`/pages/${slug}`, {
      next: { revalidate: 900, tags: ["cms-pages", `cms-page:${slug}`] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    // Backend unreachable (not running yet): show a bare page from the slug, like an empty database would.
    if (SHOW_SAMPLE_DATA && error instanceof ApiError && error.status === 0) {
      return samplePage(slug);
    }
    throw error;
  }
}

/** A title-only stand-in so CMS-backed pages still render without the API. */
function samplePage(slug: string): CmsPage {
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return { id: `sample-${slug}`, title, content: null, slug, meta: null };
}
