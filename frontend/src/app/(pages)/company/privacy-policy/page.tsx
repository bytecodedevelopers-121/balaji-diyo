import type { Metadata } from "next";
import { CompanyProsePage } from "@/components/sections/CompanyProsePage";
import { PRIVACY_DEFAULTS } from "@/features/page-content/company-defaults";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("privacy"), "seo", PRIVACY_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/company/privacy-policy" });
}

/**
 * Privacy Policy page. The heading, photo and text are editable in the admin (Page Content → Privacy Policy); the layout is shared
 * with the other text pages (see CompanyProsePage).
 */
export default async function PrivacyPolicyPage() {
  const section = resolveSection(await getPageSections("privacy"), "content", PRIVACY_DEFAULTS.content);
  return <CompanyProsePage content={section.content} width={900} />;
}
