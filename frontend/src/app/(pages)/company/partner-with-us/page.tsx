import type { Metadata } from "next";
import { PartnerFormSection } from "@/components/sections/PartnerSection";
import { PARTNER_FORM_IDS } from "@/config/partner-content";
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
  const sections = await getPageSections("partner");
  const section = resolveSection(sections, "content", PARTNER_DEFAULTS.content);
  const forms = resolveSection(sections, "forms", PARTNER_DEFAULTS.forms);
  // The admin picks which enquiry tabs show; switching the whole section off hides the form.
  const visibleFormIds = forms.isActive
    ? PARTNER_FORM_IDS.filter((id) => forms.content[id] !== "Hide")
    : [];
  return (
    <CompanyProsePage
      content={section.content}
      width={900}
      after={visibleFormIds.length > 0 ? <PartnerFormSection visibleFormIds={visibleFormIds} /> : null}
      withCta={false}
    />
  );
}
