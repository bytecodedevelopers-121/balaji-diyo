import { Reveal } from "@/components/animation/Reveal";
import { HeroSection } from "@/components/sections/HeroSection";
import { BestSellersSection } from "@/components/sections/BestSellersSection";
import { UpcomingTripsSection } from "@/components/sections/UpcomingTripsSection";
import { FeaturedToursSection } from "@/components/sections/FeaturedToursSection";
import { ExploreNepalSection } from "@/components/sections/ExploreNepalSection";
import { ClientReviewsSection } from "@/components/sections/ClientReviewsSection";
import { WebStoriesSection } from "@/components/sections/WebStoriesSection";
import { FaqGuidedSection } from "@/components/sections/FaqGuidedSection";
import { TravelNewsSection } from "@/components/sections/TravelNewsSection";
import { AssociatedWithSection } from "@/components/sections/AssociatedWithSection";
import { CtaSection } from "@/components/sections/CtaSection";

/**
 * Temporary homepage. No page-level metadata export — it inherits the
 * root layout's default title/description/OG for "/". Section order
 * mirrors the Figma section boundaries; each section is currently a
 * neutral placeholder pending the real design pass.
 *
 * (2026-09-22: "Most Popular Journeys" (`PopularTripsSection` below)
 * shows the *featured* pool and "Trips"/"The 2026/27 Lineup"
 * a typo. A same-day pass first tried giving "Most Popular Journeys"
 * its own `isPopular` data plus a brand-new "Featured Trips" section
 * above it, but that added a section that was never asked for;
 * corrected per direct feedback to instead just swap which existing
 * section reads which pool, keeping both titles/positions as they
 * own comments for the data-source reasoning on each side.)
 */
export default function HomePage() {
  return (
    <>
      <Reveal variant="hero">
        <HeroSection />
      </Reveal>
      <BestSellersSection />
      <Reveal variant="rows" targets="tbody tr">
        <UpcomingTripsSection />
      </Reveal>
      <Reveal variant="stagger-soft" targets="ul > li">
        <FeaturedToursSection />
      </Reveal>
      <Reveal variant="auto">
        <ExploreNepalSection />
      </Reveal>
      <Reveal variant="stagger-up" targets="ul > li">
        <ClientReviewsSection />
      </Reveal>
      <Reveal variant="stagger-up" targets="ul > li">
        <WebStoriesSection />
      </Reveal>
      <Reveal variant="auto">
        <FaqGuidedSection />
      </Reveal>
      <Reveal variant="stagger-left" targets="ul > li">
        <TravelNewsSection />
      </Reveal>
      <Reveal variant="zoom">
        <AssociatedWithSection />
      </Reveal>
      <Reveal variant="auto">
        <CtaSection />
      </Reveal>
    </>
  );
}
