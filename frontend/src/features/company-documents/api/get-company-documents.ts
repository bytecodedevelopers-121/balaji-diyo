import { apiFetch } from "@/lib/api/api-client";
import { getServerEnv } from "@/lib/env";
import type { Paginated } from "@/types/api.types";
import type { CompanyDocument } from "../types/company-document.types";

/**
 * Fetches the public company-document listing from `GET /company-documents`.
 * Explicitly passes `isActive=true` — same reasoning as
 * features/team/api/get-team-members.ts: the endpoint has no separate
 * public/admin split, so an inactive row would otherwise show up here.
 *
 * `perPage=100` is a deliberate over-fetch, not real pagination — the
 * /company-documents page renders the whole roster as one grid, not a
 * paged list (same as team members).
 *
 * Tagged `"company-documents"` for on-demand revalidation — the backend's
 * CompanyDocumentService POSTs this tag to app/api/revalidate after any
 * create/update/delete (see lib/revalidate-frontend.ts on that side).
 */
export async function getCompanyDocuments(): Promise<CompanyDocument[]> {
  const page = await apiFetch<Paginated<CompanyDocument>>(
    "/company-documents?isActive=true&perPage=100",
    { next: { revalidate: 900, tags: ["company-documents"] } },
  );
  // A scan uploaded while the admin ran locally is saved with a `http://localhost:…` address that no visitor
  // can reach; point it at the API server's own address instead (same /files path).
  const { origin } = new URL(getServerEnv().API_URL);
  return page.items.map((item) => ({
    ...item,
    imageUrl: item.imageUrl ? item.imageUrl.replace(/^https?:\/\/localhost:\d+/, origin) : item.imageUrl,
  }));
}
