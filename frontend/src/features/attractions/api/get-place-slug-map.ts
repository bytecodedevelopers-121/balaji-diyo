import "server-only";
import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";

interface PlaceListItem {
  id: string;
  placeName: string;
  slug: string | null;
}

export interface PlaceSlugMaps {
  /** Real `Place.id` → its `/attractions/<slug>` page. Authoritative —
   *  use this whenever an itinerary day's `originPlaceId`/
   *  `destinationPlaceId` FK is actually set (an admin explicitly
   *  picked a real Place), since it can't be wrong the way name
   *  matching could (e.g. two places sharing a display name). */
  byId: Map<string, string>;
  /** Real `Place.placeName` (lowercased) → its `/attractions/<slug>`
   *  page. Fallback for the (currently far more common) case where a
   *  day only has a plain free-text place name and no linked `Place` —
   *  see `map-package-detail.ts`'s own comment on why almost no real
   *  itinerary row has that FK populated. */
  byName: Map<string, string>;
}

/**
 * Fetches every real, active `Place` once and returns both lookup maps
 * itinerary day "location" pills need to link to a real attraction page.
 *
 * Only 1 real `Place` exists in the migrated data as of this pass
 * ("Lukla") — most location pills won't resolve to anything yet. That's
 * expected, not a bug: this is real, dynamic, admin-editable matching
 * (`GET /places`), not a guessed URL — it'll pick up new real `Place`
 * rows automatically as they're added via the admin panel's Place CRUD,
 * no code change needed.
 */
export async function getPlaceSlugMaps(): Promise<PlaceSlugMaps> {
  try {
    const page = await apiFetch<Paginated<PlaceListItem>>(
      "/places?isActive=true&perPage=200",
      { next: { revalidate: 900, tags: ["places"] } },
    );
    const withSlug = page.items.filter(
      (place): place is PlaceListItem & { slug: string } => Boolean(place.slug),
    );
    return {
      byId: new Map(withSlug.map((place) => [place.id, place.slug])),
      byName: new Map(withSlug.map((place) => [place.placeName.toLowerCase(), place.slug])),
    };
  } catch {
    // Same "never break the page over a non-critical enhancement" rule
    // as the rest of this codebase's optional lookups — a failed fetch
    // here just means location pills render as plain text.
    return { byId: new Map(), byName: new Map() };
  }
}
