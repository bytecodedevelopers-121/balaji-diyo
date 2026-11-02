import type { Metadata } from "next";
import { CtaSection } from "@/components/sections/CtaSection";
import { TrekkingRegionsOverviewSection } from "@/components/sections/TrekkingRegionsSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Trekking Routes In Nepal Himalayas",
  description: "Explore the best trekking routes in the Nepal Himalayas, from iconic base camps to remote, culturally rich mountain regions.",
  path: "/trekking-routes-in-nepal",
});

export default function TrekkingRoutesInNepalPage() {
  return (
    <>
      <TrekkingRegionsOverviewSection />
      <CtaSection />
    </>
  );
}
