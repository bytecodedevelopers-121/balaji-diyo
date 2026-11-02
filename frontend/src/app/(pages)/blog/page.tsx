import type { Metadata } from "next";
import { BlogListingSection, LeadosBlogEmbed } from "@/components/sections/BlogListingSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Travel Blogs",
  description:
    "Trip tips, trail stories, and honest advice from the people who've actually walked these trails — Joyful Trekking Pvt. Ltd.'s travel blog.",
  path: "/blog",
});

/**
 * Transcribed from design-references/blog.png. "/blog" is a real
 * (if inconsistently-used) legacy URL prefix — found verbatim in
 * boundless.sql for the majority of migrated posts (e.g.
 * "boundlessadventure.com/blog/ama-dablam/"), and already the site's
 * own header/footer nav link (src/config/navigation.ts's
 * `primaryNavigation`/footer "Travel Blog"), not a placeholder guess.
 *
 * No PageHero here — unlike most other secondary pages, the design goes
 * straight from the header into the breadcrumb/title/filter band inside
 * BlogListingSection itself (same "no photo hero" shape as
 * /map's own detail pages), not a separate
 * full-bleed photo section.
 */
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}) {
  const { page: pageParam, category, search } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <>
      <BlogListingSection page={page} categoryId={category} search={search} />
      <LeadosBlogEmbed />
      <CtaSection />
    </>
  );
}
