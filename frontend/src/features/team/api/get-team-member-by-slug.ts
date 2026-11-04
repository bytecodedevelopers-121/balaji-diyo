import { apiFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { SAMPLE_TEAM_MEMBERS } from "../sample-team";
import type { TeamMember } from "../types/team-member.types";

/**
 * Fetches one team member from `GET /team-members/slug/:slug` — the
 * public, isActive-only lookup (backend's `findPublicBySlug`, mirroring
 * blog's own `findPublicBySlug` convention). Returns `null` on a 404
 * instead of throwing, so callers (the /team/[slug] page) can call
 * Next's `notFound()` themselves rather than catch an `ApiError`.
 *
 * Tagged with both the shared `"team-members"` tag (so a listing-wide
 * revalidation also freshens this) and a per-member
 * `` `team-member:${slug}` `` tag, matching exactly what the backend's
 * `TeamMemberService.update` revalidates after an edit.
 */
export async function getTeamMemberBySlug(
  slug: string,
): Promise<TeamMember | null> {
  try {
    return await apiFetch<TeamMember>(`/team-members/slug/${slug}`, {
      next: { revalidate: 900, tags: ["team-members", `team-member:${slug}`] },
    });
  } catch (error) {
    const sample = SHOW_SAMPLE_DATA ? SAMPLE_TEAM_MEMBERS.find((member) => member.slug === slug) : undefined;
    if (error instanceof ApiError && error.status === 404) {
      return sample ?? null;
    }
    // Backend unreachable: the sample member still opens when sample data is on.
    if (sample && error instanceof ApiError && error.status === 0) {
      return sample;
    }
    throw error;
  }
}
