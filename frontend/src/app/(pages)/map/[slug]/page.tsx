import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrekkingRouteDetailSection } from "@/components/sections/TrekkingRoutesSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getTrekkingRoutes } from "@/features/trekking-routes/api/get-trekking-routes";
import { getTrekkingRouteBySlug } from "@/features/trekking-routes/api/get-trekking-route-by-slug";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateStaticParams() {
  // Same "over-fetch the whole list once" shortcut as /team/[slug]'s own
  // generateStaticParams — 48 real routes today, not a scale that needs
  // walking every page of the real paginated listing endpoint.
  const { items: routes } = await getTrekkingRoutes(1, 100);
  return routes.filter((route) => route.slug).map((route) => ({ slug: route.slug as string }));
}

export async function generateMetadata(
  props: PageProps<"/map/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const route = await getTrekkingRouteBySlug(slug);

  if (!route) {
    return buildMetadata({
      title: "Trekking Route Not Found",
      path: `/map/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: route.mapTitle,
    description: route.mapAbstract?.replace(/<[^>]+>/g, " ").trim().slice(0, 200) || undefined,
    path: `/map/${route.slug}`,
  });
}

/**
 * Transcribed from design-references/trekking-route-details.png — see
 * TrekkingRouteDetailSection for the section itself; this file is just
 * data-fetching + the same 404 handling /team/[slug]/page.tsx already
 * established (that page's own comment explains the real HTTP status
 * caveat — still 200, not a true 404, per Next 16's streaming behavior).
 */
export default async function TrekkingRouteDetailPage(
  props: PageProps<"/map/[slug]">,
) {
  const { slug } = await props.params;
  const route = await getTrekkingRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  return (
    <>
      <TrekkingRouteDetailSection route={route} />
      <CtaSection />
    </>
  );
}
