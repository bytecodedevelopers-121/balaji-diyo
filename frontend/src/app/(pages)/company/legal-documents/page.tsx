import type { Metadata } from "next";
import { CompanyDocumentsSection } from "@/components/sections/CompanyDocumentsSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Legal Documents",
  description: "Joyful Trekking's registration, licences and association certificates, as scanned documents you can view in full.",
  path: "/company/legal-documents",
});

/**
 * Legal Documents: breadcrumb, then the registration statement and the two
 * groups of scanned certificates (see CompanyDocumentsSection). CtaSection is
 * the same closing block every secondary page uses.
 */
export default function LegalDocumentsPage() {
  return (
    <>
      <div className="bg-brand-neutral-000 px-4 pt-6 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1100px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Company" }, { label: "Legal Documents" }]}
          />
        </div>
      </div>
      <CompanyDocumentsSection />
      <CtaSection />
    </>
  );
}
