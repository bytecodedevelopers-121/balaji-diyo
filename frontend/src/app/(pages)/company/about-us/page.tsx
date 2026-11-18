import { Reveal } from "@/components/animation/Reveal";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { AboutUsIntroSection } from "@/components/sections/AboutUsIntroSection";
import { HistorySection } from "@/components/sections/HistorySection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { ABOUT_DEFAULTS } from "@/features/page-content/company-defaults";

const SLUG = "about-us";

export async function generateMetadata(): Promise<Metadata> {
  const [page, sections] = await Promise.all([getCmsPage(SLUG), getPageSections("about")]);
  const seo = resolveSection(sections, "seo", ABOUT_DEFAULTS.seo).content;

  if (!page) {
    return buildMetadata({ title: seo.title, path: `/company/${SLUG}`, noIndex: true });
  }

  // Search title and description saved in the admin (Page Content → About Us) win over the older Pages entry.
  return buildMetadata({
    title: seo.title || page.meta?.metaTitle || page.title,
    description: seo.description || page.meta?.metaDescription || undefined,
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
  const [page, sections] = await Promise.all([getCmsPage(SLUG), getPageSections("about")]);
  if (!page) notFound();
  const hero = resolveSection(sections, "hero", ABOUT_DEFAULTS.hero).content;
  const story = resolveSection(sections, "story", ABOUT_DEFAULTS.story);
  const history = resolveSection(sections, "history", ABOUT_DEFAULTS.history);

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
        title={hero.title}
        subtitle={hero.subtitle}
        image={hero.image}
        imageAlt={hero.imageAlt}
      />
      {story.isActive && (
        <Reveal variant="auto">
          <AboutUsIntroSection content={story.content} />
        </Reveal>
      )}
      {history.isActive && (
        <Reveal variant="auto">
          <HistorySection content={history.content} />
        </Reveal>
      )}
      <CtaSection />
    </>
  );
}
