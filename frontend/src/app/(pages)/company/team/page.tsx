import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { TeamSection } from "@/components/sections/TeamSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Our Team",
  description:
    "Know the heroes who work behind the scenes and make things happen on the ground to give you a remarkable travel story.",
  path: "/company/team",
});

/**
 * Transcribed from design-references/our-team.png and
 * design-references/ourteamcss/team.txt — see PageHero and TeamSection
 * for each section's own source region/spec. CtaSection is reused
 * verbatim from the homepage/about-us/why-boundless-adventure pages
 * (same "Let's Plan Your Trip Together" block, confirmed pixel-for-pixel
 * against the reference).
 *
 * "/company/team" confirmed real legacy URL (direct from the user, 2026-08-18) —
 * same confirmed-real-URL status as about-us/why-boundless-adventure
 * (see navigation.ts), not a guess like the initial "/our-team" this page
 * launched at.
 */
export default function TeamPage() {
  return (
    <>
      <PageHero
        compact
        // "Nepal" and "About" have no confirmed route of their own —
        // same plain-text breadcrumb treatment as the about-us and
        // why-boundless-adventure pages (see those pages' own comments).
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "About" },
          { label: "Our Team" },
        ]}
        title="Our Team"
        subtitle="Know the heroes who work behind the scenes and make things happen on the ground to give you a remarkable travel story."
        // The design reference (our-team.png) shows a dusk/sunset version
        // of this shot, but only as a flattened screenshot with the
        // headline/breadcrumb already baked into the pixels — no clean
        // export exists for it the way about-us/why-boundless-adventure
        // each got a real separate hero photo. Reuses the homepage's own
        // clean hero-poster.jpg (same Himalayan-peak-through-clouds
        // subject) rather than ship a heavily blurred/degraded version of
        // the sunset shot just to erase the ghosted duplicate text. Swap
        // in a real clean export of the sunset photo here if one becomes
        // available.
        image="/images/team/hero.jpg"
        imageAlt="A snow-capped Himalayan peak rising through clouds"
      />
      <TeamSection />
      <CtaSection />
    </>
  );
}
