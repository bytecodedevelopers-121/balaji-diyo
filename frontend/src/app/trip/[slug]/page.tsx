import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { tripHref } from "@/lib/trip-href";
import { getAllPackageSlugs, overviewText } from "../../[slug]/data";
import { resolvePackageBySlug } from "../../[slug]/resolve-content";
import { PackageDetailView } from "../../[slug]/_components/PackageDetailView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Package detail pages live at `/trip/<slug>` (the old flat `/<slug>` URL
 * redirects here — see `app/[slug]/page.tsx`).
 */
export async function generateStaticParams() {
  return (await getAllPackageSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await resolvePackageBySlug(slug);
  if (!trip) return buildMetadata({ title: "Page Not Found", path: tripHref(slug), noIndex: true });

  return buildMetadata({
    title: `${trip.title} | ${trip.quickFacts.find((fact) => fact.label === "Duration")?.value}`,
    description: overviewText(trip, 200),
    path: tripHref(trip.slug),
    image: trip.heroImages[0],
  });
}

export default async function TripPage({ params }: PageProps) {
  const { slug } = await params;
  const trip = await resolvePackageBySlug(slug);
  if (!trip) notFound();

  return <PackageDetailView trip={trip} />;
}
