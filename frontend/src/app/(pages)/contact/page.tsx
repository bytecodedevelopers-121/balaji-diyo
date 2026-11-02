import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ContactSection } from "@/components/sections/ContactSection";
import { ContactMapSection } from "@/components/sections/ContactMapSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Get in Touch",
  description:
    "Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply.",
  path: "/contact",
});

/**
 * Transcribed from design-references/contact.png (+ contact-mobile.png
 * for the responsive stacking/reorder — see ContactSection's own
 * comment on the mobile "form first" order). PageHero and CtaSection
 * reused verbatim, same as every other secondary page.
 *
 * Hero photo + the ContactSection stupa/bird illustration are both real
 * exports pulled straight from the Figma file (nodes 2001:6638 and
 * 2001:6649, file tClntpewa7VwaYU4sbo2cj) rather than crops of the
 * flattened design-reference screenshot — see the asset-sourcing note
 * in ContactSection.tsx for why that screenshot's own black background
 * for this section was NOT trusted as the real value.
 */
export default function ContactPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "Contact Us" },
        ]}
        title="Get in Touch"
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/contact/hero.jpg"
        imageAlt="Ama Dablam peak lit by dusk light in the Everest region, Nepal"
      />
      <ContactSection />
      <ContactMapSection />
      <CtaSection />
    </>
  );
}
