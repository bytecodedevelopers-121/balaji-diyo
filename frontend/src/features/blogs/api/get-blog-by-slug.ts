import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { BlogPost } from "../types/blog.types";

/**
 * Fetches one blog post from `GET /blogs/:slug` — the public,
 * isActive-only lookup (blog.service.ts's `findPublicBySlug`). Returns
 * `null` on a 404 instead of throwing, so callers (the detail page) can
 * call Next's `notFound()` themselves — same convention as
 * getTeamMemberBySlug/getTrekkingRouteBySlug.
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    return await apiFetch<BlogPost>(`/blogs/${slug}`, {
      next: { revalidate: 900, tags: ["blogs", `blog:${slug}`] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
