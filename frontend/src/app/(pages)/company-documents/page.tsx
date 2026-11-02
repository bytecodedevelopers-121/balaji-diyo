import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { CompanyDocumentsSection } from "@/components/sections/CompanyDocumentsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Legal Documents",
  description:
    "Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply.",
  path: "/company-documents",
});

/**
 * Transcribed from design-references/legal-documents.png (+ the mobile
 * variant for responsive confirmation) — see CompanyDocumentsSection for
 * the grid's own source region/notes. CtaSection reused verbatim, same
 * as every other secondary page. "/company-documents" is the real URL
 * the user gave directly (matches the footer's existing "Company
 * Documents" link in navigation.ts, which already pointed here as a
 * placeholder before this page existed).
 *
 * The hero photo (prayer wheels + flags at a temple, in the reference)
 * isn't used directly — same issue PageHero's own /team hero hit:
 * legal-documents.png is a flattened screenshot with the headline text
 * already baked into the pixels. Reuses about-us/hero.jpg (Boudhanath
 * Stupa, already a clean real export, not a screenshot crop) instead of
 * repeating that mistake or shipping a blurred fix.
 */
export default function CompanyDocumentsPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About" },
          { label: "Legal Documents" },
        ]}
        title="Legal documents you will need"
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/company-documents/hero.jpg"
        imageAlt="Aerial view of Boudhanath Stupa in Kathmandu at dusk"
      />
      <CompanyDocumentsSection />
      <CtaSection />
    </>
  );
}
