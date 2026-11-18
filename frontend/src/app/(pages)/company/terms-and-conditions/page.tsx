import type { Metadata } from "next";
import { CompanyProsePage } from "@/components/sections/CompanyProsePage";
import { TERMS_DEFAULTS } from "@/features/page-content/company-defaults";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("terms"), "seo", TERMS_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/company/terms-and-conditions" });
}

/**
 * Terms and Conditions page. The heading, photo and text are editable in the admin (Page Content → Terms and Conditions); the layout is shared
 * with the other text pages (see CompanyProsePage).
 */
export default async function TermsAndConditionsPage() {
  const section = resolveSection(await getPageSections("terms"), "content", TERMS_DEFAULTS.content);
  return <CompanyProsePage content={section.content} width={900} />;
}
