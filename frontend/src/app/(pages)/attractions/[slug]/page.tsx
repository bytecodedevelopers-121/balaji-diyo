import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AttractionDetailSection } from "@/components/sections/AttractionDetailSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getAttractionBySlug } from "@/features/attractions/api/get-attraction-by-slug";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(props: PageProps<"/attractions/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const attraction = await getAttractionBySlug(slug);
  if (!attraction) return buildMetadata({ title: "Attraction Not Found", path: `/attractions/${slug}`, noIndex: true });
  return buildMetadata({
    title: attraction.meta?.metaTitle || attraction.placeName,
    description: attraction.meta?.metaDescription || attraction.placeAbstract?.replace(/<[^>]+>/g, " ").trim().slice(0, 200),
    path: `/attractions/${attraction.slug}`,
  });
}

export default async function AttractionPage(props: PageProps<"/attractions/[slug]">) {
  const { slug } = await props.params;
  const attraction = await getAttractionBySlug(slug);
  if (!attraction) notFound();
  return <><AttractionDetailSection attraction={attraction} /><CtaSection /></>;
}
