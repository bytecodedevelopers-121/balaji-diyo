import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { WhyBoundlessSection } from "@/components/sections/WhyBoundlessSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Why Joyful Trekking Pvt. Ltd.",
  description:
    "Because the details you don't see are the ones that make the difference.",
  path: "/why-boundless-adventure",
});

/**
 * Confirmed real legacy URL (user-supplied, 2026-08-13):
 * https://boundlessadventure.com/why-boundless-adventure. Transcribed
 * from design-references/"Why Boundless Adventure.png" — see each
 * section component's own doc comment for its exact source region.
 * FeaturesSection and CtaSection are reused verbatim from the homepage
 * (same heading/copy/icons in the reference, confirmed pixel-for-pixel
 * against homepage.png).
 */
export default function WhyBoundlessAdventurePage() {
  return (
    <>
      <PageHero
        // "Nepal" and "About" have no confirmed route of their own
        // (unlike Home and this page) — rendered as plain breadcrumb
        // text rather than a guessed href, per this codebase's
        // don't-invent-routes rule (see navigation.ts).
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About" },
          { label: "Why Joyful Trekking Pvt. Ltd." },
        ]}
        title="Why travel with us."
        subtitle="Because the details you don't see are the ones that make the difference."
        image="/images/why-boundless/hero.jpg"
        imageAlt="A porter carrying supplies below a snow-capped Himalayan peak"
      />
      <WhyBoundlessSection />
      <FeaturesSection />
      <CtaSection />
    </>
  );
}
