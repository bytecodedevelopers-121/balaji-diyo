import type { Metadata } from "next";
import { CompanyDocumentsSection } from "@/components/sections/CompanyDocumentsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { LEGAL_DEFAULTS } from "@/features/page-content/company-defaults";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("legal"), "seo", LEGAL_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/company/legal-documents" });
}

/**
 * Legal Documents: breadcrumb, then the registration statement and the two
 * groups of scanned certificates (see CompanyDocumentsSection). CtaSection is
 * the same closing block every secondary page uses.
 */
export default async function LegalDocumentsPage() {
  // Statement text and group headings are editable in the admin (Page Content → Legal Documents);
  // the scanned certificates come from Company Documents in the admin sidebar.
  const sections = await getPageSections("legal");
  const intro = resolveSection(sections, "intro", LEGAL_DEFAULTS.intro).content;
  const groups = resolveSection(sections, "groups", LEGAL_DEFAULTS.groups).content;
  return (
    <>
      <div className="bg-brand-neutral-000 px-4 pt-6 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1100px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Company" }, { label: intro.title }]}
          />
        </div>
      </div>
      <CompanyDocumentsSection content={{ intro, groups }} />
      <CtaSection />
    </>
  );
}
