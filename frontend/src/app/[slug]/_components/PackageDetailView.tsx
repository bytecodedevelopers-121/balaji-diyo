import { CtaSection } from "@/components/sections/CtaSection";
import { serializeJsonLd } from "@/lib/seo/structured-data";
import { overviewText, type PackageDetail } from "../data";
import { BookingFlowProvider } from "./booking-flow-context";
import { TripHeader } from "./TripHeader";
import { TripTitleBar } from "./TripTitleBar";
import { TabNav } from "./TabNav";
import { BookingSidebar } from "./BookingSidebar";
import { HighlightsAndOverview } from "./HighlightsAndOverview";
import { ItinerarySection } from "./ItinerarySection";
import { InclusionsSection } from "./InclusionsSection";
import { CostSection } from "./CostSection";
import { DeparturesSection } from "./DeparturesSection";
import { RouteMapSection } from "./RouteMapSection";
import { EquipmentSection, PracticalInfoSection } from "./PackingAndKnowBefore";
import { FaqCategoriesSection } from "./FaqCategoriesSection";
import { ReviewsSection } from "./ReviewsSection";
import { StoriesAndSimilar } from "./StoriesAndSimilar";
import { CalendarClock, Map, MessagesSquare } from "lucide-react";
import { SectionRow } from "./SectionRow";
import { AddOnsSection } from "./AddOnsSection";
import { MediaGallerySection } from "./MediaGallerySection";
import { VideoReviewsSection } from "./VideoReviewsSection";

/**
 * Full render for the "package" content type — transcribed from the
 * reference itinerary screenshot (Ama Dablam Base Camp). Pulled out of
 * `page.tsx` so the route file's job is just resolving a flat slug to a
 * content type and dispatching to the matching view; each content type
 * (package today, blog/page/place/story later) gets its own view like
 * this one.
 *
 * Layout: full-bleed gallery (`TripHeader`), then the sticky tab nav,
 * then the title/quick-facts bar (`TripTitleBar` — client-requested
 * reorder 2026-09-02, was above the tab nav until then; `id="overview"`
 * lives on it now, so clicking the Overview tab lands on the trip's name
 * first rather than partway into HighlightsAndOverview's own copy), then
 * a two-column body (main content left, sticky booking widget right)
 * down to the reviews section, then full-bleed stories/similar-packages
 * rows and the existing homepage CtaSection to close — Header/Footer
 * come from the root layout, so this only owns the <main> content
 * between them.
 */
export function PackageDetailView({ trip }: { trip: PackageDetail }) {
  const touristTripJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.title,
    description: overviewText(trip, 200),
    touristType: "Trekkers",
    itinerary: {
      "@type": "ItemList",
      itemListElement: trip.shortItinerary.map((day) => ({
        "@type": "ListItem",
        position: day.day,
        name: day.title,
      })),
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: trip.priceFrom,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(touristTripJsonLd) }}
      />

      <BookingFlowProvider trip={trip}>
        {/*
          `bg-[#FFFAF0]` is the whole package section's background — sits
          behind TripHeader's own opaque photo/gallery and every card's
          own `bg-white`, so it only actually shows through the page's
          own margins/gutters, matching the warm cream (`#fef7f0`-family)
          palette the individual cards on this page already use.

          `pb-24` reserves room for BookingSidebar's mobile-only fixed
          bottom bar (~4.75rem including its safe-area padding) so it
          doesn't sit over StoriesAndSimilar/CtaSection once scrolled
          all the way down; `md:pb-0` drops it once that bar is hidden.
        */}
        <div className="bg-white pb-24 md:pb-0">
          <TripHeader trip={trip} />

          <div className="mx-auto w-full max-w-360 px-6 pb-5 md:px-16">
            <TabNav />
            <TripTitleBar trip={trip} />

            {/*
              `gap-[4px]`, was `gap-[26px]` (was `mt-10`/`gap-12` then
              `mt-8`/`gap-8` before that — 2026-09-03, two passes: an
              initial unify-and-tighten pass across this page and the
              homepage, then a follow-up "reduce 5,6px more" on top of
              that), tightened again 2026-09-14 (direct request: "all the
              section gaps", covering Itinerary/Highlights and the rest
              of this same list) — see AboutSection.tsx's own comment for
              the fuller reasoning on the earlier two passes, including
              why these land on an arbitrary px value instead of the next
              step on Tailwind's 4px scale. This is the vertical rhythm
              between the tab-content blocks a reader scrolls through
              (Highlights, Itinerary, Inclusions, Cost/Departures, Map/
              Charts, Packing, Reviews) — `gap-10` between the main
              column and BookingSidebar (a different, layout-driven gap,
              not one of these content sections) is untouched, and so is
              each of those blocks' own internal `gap-8` (Cost/
              Departures, Map/Charts — a smaller, tighter pairing that
              was never part of any of these passes).
            */}
            <div className="mt-[26px] grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex min-w-0 flex-col gap-[4px]">
                <HighlightsAndOverview trip={trip} />
                <RouteMapSection trip={trip} />
                {/* InclusionsSection owns its own `id="includes"`/`id="excludes"` on its two inner sections. */}
                <SectionRow label="Service Details & Add-Ons">
                  <div className="flex flex-col gap-8">
                    <InclusionsSection trip={trip} />
                    <AddOnsSection trip={trip} />
                    <CostSection trip={trip} />
                  </div>
                </SectionRow>
                <SectionRow id="departures" label="Trip Booking" icon={<CalendarClock aria-hidden="true" className="size-14" strokeWidth={1} />}>
                  <DeparturesSection trip={trip} />
                </SectionRow>
                <MediaGallerySection trip={trip} />
                <SectionRow id="itinerary" label="Roadmap" icon={<Map aria-hidden="true" className="size-14" strokeWidth={1} />}>
                  <ItinerarySection trip={trip} />
                </SectionRow>
                <EquipmentSection trip={trip} />
                <PracticalInfoSection trip={trip} />
                <SectionRow id="faqs" label="Our FAQs" icon={<MessagesSquare aria-hidden="true" className="size-14" strokeWidth={1} />}>
                  <FaqCategoriesSection trip={trip} />
                </SectionRow>
                <div id="reviews" className="scroll-mt-32 py-6">
                  <ReviewsSection trip={trip} />
                </div>
                <VideoReviewsSection trip={trip} />
              </div>

              <div>
                <BookingSidebar trip={trip} />
              </div>
            </div>

          </div>

          <StoriesAndSimilar trip={trip} />
          <CtaSection />
        </div>
      </BookingFlowProvider>
    </>
  );
}
