import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { LastMinuteTripsSection } from "@/components/sections/LastMinuteTripsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";

const SLUG = "last-minute-trip-deals";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage(SLUG);

  if (!page) {
    return buildMetadata({
      title: "Last Minute Trip Deals",
      path: `/${SLUG}`,
    });
  }

  return buildMetadata({
    title: page.meta?.metaTitle || page.title,
    description: page.meta?.metaDescription || undefined,
    path: `/${SLUG}`,
  });
}

/**
 * Transcribed from design-references/last-minutes-trip-details.png
 * (+ the mobile variant) — see LastMinuteTripsSection for the real-
 * content/real-data approach this implements (same family as
 * /responsible-tourism and /booking-terms-and-conditions, one step
 * further: this page's central table is backed by live `Departure`
 * data, not just CMS text).
 *
 * Hero photo is a stand-in (same reasoning as every other page in this
 * design batch): the mockup's own hero — elephants and mahouts in a
 * grassy field, likely Chitwan — is a flattened screenshot with the
 * headline baked into the pixels. No matching wildlife/Chitwan photo
 * exists yet in public/images, so this reuses hero/hero-poster.jpg (the
 * homepage/team's mountain-porter shot) rather than force a thematic
 * mismatch or ship a blurred fix.
 *
 * Hero subtitle is the same verbatim placeholder line reused across
 * legal-documents.png, responsible-tourism.png, and Booking Terms and
 * Conditions.png ("Everything required before you set foot on the
 * trail — permits, visas, and paperwork, explained simply.") — kept
 * as-is per this codebase's fidelity rule.
 */
export default async function LastMinuteTripDealsPage() {
  // The CMS record is optional (used only for SEO metadata); the page
  // content is static + live departures, so never 404 when it's missing.
  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About" },
          { label: "Last Minute Trip Deals" },
        ]}
        title="Last Minute Trip Deals"
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/hero/hero-poster.jpg"
        imageAlt="A porter walking a trail below a snow-capped Himalayan peak"
      />
      <LastMinuteTripsSection />
      <CtaSection />
    </>
  );
}
