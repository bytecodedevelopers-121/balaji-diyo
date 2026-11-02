import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import type { AttractionDetail } from "../types/attraction.types";

export async function getAttractionBySlug(slug: string): Promise<AttractionDetail | null> {
  try {
    return await apiFetch<AttractionDetail>(`/places/slug/${encodeURIComponent(slug)}?view=attraction-detail-v3`, {
      next: { revalidate: 900, tags: ["attractions", "places", `place:${slug}`, "trekking-routes"] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
