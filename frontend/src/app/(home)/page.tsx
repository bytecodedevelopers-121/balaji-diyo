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
import { CustomSections } from "@/components/sections/CustomSections";
import { CtaSection } from "@/components/sections/CtaSection";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { HOME_DEFAULTS } from "@/features/page-content/home-defaults";

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
export default async function HomePage() {
  // Every section's copy, images and links are editable in the admin (Page Content → Home);
  // a section the admin switched off is skipped, and missing fields fall back to the built-in defaults.
  const sections = await getPageSections("home");
  const hero = resolveSection(sections, "hero", HOME_DEFAULTS.hero);
  const bestSellers = resolveSection(sections, "bestSellers", HOME_DEFAULTS.bestSellers);
  const upcomingTrips = resolveSection(sections, "upcomingTrips", HOME_DEFAULTS.upcomingTrips, ["noteTitle", "noteBody"]);
  const featuredTours = resolveSection(sections, "featuredTours", HOME_DEFAULTS.featuredTours);
  const exploreNepal = resolveSection(sections, "exploreNepal", HOME_DEFAULTS.exploreNepal);
  const clientReviews = resolveSection(sections, "clientReviews", HOME_DEFAULTS.clientReviews);
  const webStories = resolveSection(sections, "webStories", HOME_DEFAULTS.webStories);
  const faqGuided = resolveSection(sections, "faqGuided", HOME_DEFAULTS.faqGuided);
  const travelNews = resolveSection(sections, "travelNews", HOME_DEFAULTS.travelNews);
  const associatedWith = resolveSection(sections, "associatedWith", HOME_DEFAULTS.associatedWith);
  const customSections = resolveSection(sections, "customSections", HOME_DEFAULTS.customSections);
  const cta = resolveSection(sections, "cta", HOME_DEFAULTS.cta);

  return (
    <>
      {hero.isActive && (
        <Reveal variant="hero">
          <HeroSection content={hero.content} />
        </Reveal>
      )}
      {bestSellers.isActive && <BestSellersSection content={bestSellers.content} />}
      {upcomingTrips.isActive && (
        <Reveal variant="rows" targets="tbody tr">
          <UpcomingTripsSection content={upcomingTrips.content} />
        </Reveal>
      )}
      {featuredTours.isActive && (
        <Reveal variant="stagger-soft" targets="ul > li">
          <FeaturedToursSection content={featuredTours.content} />
        </Reveal>
      )}
      {exploreNepal.isActive && (
        <Reveal variant="auto">
          <ExploreNepalSection content={exploreNepal.content} />
        </Reveal>
      )}
      {clientReviews.isActive && (
        <Reveal variant="stagger-up" targets="ul > li">
          <ClientReviewsSection content={clientReviews.content} />
        </Reveal>
      )}
      {webStories.isActive && (
        <Reveal variant="stagger-up" targets="ul > li">
          <WebStoriesSection content={webStories.content} />
        </Reveal>
      )}
      {faqGuided.isActive && (
        <Reveal variant="auto">
          <FaqGuidedSection content={faqGuided.content} />
        </Reveal>
      )}
      {travelNews.isActive && (
        <Reveal variant="stagger-left" targets="ul > li">
          <TravelNewsSection content={travelNews.content} />
        </Reveal>
      )}
      {associatedWith.isActive && (
        <Reveal variant="zoom">
          <AssociatedWithSection content={associatedWith.content} />
        </Reveal>
      )}
      {customSections.isActive && <CustomSections content={customSections.content} />}
      {cta.isActive && (
        <Reveal variant="auto">
          <CtaSection content={cta.content} />
        </Reveal>
      )}
    </>
  );
}
