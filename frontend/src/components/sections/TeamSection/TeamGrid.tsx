import Link from "next/link";
import { getTeamMembers } from "@/features/team/api/get-team-members";
import { resolveMemberPhoto } from "./photo-fallback";
import { FillImage } from "@/components/ui/FillImage";

/**
 * The team photo grid — an async Server Component fetching the real
 * roster from `GET /team-members` (see getTeamMembers) rather than the
 * hardcoded array this component originally shipped with. "Read More" is
 * a plain link to each person's own /team/[slug] page, not a popup — see
 * that route for why: the old site had real per-member detail pages at
 * this URL shape, confirmed directly by the user.
 *
 * Card layout (photo, then name/role/"Read More") and the 3-column grid
 * follow design-references/ourteamcss/team.txt's "team member per
 * people" (408×633, 16px internal gap) and "team members" container
 * (1312 wide) specs, scaled to responsive Tailwind utilities rather than
 * the fixed pixel box — grid-cols-3 at 1312px with 408px cards implies
 * a ~44px column gap, used below as gap-x-11.
 *
 * The source screenshot staggers the middle column lower; that was
 * removed 2026-10-02 (client request) so every card in a row sits level,
 * matching /company-documents. Each photo has a yellow border, same as
 * the company-document cards.
 */
export async function TeamGrid() {
  const members = await getTeamMembers();

  return (
    <div className="mx-auto grid w-full max-w-[1312px] grid-cols-1 gap-x-11 gap-y-14 px-6 sm:grid-cols-2 md:px-16 lg:grid-cols-3 lg:px-0">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex flex-col gap-4"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-card border-2 border-[#F5C518]">
            <FillImage
              src={resolveMemberPhoto(member.photoUrl)}
              alt={member.fullName}
              className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-playfair-display text-xl text-brand-neutral-900">
              {member.fullName}
            </p>
            <p className="text-body-l text-brand-neutral-700">
              {member.position}
            </p>
            {member.slug ? (
              <Link
                href={`/team/${member.slug}`}
                className="mt-2 flex w-fit items-center gap-2 text-body-m font-bold text-secondary-500 hover:opacity-80"
              >
                Read More
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
