import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { sampleTripsForRegion } from "@/lib/sample-trips";
import type { Trip } from "../types/trip.types";
import { getRegionPackages } from "./get-region-packages";
import { searchTrips } from "./search-trips";

/**
 * The packages of one region for the header menus (browser-side):
 * 1. the region's own category (`/everest-region-treks`),
 * 2. else a title search with the filler words removed ("Everest Region" -> "Everest"),
 * 3. else — an empty database — the sample trips assigned to that region.
 * Never rejects: any failure falls back to the samples (or an empty list).
 */
export async function loadRegionTrips(href: string, title: string): Promise<Trip[]> {
  try {
    let trips = await getRegionPackages(href.replace(/^\/+|\/+$/g, ""));
    if (trips.length === 0) {
      trips = await searchTrips(title.replace(/\b(region|treks?|from|trekking)\b/gi, "").trim() || title, { sampleFallback: false });
    }
    if (trips.length === 0 && SHOW_SAMPLE_DATA) trips = sampleTripsForRegion(title);
    return trips;
  } catch {
    return SHOW_SAMPLE_DATA ? sampleTripsForRegion(title) : [];
  }
}
