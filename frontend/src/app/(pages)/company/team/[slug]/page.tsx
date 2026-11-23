import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/animation/Reveal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CtaSection } from "@/components/sections/CtaSection";
import { resolveMemberPhoto } from "@/components/sections/TeamSection/photo-fallback";
import { getTeamMembers } from "@/features/team/api/get-team-members";
import { getTeamMemberBySlug } from "@/features/team/api/get-team-member-by-slug";
import { buildMetadata } from "@/lib/seo/metadata";
import { FillImage } from "@/components/ui/FillImage";

export async function generateStaticParams() {
  const members = await getTeamMembers();
  return members
    .filter((member) => member.slug)
    .map((member) => ({ slug: member.slug as string }));
}

export async function generateMetadata(
  props: PageProps<"/company/team/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const member = await getTeamMemberBySlug(slug);

  if (!member) {
    return buildMetadata({
      title: "Team Member Not Found",
      path: `/company/team/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: member.fullName,
    description: `${member.position} at Your Company Pvt. Ltd..`,
    path: `/company/team/${member.slug}`,
  });
}

/**
 * A single team member's own page — replaces this section's original
 * "Read More" popup (see TeamGrid's own comment): the old site had real
 * per-member pages at this exact "/company/team/[slug]" URL shape, confirmed
 * directly by the user (2026-08-18), so each person gets a real,
 * shareable, indexable page instead of JS-only modal content.
 *
 * No screenshot/reference exists for the old site's actual detail-page
 * design (confirmed with the user) — this layout is designed fresh,
 * reusing the same content the original popup showed (photo, name,
 * role, phone/email, bio) in a plain two-column page layout consistent
 * with the rest of the site (Breadcrumbs in its new "dark" tone, since
 * this page has no photo-hero behind it; CtaSection reused verbatim
 * like every other secondary page).
 *
 * Backed by the real API (getTeamMemberBySlug) as of 2026-08-19 — see
 * the "Wire /team to the real backend API" plan. `description` is real
 * CMS-authored HTML from the legacy site's own content, rendered via
 * dangerouslySetInnerHTML (trusted, admin-authored, same trust level as
 * the rest of this site's copy — not user input).
 */
export default async function TeamMemberPage(
  props: PageProps<"/company/team/[slug]">,
) {
  const { slug } = await props.params;
  const member = await getTeamMemberBySlug(slug);

  if (!member) {
    // Verified against a production build: an unknown slug renders this
    // route's real not-found UI (correct title, `noindex` meta) but the
    // HTTP status is 200, not 404. This is Next 16's documented
    // streaming behavior for dynamic routes (see next/dist/docs/.../
    // functions/not-found.md, "Calling notFound() after streaming has
    // started") — the layout shell streams as 200 before this check
    // runs, and the status can't change once streaming starts. A true
    // 404 would need the existence check moved into `proxy` ahead of
    // the route, which is out of scope for this page alone. The
    // `noindex` tag (see generateMetadata above) is what actually keeps
    // this out of search results in the meantime.
    notFound();
  }

  const firstName = member.fullName.split(" ")[0];

  return (
    <>
      <section className="bg-brand-neutral-000 pt-6 pb-16">
        <Reveal variant="auto">
          <div className="mx-auto w-full max-w-[1100px] px-6 md:px-10">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[
                { label: "Home", href: "/" },
                { label: "Meet the Team", href: "/company/team" },
                { label: member.fullName },
              ]}
            />

            <div data-reveal="up" className="mt-8">
              <h1 className="text-[clamp(32px,5vw,48px)] leading-tight font-bold text-brand-neutral-1000">{member.fullName}</h1>
              <p className="mt-1 text-[17px] text-brand-neutral-800">{member.position}</p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr] md:items-start md:gap-10">
              <div data-reveal="left" className="flex flex-col gap-4">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-[#e6f3fa] shadow-[0_8px_24px_rgba(6,74,112,0.18)] md:aspect-[4/4.6]">
                  <FillImage
                    src={resolveMemberPhoto(member.photoUrl)}
                    alt={member.fullName}
                    className="absolute inset-0 size-full object-cover"
                    sizes="(min-width:768px) 260px, 100vw"
                  />
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-logo-sun" />
                </div>
                {member.memberPhone ? (
                  <a href={`tel:${member.memberPhone}`} className="flex items-center gap-3 text-[15px] text-brand-neutral-800 hover:text-logo-navy">
                    <PhoneIcon />
                    {member.memberPhone}
                  </a>
                ) : null}
                {member.memberEmail ? (
                  <a href={`mailto:${member.memberEmail}`} className="flex items-center gap-3 text-[15px] break-all text-brand-neutral-800 hover:text-logo-navy">
                    <MailIcon />
                    {member.memberEmail}
                  </a>
                ) : null}
              </div>

              <div data-reveal="right" className="min-w-0">
                <h2 className="text-[24px] font-bold text-brand-neutral-900">About {firstName}</h2>
                {member.description ? (
                  <div
                    className={[
                      "mt-3 text-[15px] leading-[1.8] text-brand-neutral-800",
                      "[&_p]:mb-4 [&_p:last-child]:mb-0 [&_a]:text-logo-navy [&_a]:underline [&_strong]:text-brand-neutral-1000",
                      "[&_table]:mb-6 [&_table]:w-full [&_table]:border-collapse [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_th]:px-4 [&_th]:py-3 [&_th]:text-left",
                      "[&_tr:nth-child(even)]:bg-[#fdf3d6] [&_tr>td:first-child]:w-[34%] [&_tr>td:first-child]:text-brand-neutral-800 [&_tr>td:nth-child(2)]:text-logo-navy",
                      "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:text-brand-neutral-900",
                      "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[22px] [&_h3]:font-bold [&_h3]:text-brand-neutral-900",
                      "[&_img]:aspect-[4/3] [&_img]:h-auto [&_img]:w-full [&_img]:rounded-[8px] [&_img]:object-cover [&_figure]:m-0 [&_ul]:list-disc [&_ul]:pl-6",
                      "[&_p:has(img)]:grid [&_p:has(img)]:grid-cols-2 [&_p:has(img)]:gap-3 sm:[&_p:has(img)]:grid-cols-4",
                    ].join(" ")}
                    dangerouslySetInnerHTML={{ __html: member.description }}
                  />
                ) : (
                  <p className="mt-3 text-[15px] text-brand-neutral-600 italic">Full bio coming soon.</p>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      <CtaSection />
    </>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.5 1 1 0 0 1-.25 1z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
