import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { SAMPLE_BLOGS } from "../lib/sample-blogs";
import type { BlogPost } from "../types/blog.types";

/**
 * One public blog post from `GET /blogs/:slug`; `null` when it does not
 * exist. Falls back to the built-in sample post of that slug (see
 * `SHOW_SAMPLE_DATA`) when the API doesn't have it or is unreachable.
 */
export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const sample = SHOW_SAMPLE_DATA ? (SAMPLE_BLOGS.find((blog) => blog.slug === slug) ?? null) : null;
  try {
    return await apiFetch<BlogPost>(`/blogs/${encodeURIComponent(slug)}`, {
      next: { revalidate: 900, tags: ["blogs", `blog:${slug}`] },
    });
  } catch (error) {
    if (sample) return sample;
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
