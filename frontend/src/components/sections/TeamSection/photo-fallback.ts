/**
 * Neutral placeholder for `TeamMember.photoUrl` when it's empty (a new
 * member the admin hasn't set a photo for yet).
 *
 * An earlier version of this file mapped each known slug to a specific
 * stock-photography crop (sourced from a Figma design mockup) as a
 * per-person fallback. That was wrong to keep: those crops are stock
 * photos of unrelated people, not the real team — showing one under a
 * real person's name (e.g. if their `photoUrl` were ever cleared) would
 * misattribute a stranger's photo to them. All 8 real members now have
 * real `photoUrl`s anyway (their actual legacy-site photos, resolved
 * from backend/uploads/public/team/member/ — see the "Wire /team to the
 * real backend API" plan and its follow-up correction), so a plain
 * silhouette is both more honest and sufficient for the one case this
 * still needs to cover: a genuinely new member with no photo set.
 */
const GENERIC_FALLBACK = "/images/team/avatar-placeholder.svg";

/** `photoUrl` if the member has one, else a neutral placeholder silhouette. */
export function resolveMemberPhoto(photoUrl: string | null): string {
  return photoUrl || GENERIC_FALLBACK;
}
