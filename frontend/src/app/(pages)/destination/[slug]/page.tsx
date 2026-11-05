import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CMS_ARTICLE_CLASSES } from "@/components/ui/cms-article-classes";
import { CmsProse } from "@/components/ui/CmsProse";
import { FillImage } from "@/components/ui/FillImage";
import { DESTINATIONS, getDestination, type Destination } from "@/config/destinations";
import { getAllCategorySlugsWithPackages, getCategoryPackageCount } from "@/features/trips/api/get-category-by-slug";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { sampleTripsForCountry } from "@/lib/sample-trips";
import { buildMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DESTINATIONS.map((destination) => ({ slug: destination.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) return buildMetadata({ title: "Page Not Found", path: `/destination/${slug}`, noIndex: true });
  return buildMetadata({
    title: `${destination.name} Travel and Tours`,
    description: destination.intro,
    path: `/destination/${destination.slug}`,
    image: destination.heroImage,
  });
}

/**
 * How many packages each card's category has: the live count for cards whose
 * link is a real category, else the sample trips. Only real category slugs are
 * looked up, so cards that link to ordinary pages never hit the API with a
 * slug it would answer with a 404.
 */
async function packageCounts(destination: Destination): Promise<Record<string, number>> {
  const realSlugs = new Set(await getAllCategorySlugsWithPackages().catch(() => [] as string[]));
  const counts: Record<string, number> = {};
  await Promise.all(
    destination.cards.map(async (card) => {
      const slug = card.href.replace(/^\/+|\/+$/g, "");
      counts[card.label] = realSlugs.has(slug) ? ((await getCategoryPackageCount(slug)) ?? 0) : 0;
    }),
  );

  if (SHOW_SAMPLE_DATA && Object.values(counts).every((count) => count === 0)) {
    const samples = sampleTripsForCountry(destination.countryLabel);
    for (const card of destination.cards) {
      counts[card.label] = card.categoryKey ? samples.filter((trip) => trip.categories?.includes(card.categoryKey as never)).length : 0;
    }
  }
  return counts;
}

/** A country landing page: hero photo, intro, category cards with package counts and a long-form guide. */
export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) notFound();

  const counts = await packageCounts(destination);

  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-10 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[920px]">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[10px] bg-brand-neutral-200">
            <FillImage
              src={destination.heroImage}
              alt={destination.name}
              className="absolute inset-0 size-full object-cover"
              sizes="(min-width:920px) 920px, 100vw"
              preload
            />
          </div>

          <div className="mx-auto mt-5 w-full max-w-[760px]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[{ label: "Home", href: "/" }, { label: "Destinations" }, { label: destination.name }]}
            />
            <h1 className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
              {destination.name}
            </h1>
            <p className="mt-4 text-[13px] leading-[1.8] font-semibold text-brand-neutral-1000">{destination.intro}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#fcefe3] px-4 py-10 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1170px]">
          <ul className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">
            {destination.cards.map((card) => (
              <li key={card.label}>
                <Link
                  href={card.href}
                  className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-brand-neutral-300 bg-white"
                >
                  <div className="px-6 pt-6 pb-5">
                    <h2 className="text-[20px] leading-snug font-medium text-brand-neutral-1000 group-hover:underline">{card.label}</h2>
                    {(counts[card.label] ?? 0) > 0 ? (
                    <p className="mt-2 flex items-center gap-2 text-[13px] text-brand-neutral-800">
                      <svg viewBox="0 0 24 24" className="size-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinejoin="round" />
                      </svg>
                      {counts[card.label]} Packages
                    </p>
                    ) : null}
                  </div>
                  <div className="relative mt-auto h-64 w-full shrink-0 bg-brand-neutral-200">
                    <FillImage
                      src={card.image}
                      alt={card.label}
                      className="absolute inset-0 size-full object-cover"
                      sizes="(min-width:1024px) 270px, (min-width:520px) 50vw, 100vw"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-brand-neutral-000 px-4 pt-10 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[760px]">
          <CmsProse html={destination.contentHtml} className={CMS_ARTICLE_CLASSES} />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
