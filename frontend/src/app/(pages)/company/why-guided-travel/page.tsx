import type { Metadata } from "next";
import { CompanyProsePage } from "@/components/sections/CompanyProsePage";
import { GUIDED_DEFAULTS } from "@/features/page-content/company-defaults";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("guided"), "seo", GUIDED_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/company/why-guided-travel" });
}

/**
 * Why Guided Travel? page. The heading, photo and text are editable in the admin (Page Content → Why Guided Travel); the layout is shared
 * with the other text pages (see CompanyProsePage).
 */
export default async function WhyGuidedTravelPage() {
  const section = resolveSection(await getPageSections("guided"), "content", GUIDED_DEFAULTS.content);
  return <CompanyProsePage content={section.content} width={860} />;
}
