import type { Metadata } from "next";
import { CompareItinerariesSection } from "@/components/sections/CompareItinerariesSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Compare Itineraries",
  description:
    "Compare trekking itineraries, difficulty, duration, altitude, seasons, prices, accommodation, and highlights side by side.",
  path: "/compare-itineraries",
});

export default function CompareItinerariesPage() {
  return (
    <>
      <CompareItinerariesSection />
      <CtaSection />
    </>
  );
}
