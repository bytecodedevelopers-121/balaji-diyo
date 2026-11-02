import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VolunteeringSection } from "@/components/sections/VolunteeringSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getCmsPage } from "@/features/pages/api/get-cms-page";
import { buildMetadata } from "@/lib/seo/metadata";

const SLUG = "volunteering-in-nepal";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage(SLUG);
  return buildMetadata({
    title: page?.meta?.metaTitle || "Volunteering in Nepal",
    description:
      page?.meta?.metaDescription ||
      "Combine adventure and service through a meaningful volunteering experience in Nepal.",
    path: `/${SLUG}`,
    noIndex: !page,
  });
}

export default async function VolunteeringInNepalPage() {
  const page = await getCmsPage(SLUG);
  if (!page) notFound();

  return (
    <>
      <VolunteeringSection />
      <CtaSection />
    </>
  );
}
