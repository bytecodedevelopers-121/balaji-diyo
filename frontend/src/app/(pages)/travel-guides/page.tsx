import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { TRAVEL_GUIDES } from "@/config/travel-guides";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Travel Guides",
  description: "Country-wise travel guides for Nepal, Bhutan and Tibet: best time to visit, highlights, visas and getting around.",
  path: "/travel-guides",
});

/** Travel Guides index: one card per country, linking to its own guide. */
export default function TravelGuidesPage() {
  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1240px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Travel Guides" }]}
          />
          <h1 className="mt-6 font-display text-[clamp(32px,5vw,52px)] leading-tight font-bold text-brand-neutral-1000">
            Travel Guides
          </h1>

          <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TRAVEL_GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/travel-guides/${guide.slug}`} className="group block">
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[10px]">
                    <FillImage
                      src={guide.image}
                      alt={guide.title}
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width:768px) 33vw, 100vw"
                    />
                  </div>
                  <h2 className="mt-3 text-[24px] font-semibold text-logo-navy group-hover:underline">{guide.title}</h2>
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
