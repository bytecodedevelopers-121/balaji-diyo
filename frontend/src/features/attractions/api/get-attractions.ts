import { apiFetch } from "@/lib/api/api-client";
import type { AttractionIndex } from "../types/attraction.types";

export function getAttractions(): Promise<AttractionIndex> {
  return apiFetch<AttractionIndex>("/places/attractions", {
    next: { revalidate: 900, tags: ["attractions", "places"] },
  });
}
