import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { TrekkingRoute } from "../types/trekking-route.types";

/**
 * Fetches one trekking route from `GET /package-maps/slug/:slug` — the
 * public, isActive-only lookup (backend's `findPublicBySlug`, mirroring
 * team-member's own `findPublicBySlug`). Returns `null` on a 404 instead
 * of throwing, so callers (the detail page) can call Next's `notFound()`
 * themselves rather than catch an `ApiError`.
 */
export async function getTrekkingRouteBySlug(
  slug: string,
): Promise<TrekkingRoute | null> {
  try {
    return await apiFetch<TrekkingRoute>(`/package-maps/slug/${slug}`, {
      next: { revalidate: 900, tags: ["trekking-routes", `trekking-route:${slug}`] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
