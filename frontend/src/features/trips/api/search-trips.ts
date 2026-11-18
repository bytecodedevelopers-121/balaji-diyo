import { isApiEnvelope } from "@/lib/api/api-response";
import type { Paginated } from "@/types/api.types";
import { lowestPrice } from "../lib/lowest-price";
import type { RawPackagePriceGroup, Trip } from "../types/trip.types";

/** Raw `GET /packages?search=` list-item shape — same `priceGroups` addition as `getFeaturedTrips`'s own `RawFeaturedTrip` in get-trips.ts, duplicated here rather than imported: that module pulls in `apiFetch`, which is `server-only`-gated and would fail the build if reached from this Client-Component-facing module. */
type RawSearchTrip = Trip & { priceGroups?: RawPackagePriceGroup[] };

// Generous on purpose: the API sits on a remote database, so a call can take several
// seconds (3s+ in development). A tight cap made every search fail with "signal timed out".
const REQUEST_TIMEOUT_MS = 15000;

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
  options?: { signal?: AbortSignal },
): Promise<Trip[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return fetchTrips(trimmed, options?.signal);
}

async function fetchTrips(trimmed: string, signal?: AbortSignal): Promise<Trip[]> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/packages?search=${encodeURIComponent(trimmed)}&perPage=6`;
  // Give up on a backend that isn't answering after a moment, so the header search never hangs.
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
