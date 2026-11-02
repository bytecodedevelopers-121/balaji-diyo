import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { TrekkingRoutesSection } from "@/components/sections/TrekkingRoutesSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Trekking Routes Map of Nepal",
  description:
    "Joyful Trekking Pvt. Ltd.'s trekking route maps for Nepal's most popular treks — legend, itinerary highlights, and a detailed description for every route.",
  path: "/map",
});

/**
 * Transcribed from design-references/trekking-route.png (no mobile
 * variant was provided for this page, unlike most other secondary pages
 * — responsive behavior here follows this codebase's established
 * breakpoint conventions instead of a second reference).
 *
 * Route moved to "/map" (2026-09-03, explicit user direction) from
 * "/trekking-routes-map-of-nepal" — the real legacy URL, found verbatim
 * in boundless.sql (a blog post links to
 * "boundlessadventure.com/trekking-routes-map-of-nepal") and matching
 * this page's own H1 exactly. That legacy URL is preserved as a
 * permanent redirect into this one instead of dropped outright — see
 * `config/legacy-routes.ts` — so existing inbound links/search-engine
 * indexing aren't broken by the rename.
 *
 * PageHero and CtaSection reused verbatim, same as every other
 * secondary page. Hero photo reuses contact/hero.jpg (Ama Dablam at
 * dusk) — the closest existing real export to the design's own rocky/
 * icy peak hero shot; no clean (text-free) source for that exact photo
 * exists anywhere in this repo the way [[boundless-public-frontend-pages]]
 * documents for /team.
 */
export default async function TrekkingRoutesMapPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Nepal" },
          { label: "Trekking Routes In Nepal" },
        ]}
        title="Trekking Routes Map of Nepal"
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/contact/hero.jpg"
        imageAlt="Ama Dablam peak lit by dusk light in the Everest region, Nepal"
      />
      <TrekkingRoutesSection page={page} />
      <CtaSection />
    </>
  );
}
