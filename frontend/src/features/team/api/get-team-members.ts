import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import type { TeamMember } from "../types/team-member.types";

/**
 * Fetches the public team member listing from `GET /team-members`.
 * Explicitly passes `isActive=true` rather than relying on a backend
 * default — the endpoint itself has no public/admin split the way
 * blog's does (see backend/src/modules/team-member/team-member.routes.ts),
 * so an inactive member would otherwise show up here too.
 *
 * `perPage=100` is a deliberate over-fetch, not real pagination — there
 * are 8 team members today, and the /team page renders the whole roster
 * as one grid, not a paged list.
 *
 * Tagged `"team-members"` for on-demand revalidation — see
 * app/api/revalidate/route.ts and the backend's
 * lib/revalidate-frontend.ts, which POSTs this tag after any team-member
 * create/update/delete. The 900s revalidate is a time-based fallback in
 * case that webhook is ever unreachable, not the primary freshness path.
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const page = await apiFetch<Paginated<TeamMember>>(
    "/team-members?isActive=true&perPage=100",
    { next: { revalidate: 900, tags: ["team-members"] } },
  );
  return page.items;
}
