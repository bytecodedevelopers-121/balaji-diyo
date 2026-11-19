import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { tripHref } from "@/lib/trip-href";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAllResolvableSlugs, resolveContentBySlug } from "./resolve-content";
import { overviewText } from "./data";
import { TrekkingRegionDetailSection } from "@/components/sections/TrekkingRegionsSection";
import { CategoryDetailSection } from "@/components/sections/CategoryDetailSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { CompanyProsePage } from "@/components/sections/CompanyProsePage";

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
        path: tripHref(trip.slug),
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
    case "cms-page": {
      const cms = content.data;
      return buildMetadata({
        title: cms.meta?.metaTitle || cms.title,
        description:
          cms.meta?.metaDescription ||
          cms.content?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
        path: `/${cms.slug ?? slug}`,
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
      // Package pages live at /trip/<slug>; keep old links and bookmarks working.
      permanentRedirect(tripHref(content.data.slug));
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
    case "cms-page":
      return (
        <CompanyProsePage
          content={{ title: content.data.title, body: content.data.content ?? "" }}
          crumb={null}
          after={
            content.data.linkedPagePath ? (
              <div className="bg-brand-neutral-000 px-4 pb-16 text-center min-[768px]:px-10">
                <Link
                  href={content.data.linkedPagePath}
                  className="inline-flex h-12 items-center justify-center rounded-pill bg-logo-sun px-8 text-[16px] font-bold text-logo-navy-dark transition-opacity hover:opacity-90"
                >
                  Continue to {content.data.linkedPageLabel || "the next page"} →
                </Link>
              </div>
            ) : null
          }
        />
      );
  }
}
