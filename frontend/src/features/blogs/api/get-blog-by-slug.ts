import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { BlogPost } from "../types/blog.types";

/**
 * One public blog post from `GET /blogs/:slug`; `null` when it does not
 * exist.
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    return await apiFetch<BlogPost>(`/blogs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 900, tags: ["blogs", `blog:${slug}`] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
