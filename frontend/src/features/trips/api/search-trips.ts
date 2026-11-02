import { toNumber } from "@/lib/decimal";
import { isApiEnvelope } from "@/lib/api/api-response";
import type { Paginated } from "@/types/api.types";
import type { RawPackagePriceGroup, Trip } from "../types/trip.types";

/** Raw `GET /packages?search=` list-item shape — same `priceGroups` addition as `getFeaturedTrips`'s own `RawFeaturedTrip` in get-trips.ts, duplicated here rather than imported: that module pulls in `apiFetch`, which is `server-only`-gated and would fail the build if reached from this Client-Component-facing module. */
type RawSearchTrip = Trip & { priceGroups?: RawPackagePriceGroup[] };

function lowestPrice(priceGroups: RawPackagePriceGroup[] | undefined): number | undefined {
  if (!priceGroups || priceGroups.length === 0) return undefined;
  const prices = priceGroups
    .map((group) => toNumber(group.offerUnitPrice) ?? toNumber(group.unitPrice))
    .filter((price): price is number => price !== undefined);
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

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
export async function searchTrips(query: string, options?: { signal?: AbortSignal }): Promise<Trip[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${process.env.NEXT_PUBLIC_API_URL}/packages?search=${encodeURIComponent(trimmed)}&perPage=6`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: options?.signal,
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
