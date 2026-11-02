import type { Metadata } from "next";
import { AttractionsSection } from "@/components/sections/AttractionsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getAttractions } from "@/features/attractions/api/get-attractions";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("attractions");
  return buildMetadata({
    title: page?.meta?.metaTitle || page?.title || "Trekking Attractions in Nepal",
    description: page?.meta?.metaDescription || "Explore villages, viewpoints, valleys, alpine lakes and landmarks across Nepal's major trekking regions.",
    path: "/attractions",
  });
}

export default async function AttractionsPage() {
  const [data, page] = await Promise.all([getAttractions(), getCmsPage("attractions")]);
  return <><AttractionsSection data={data} page={page} /><CtaSection /></>;
}
