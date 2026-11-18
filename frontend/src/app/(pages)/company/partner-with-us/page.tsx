import type { Metadata } from "next";
import { PartnerFormSection } from "@/components/sections/PartnerSection";
import { CompanyProsePage } from "@/components/sections/CompanyProsePage";
import { PARTNER_DEFAULTS } from "@/features/page-content/company-defaults";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("partner"), "seo", PARTNER_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/company/partner-with-us" });
}

/**
 * Partner with Us page; the enquiry form stays below the text. The heading, photo and text are editable in the admin (Page Content → Partner with Us); the layout is shared
 * with the other text pages (see CompanyProsePage).
 */
export default async function PartnerWithUsPage() {
  const section = resolveSection(await getPageSections("partner"), "content", PARTNER_DEFAULTS.content);
  return <CompanyProsePage content={section.content} width={900} after={<PartnerFormSection />} withCta={false} />;
}
