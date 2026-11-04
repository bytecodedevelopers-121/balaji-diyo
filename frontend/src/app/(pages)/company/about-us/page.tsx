import { Reveal } from "@/components/animation/Reveal";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { AboutUsIntroSection } from "@/components/sections/AboutUsIntroSection";
import { HistorySection } from "@/components/sections/HistorySection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";

const SLUG = "about-us";
const FALLBACK_SUBTITLE =
  "We plan trips the way we'd want to travel — unhurried, honest, and a little off the usual path.";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage(SLUG);

  if (!page) {
    return buildMetadata({ title: "About Us", path: `/company/${SLUG}`, noIndex: true });
  }

  return buildMetadata({
    title: page.meta?.metaTitle || page.title,
    description: page.meta?.metaDescription || undefined,
    path: `/company/${SLUG}`,
  });
}

/**
 * `AboutUsIntroSection` and `HistorySection` are hardcoded designed
 * sections (see their own comments — 2026-08-27) rather than populated
 * from the `about-us` CMS page: that page's flat legacy article never
 * matched either design's shape.
 *
 * The legacy article's full body no longer renders on this page at
 * all (an earlier pass added `AboutUsLegacyContentSection` to show it
 * in full below the designed sections — removed same day per explicit
 * "don't display the old content, make it match the Figma design"
 * direction). `getCmsPage` is still called here purely for the page's
 * real title/meta description (breadcrumbs + SEO), not its body.
 */
export default async function AboutUsPage() {
  const page = await getCmsPage(SLUG);
  if (!page) notFound();

  return (
    <>
      <PageHero
        compact
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About" },
          { label: page.title },
        ]}
        title="Built by a community."
        subtitle={page.meta?.metaDescription || FALLBACK_SUBTITLE}
        image="/images/hero/hero-3.jpeg"
        imageAlt="Sunrise turning the Everest summits gold"
      />
      <Reveal variant="auto">
        <AboutUsIntroSection />
      </Reveal>
      <Reveal variant="auto">
        <HistorySection />
      </Reveal>
      <CtaSection />
    </>
  );
}
