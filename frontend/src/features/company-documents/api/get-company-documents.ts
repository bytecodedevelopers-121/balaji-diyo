import { apiFetch } from "@/lib/api/api-client";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
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
/** Placeholder titles shown with no scans (see `SHOW_SAMPLE_DATA`); the card draws a document icon for them. */
const SAMPLE_DOCUMENTS: CompanyDocument[] = [
  "Company Registration Certificate",
  "Tourism Business Licence",
  "Business Registration Certificate",
  "VAT Registration Certificate",
  "Trekking Agencies' Association Membership",
  "Mountaineering Association Membership",
  "Nepal Tourism Board Registration",
].map((title, index) => ({
  id: `sample-document-${index + 1}`,
  title,
  description: null,
  imageUrl: null,
  sortOrder: index + 1,
}));

export async function getCompanyDocuments(): Promise<CompanyDocument[]> {
  try {
    const page = await apiFetch<Paginated<CompanyDocument>>(
      "/company-documents?isActive=true&perPage=100",
      { next: { revalidate: 900, tags: ["company-documents"] } },
    );
    if (page.items.length > 0 || !SHOW_SAMPLE_DATA) return page.items;
  } catch (error) {
    // Backend unreachable: show the placeholders, same as an empty database would.
    if (!SHOW_SAMPLE_DATA) throw error;
  }
  return SAMPLE_DOCUMENTS;
}
