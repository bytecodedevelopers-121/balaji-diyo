/**
 * Team member domain type — maps to the backend's TeamMember module
 * (backend/src/modules/team-member), exposed publicly via
 * `GET /team-members` (list) and `GET /team-members/slug/:slug`
 * (detail). Captured from a live response, not guessed — see that
 * module's Prisma model/DTOs for the full admin-only field set; only the
 * fields the public site actually renders are included here.
 */
export interface TeamMember {
  id: string;
  position: string;
  positionOrder: number;
  fullName: string;
  /** Null until an admin sets one via the (new, upload-free) Photo URL field — see TeamMemberForm.tsx in frontend-admin. */
  photoUrl: string | null;
  memberPhone: string | null;
  memberEmail: string | null;
  /** Real CMS-authored HTML (e.g. "<p>...</p>"), not plain text — render with dangerouslySetInnerHTML, same trust level as the rest of the site's admin-authored copy. */
  description: string | null;
  /** Resolved from the owning `url_infos` row server-side; null only if that row is somehow missing (shouldn't happen for members returned by the public endpoints, both of which go through slug-bearing lookups). */
  slug: string | null;
}
