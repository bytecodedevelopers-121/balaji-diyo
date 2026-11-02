import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  props: PageProps<"/team/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const member = await getTeamMemberBySlug(slug);

  if (!member) {
    return buildMetadata({
      title: "Team Member Not Found",
      path: `/team/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: member.fullName,
    description: `${member.position} at Joyful Trekking Pvt. Ltd..`,
    path: `/team/${member.slug}`,
  });
}

/**
 * A single team member's own page — replaces this section's original
 * "Read More" popup (see TeamGrid's own comment): the old site had real
 * per-member pages at this exact "/team/[slug]" URL shape, confirmed
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
  props: PageProps<"/team/[slug]">,
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

  return (
    <>
      <section className="bg-brand-neutral-000 py-16">
        <div className="mx-auto w-full max-w-5xl px-6 md:px-16">
          <Breadcrumbs
            tone="dark"
            items={[
              { label: "Home", href: "/" },
              { label: "Nepal" },
              { label: "About" },
              { label: "Our Team", href: "/team" },
              { label: member.fullName },
            ]}
          />

          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card">
              <FillImage
                src={resolveMemberPhoto(member.photoUrl)}
                alt={member.fullName}
                className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 40vw, 100vw" />
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-1000">
                  {member.fullName}
                </h1>
                <p className="mt-1 text-body-l text-brand-neutral-700">
                  {member.position}
                </p>
              </div>

              {member.memberPhone || member.memberEmail ? (
                <div className="flex flex-col gap-3">
                  {member.memberPhone ? (
                    <a
                      href={`tel:${member.memberPhone}`}
                      className="flex items-center gap-3 text-body-l text-brand-neutral-800 hover:text-brand-neutral-1000"
                    >
                      <PhoneIcon />
                      {member.memberPhone}
                    </a>
                  ) : null}
                  {member.memberEmail ? (
                    <a
                      href={`mailto:${member.memberEmail}`}
                      className="flex items-center gap-3 text-body-l text-brand-neutral-800 hover:text-brand-neutral-1000"
                    >
                      <MailIcon />
                      {member.memberEmail}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {member.description ? (
                <div
                  className="flex flex-col gap-4 text-body-l text-brand-neutral-700 [&>p]:mb-4 [&>p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: member.description }}
                />
              ) : (
                <p className="text-body-l text-brand-neutral-600 italic">
                  Full bio coming soon.
                </p>
              )}
            </div>
          </div>
        </div>
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
