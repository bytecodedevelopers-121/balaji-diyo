import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { ResponsibleTourismSection } from "@/components/sections/ResponsibleTourismSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";

const SLUG = "responsible-tourism";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage(SLUG);

  if (!page) {
    return buildMetadata({
      title: "Responsible Tourism",
      path: `/${SLUG}`,
      noIndex: true,
    });
  }

  // Prefer the CMS's own SEO fields — these are real, migrated from the
  // legacy site (e.g. "Responsible Tourism - Eco-tourism In Nepal"),
  // not generated from the title.
  return buildMetadata({
    title: page.meta?.metaTitle || page.title,
    description: page.meta?.metaDescription || undefined,
    path: `/${SLUG}`,
  });
}

/**
 * Transcribed from design-references/responsible-tourism.png (+ the
 * mobile variant) — see ResponsibleTourismSection for the content-vs-
 * layout decision this page implements, and for the two photos taken
 * from that same reference.
 *
 * Body content is API-backed off the legacy CMS's real Responsible
 * Tourism page (`GET /pages/responsible-tourism`), so it stays editable
 * from the admin's Pages section rather than being frozen in JSX. This
 * is the first page wired to the generic Page CMS module — /about-us and
 * /why-boundless-adventure still use hardcoded section components, and
 * could be migrated the same way later.
 *
 * The hero photo is a stand-in (user-confirmed): the design's own hero
 * is a Namche-style hillside village, but that mockup is a flattened
 * screenshot with the headline text baked into the pixels — the exact
 * problem the /team hero hit. Reuses why-boundless/hero.jpg (a porter
 * carrying a load below a Himalayan peak), the closest clean asset
 * thematically — porter welfare being a core responsible-tourism
 * concern. Swap in a real clean export of the village shot when there
 * is one; note this photo is also the /why-boundless-adventure hero.
 *
 * Hero headline/subtitle come from the design. The subtitle is verbatim
 * mockup copy that is also reused word-for-word on legal-documents.png
 * ("Everything required before you set foot on the trail — permits,
 * visas, and paperwork, explained simply."), i.e. almost certainly
 * placeholder rather than intended copy for this page — kept as-is per
 * this codebase's fidelity rule, and an obvious thing to replace once
 * real hero copy exists.
 */
export default async function ResponsibleTourismPage() {
  const page = await getCmsPage(SLUG);

  if (!page) {
    // Unlike /team/[slug], there is no per-request user input here — a
    // miss means the CMS row was deactivated or deleted, which should
    // surface as a real 404 rather than an empty page.
    notFound();
  }

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About" },
          { label: "Responsible Tourism" },
        ]}
        title="Preserve. Connect. Empower."
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/responsible-tourism/hero.jpg"
        imageAlt="A porter carrying supplies below a snow-capped Himalayan peak"
      />
      <ResponsibleTourismSection page={page} />
      <CtaSection />
    </>
  );
}
