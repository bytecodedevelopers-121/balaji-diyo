import { isApiEnvelope } from "@/lib/api/api-response";
import type { Paginated } from "@/types/api.types";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { ALL_SAMPLE_TRIPS } from "@/lib/sample-trips";
import { lowestPrice } from "../lib/lowest-price";
import type { RawPackagePriceGroup, Trip } from "../types/trip.types";

/** Raw `GET /packages?search=` list-item shape — same `priceGroups` addition as `getFeaturedTrips`'s own `RawFeaturedTrip` in get-trips.ts, duplicated here rather than imported: that module pulls in `apiFetch`, which is `server-only`-gated and would fail the build if reached from this Client-Component-facing module. */
type RawSearchTrip = Trip & { priceGroups?: RawPackagePriceGroup[] };

const REQUEST_TIMEOUT_MS = 1500;

/**
 * Header search's client-side lookup — `GET /packages?search=…` straight
 * from the browser via `NEXT_PUBLIC_API_URL`, same direct-fetch pattern
 * `CustomizeTripForm.tsx` uses for its own POST to `/contacts` (the
 * server-only `apiFetch` in `api-client.ts` can't be imported here).
 *
 * Backend support: `GetPackagesDto.search` (backend/src/modules/package/
 * dto/get-packages.dto.ts) does a case-insensitive `title` `contains`
 * filter — see package.service.ts's `list()`.
 *
 * `signal` lets the header dropdown abort a stale request when the query
 * changes again before the previous one resolves.
 */
export async function searchTrips(
  query: string,
  options?: {
    signal?: AbortSignal;
    /** Set false to get only real trips: callers that fall back to their own, better-matched samples (region menus) don't want name matches. */
    sampleFallback?: boolean;
  },
): Promise<Trip[]> {
  const useSamples = SHOW_SAMPLE_DATA && options?.sampleFallback !== false;
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const trips = await fetchTrips(trimmed, options?.signal);
    if (trips.length > 0 || !useSamples) return trips;
  } catch (error) {
    // A stale request being cancelled is not a failure; anything else (API down, error response)
    // falls back to the sample trips when sample data is on.
    if (options?.signal?.aborted || !useSamples) throw error;
  }
  return searchSampleTrips(trimmed);
}

/** The sample trips (shown while the database has none, or the API is unreachable) whose name matches every word typed. */
function searchSampleTrips(query: string): Trip[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return ALL_SAMPLE_TRIPS.filter((trip) => {
    const haystack = `${trip.title} ${trip.slug} ${trip.badge ?? ""}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  }).slice(0, 6);
}

async function fetchTrips(trimmed: string, signal?: AbortSignal): Promise<Trip[]> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/packages?search=${encodeURIComponent(trimmed)}&perPage=6`;
  // Give up on a backend that isn't answering after a few seconds, so the sample fallback shows promptly.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
    throw new Error(
      (isApiEnvelope(body) ? body.message : undefined) || "Something went wrong. Please try again.",
    );
  }

  const page = (isApiEnvelope(body) ? body.data : body) as Paginated<RawSearchTrip> | null;
  const items = page?.items ?? [];
  return items.map((item) => ({ ...item, priceFrom: lowestPrice(item.priceGroups) }));
}
