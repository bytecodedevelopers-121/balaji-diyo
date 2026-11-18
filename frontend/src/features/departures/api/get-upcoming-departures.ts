import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import type { Departure } from "../types/departure.types";

/**
 * Fetches genuinely bookable upcoming departures from `GET /departures`
 * — `upcoming=true` filters to `departureDate >= now` and excludes
 * `departureStatus: "closed"` server-side (see DepartureService),
 * opt-in and additive so the admin's own unfiltered usage of this same
 * endpoint (frontend-admin's DeparturesTab) is untouched.
 *
 * `perPage=50` is a deliberate over-fetch, not real pagination, same
 * reasoning as getTeamMembers/getCompanyDocuments — the page renders
 * this as one table, not a paged list.
 *
 * Tagged `"departures"`, matching what DepartureService revalidates
 * after any create/update/delete (including the bulk-create endpoint
 * frontend-admin's DeparturesBulkModal uses), so admin edits show up
 * without waiting out the 900s window.
 */
export async function getUpcomingDepartures(options: { lastMinuteOnly?: boolean } = {}): Promise<Departure[]> {
  const lastMinute = options.lastMinuteOnly ? "&lastMinute=true" : "";
  const page = await apiFetch<Paginated<Departure>>(
    `/departures?upcoming=true${lastMinute}&perPage=50`,
    { next: { revalidate: 900, tags: ["departures"] } },
  );
  return page.items;
}
