import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { getTravelGuide, TRAVEL_GUIDES } from "@/config/travel-guides";
import { buildMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TRAVEL_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getTravelGuide(slug);
  if (!guide) return buildMetadata({ title: "Page Not Found", path: `/travel-guides/${slug}`, noIndex: true });
  return buildMetadata({ title: guide.title, description: guide.summary, path: `/travel-guides/${guide.slug}`, image: guide.image });
}

/** One country's travel guide: a grid of topic cards, each linking to its own page. */
export default async function TravelGuideCountryPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getTravelGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1240px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Travel Guides", href: "/travel-guides" }, { label: guide.title }]}
          />
          <h1 className="mt-6 font-display text-[clamp(32px,5vw,52px)] leading-tight font-bold text-brand-neutral-1000">
            {guide.title}
          </h1>

          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {guide.topics.map((topic) => (
              <li key={topic.slug}>
                <Link href={`/travel-guides/${guide.slug}/${topic.slug}`} className="group block">
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[10px]">
                    <FillImage
                      src={topic.image}
                      alt={topic.title}
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
                    />
                  </div>
                  <h2 className="mt-3 text-[24px] font-semibold text-logo-navy group-hover:underline">{topic.title}</h2>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
