import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { BookingTermsSection } from "@/components/sections/BookingTermsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";

const SLUG = "booking-terms-and-conditions";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage(SLUG);

  if (!page) {
    return buildMetadata({
      title: "Booking Terms and Conditions",
      path: `/${SLUG}`,
      noIndex: true,
    });
  }

  // Real CMS SEO fields, same as /responsible-tourism.
  return buildMetadata({
    title: page.meta?.metaTitle || page.title,
    description: page.meta?.metaDescription || undefined,
    path: `/${SLUG}`,
  });
}

/**
 * Transcribed from design-references/"Booking Terms and Conditions.png"
 * (+ the mobile variant) — see BookingTermsSection for the sidebar/
 * sections layout this implements around the real, already-migrated CMS
 * page (`GET /pages/booking-terms-and-conditions`), the same
 * content-vs-layout approach /responsible-tourism uses.
 *
 * Hero photo is a stand-in (same reasoning as every other page built
 * from this design batch): the mockup's own hero — a pagoda-style temple
 * at night with string lights — is a flattened screenshot with the
 * headline baked into the pixels. Reuses why-boundless/temple.jpg
 * (Patan Durbar Square at dusk), the closest already-clean asset in
 * mood/subject; it's also used inline in WhyBoundlessSection.
 *
 * The hero subtitle is the same verbatim placeholder line reused across
 * legal-documents.png and responsible-tourism.png ("Everything required
 * before you set foot on the trail — permits, visas, and paperwork,
 * explained simply.") — kept as-is per this codebase's fidelity rule,
 * an easy swap once real hero copy exists for this specific page.
 */
export default async function BookingTermsPage() {
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
          { label: "Booking Terms and Conditions" },
        ]}
        title="Booking Terms and Conditions"
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/booking-terms/hero.jpg"
        imageAlt="Pagoda-style temples at Patan Durbar Square at dusk"
      />
      <BookingTermsSection page={page} />
      <CtaSection />
    </>
  );
}
