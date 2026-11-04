import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/animation/Reveal";
import { FillImage } from "@/components/ui/FillImage";
import { getTeamMembers } from "@/features/team/api/get-team-members";
import { SAMPLE_TEAM_MEMBERS } from "@/features/team/sample-team";
import type { TeamMember } from "@/features/team/types/team-member.types";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { resolveMemberPhoto } from "./photo-fallback";

/** The real roster, else (API down or empty) the placeholder one when sample data is on. */
async function loadMembers(): Promise<TeamMember[]> {
  try {
    const members = await getTeamMembers();
    if (members.length > 0 || !SHOW_SAMPLE_DATA) return members;
  } catch (error) {
    if (!SHOW_SAMPLE_DATA) throw error;
  }
  return SAMPLE_TEAM_MEMBERS;
}

/**
 * The team photo grid: an async Server Component fetching the roster from
 * `GET /team-members`. Each card is a tall rounded photo with the name and
 * role on a navy panel that overlaps its bottom edge; "Read More" links to
 * the member's own /company/team/[slug] page. Cards rise in one after
 * another as the grid scrolls into view.
 */
export async function TeamGrid() {
  const members = await loadMembers();

  return (
    <Reveal variant="stagger-soft" targets="li">
      <ul className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-x-8 gap-y-12 px-6 sm:grid-cols-2 md:px-10 lg:grid-cols-3 min-[1120px]:px-0">
        {members.map((member) => {
          const hasPhoto = Boolean(member.photoUrl);
          return (
            <li key={member.id} className="group flex flex-col">
              <div
                className={`relative aspect-[4/5] overflow-hidden rounded-[16px] shadow-[0_10px_30px_rgba(6,74,112,0.18)] ${
                  hasPhoto ? "bg-brand-neutral-200" : "bg-gradient-to-b from-[#cfe6f3] to-[#e6f3fa]"
                }`}
              >
                <FillImage
                  src={resolveMemberPhoto(member.photoUrl)}
                  alt={member.fullName}
                  className={
                    hasPhoto
                      ? "absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      : "absolute inset-0 size-full object-cover"
                  }
                  sizes="(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw"
                />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-logo-sun" />
              </div>

              <div className="relative z-10 -mt-8 mx-5 rounded-[12px] bg-logo-navy-dark px-5 py-4 text-white shadow-[0_8px_24px_rgba(6,74,112,0.3)] transition-transform duration-300 group-hover:-translate-y-1">
                <p className="font-playfair-display text-[22px] leading-tight font-bold">{member.fullName}</p>
                <p className="mt-1 text-[14px] text-logo-sun">{member.position}</p>
                {member.slug ? (
                  <Link
                    href={`/company/team/${member.slug}`}
                    className="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold text-white hover:text-logo-sun focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-sun"
                  >
                    Read More
                    <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}
