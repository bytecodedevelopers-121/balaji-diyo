import type { Metadata } from "next";
import { CompanyProsePage } from "@/components/sections/CompanyProsePage";
import { RESPONSIBLE_DEFAULTS } from "@/features/page-content/company-defaults";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("responsible"), "seo", RESPONSIBLE_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/company/responsible-travel" });
}

/**
 * Responsible Travel page. The heading, photo and text are editable in the admin (Page Content → Responsible Travel); the layout is shared
 * with the other text pages (see CompanyProsePage).
 */
export default async function ResponsibleTravelPage() {
  const section = resolveSection(await getPageSections("responsible"), "content", RESPONSIBLE_DEFAULTS.content);
  return <CompanyProsePage content={section.content} width={900} />;
}
