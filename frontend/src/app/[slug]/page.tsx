import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAllResolvableSlugs, resolveContentBySlug } from "./resolve-content";
import { overviewText } from "./data";
import { PackageDetailView } from "./_components/PackageDetailView";
import { TrekkingRegionDetailSection } from "@/components/sections/TrekkingRegionsSection";
import { CategoryDetailSection } from "@/components/sections/CategoryDetailSection";
import { CtaSection } from "@/components/sections/CtaSection";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * Flat top-level route — `/<slug>` — matching the legacy site's URL
 * structure, where every content type (packages, trekking-region
 * categories, and later blog posts, static pages, destinations, stories) lived directly under the root
 * rather than namespaced (`/packages/<slug>`, `/blog/<slug>`, ...). See
 * `./resolve-content.ts` for how a slug maps to a content type.
 *
 * Next.js always resolves a matching static route (`/about`, `/contact`,
 * a future `/blog` listing, etc.) before falling through to this dynamic
 * segment, so adding those pages later doesn't need any change here —
 * this only ever handles slugs with no more specific route.
 */
export async function generateStaticParams() {
  return (await getAllResolvableSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await resolveContentBySlug(slug);

  if (!content) {
    return buildMetadata({ title: "Page Not Found", path: `/${slug}`, noIndex: true });
  }

  switch (content.type) {
    case "package": {
      const trip = content.data;
      return buildMetadata({
        title: `${trip.title} | ${trip.quickFacts.find((f) => f.label === "Duration")?.value}`,
        description: overviewText(trip, 200),
        path: `/${trip.slug}`,
        image: trip.heroImages[0],
      });
    }
    case "trekking-region": {
      const { region } = content.data;
      return buildMetadata({
        title: region.meta?.metaTitle || region.title,
        description: region.meta?.metaDescription || region.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
        path: `/${region.slug}`,
        image: region.imageUrl ?? undefined,
      });
    }
    case "category": {
      const { category } = content.data;
      return buildMetadata({
        title: category.title,
        description: category.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
        path: `/${category.slug}`,
        image: category.imageUrl ?? undefined,
      });
    }
  }
}

export default async function FlatSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const content = await resolveContentBySlug(slug, page);

  if (!content) {
    notFound();
  }

  switch (content.type) {
    case "package":
      return <PackageDetailView trip={content.data} />;
    case "trekking-region":
      return (
        <>
          <TrekkingRegionDetailSection data={content.data} />
          <CtaSection />
        </>
      );
    case "category":
      return (
        <>
          <CategoryDetailSection data={content.data} />
          <CtaSection />
        </>
      );
  }
}
