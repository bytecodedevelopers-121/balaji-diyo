import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { BankingDetailsSection } from "@/components/sections/BankingDetailsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";

const SLUG = "banking-details";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage(SLUG);

  if (!page) {
    return buildMetadata({
      title: "Banking Details",
      path: `/${SLUG}`,
      noIndex: true,
    });
  }

  // Real CMS SEO fields, same as /responsible-tourism and
  // /booking-terms-and-conditions.
  return buildMetadata({
    title: page.meta?.metaTitle || page.title,
    description: page.meta?.metaDescription || undefined,
    path: `/${SLUG}`,
  });
}

/**
 * The real, already-migrated "Banking Details" CMS page (`GET
 * /pages/banking-details`) — this site's payment/wire-transfer
 * instructions (bank name/account/SWIFT per currency, plus a personal
 * fallback account), previously reachable from the footer's "Banking
 * Details" link and the header's "About" dropdown but 404ing since
 * neither pointed at a real page.
 *
 * No design reference exists for this one (unlike every other CMS page
 * built so far) — built plain per direct confirmation with the user;
 * see BankingDetailsSection's own comment for why it skips the
 * photo-block/ToC-sidebar treatment those pages have.
 *
 * Hero photo/subtitle are the same stand-ins every other CMS-page-without-
 * its-own-hero-photo reuses (about-us/hero.jpg; the "Everything required
 * before you set foot on the trail..." placeholder line already shared
 * by legal-documents.png and responsible-tourism.png) — not a specific
 * choice for this page, just this codebase's existing convention.
 */
export default async function BankingDetailsPage() {
  const page = await getCmsPage(SLUG);

  if (!page) {
    notFound();
  }

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About" },
          { label: "Banking Details" },
        ]}
        title="Banking Details"
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/about-us/hero.jpg"
        imageAlt="Boudhanath Stupa in Kathmandu at dusk"
      />
      <BankingDetailsSection page={page} />
      <CtaSection />
    </>
  );
}
