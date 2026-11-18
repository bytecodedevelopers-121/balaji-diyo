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
    if (trips.length === 0) {
      trips = await searchTrips(title.replace(/\b(region|treks?|from|trekking)\b/gi, "").trim() || title);
    }
    return trips;
  } catch {
    return [];
  }
}
