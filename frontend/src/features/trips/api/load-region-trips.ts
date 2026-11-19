import type { Trip } from "../types/trip.types";
import { getRegionPackages } from "./get-region-packages";
import { searchTrips } from "./search-trips";

/**
 * The packages of one region for the header menus (browser-side):
 * 1. the region's own category (`/everest-region-treks`),
 * 2. else a title search with the filler words removed ("Everest Region" -> "Everest"),
 * Never rejects: any failure gives an empty list.
 */
export async function loadRegionTrips(href: string, title: string): Promise<Trip[]> {
  try {
    let trips = await getRegionPackages(href.replace(/^\/+|\/+$/g, ""));
    // A link that isn't a category slug (e.g. an "/attractions#..." anchor) finds nothing —
    // try the category slug a region's title normally gets ("Treks From Pokhara" -> "treks-from-pokhara").
    if (trips.length === 0) {
      const titleSlug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (titleSlug) trips = await getRegionPackages(titleSlug);
    }
    if (trips.length === 0) {
      trips = await searchTrips(title.replace(/\b(region|treks?|from|trekking)\b/gi, "").trim() || title);
    }
    return trips;
  } catch {
    return [];
  }
}
