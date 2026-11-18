import { Reveal } from "@/components/animation/Reveal";
import { getCompanyDocuments } from "@/features/company-documents/api/get-company-documents";
import type { CompanyDocument } from "@/features/company-documents/types/company-document.types";
import { CmsProse } from "@/components/ui/CmsProse";
import { LEGAL_DEFAULTS, type LegalContent } from "@/features/page-content/company-defaults";
import { CompanyDocumentCard } from "./CompanyDocumentCard";

/** Older rows without a type are grouped by title: association, board or membership documents go in the second group. */
const ASSOCIATION_PATTERN = /associat|membership|board|federation|union/i;
const isAssociation = (document: CompanyDocument) =>
  document.category ? document.category === "association" : ASSOCIATION_PATTERN.test(document.title);

function DocumentGroup({ title, documents }: { title: string; documents: CompanyDocument[] }) {
  if (documents.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 data-reveal="up" className="text-[22px] font-bold text-brand-neutral-1000">
        {title}
      </h2>
      <ul className="mt-5 grid grid-cols-2 items-start gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {documents.map((document) => (
          <li key={document.id} data-reveal="up" className="flex flex-col gap-3">
            <CompanyDocumentCard document={document} />
            <div className="text-center">
              <p className="text-[13px] leading-snug font-medium text-logo-navy">{document.title}</p>
              {document.description ? (
                <p className="mt-1 text-[12px] leading-snug text-brand-neutral-700">{document.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Legal Documents": a short statement of registration, a highlighted note,
 * then the scanned certificates in two groups, "Legal Documents" and "Travel
 * and Trade Associations", four to a row with a caption under each. The
 * documents come from `GET /company-documents` (placeholders when the API has
 * none); clicking a scan opens it full size.
 */
export async function CompanyDocumentsSection({ content = LEGAL_DEFAULTS }: { content?: Pick<LegalContent, "intro" | "groups"> } = {}) {
  const documents = await getCompanyDocuments();
  const associations = documents.filter(isAssociation);
  const legal = documents.filter((document) => !isAssociation(document));

  return (
    <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <Reveal variant="auto">
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 data-reveal="up" className="mt-2 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
            {content.intro.title}
          </h1>

          <CmsProse html={content.intro.body} className="mt-5 max-w-[900px] !text-[15px] !leading-[1.8] !text-brand-neutral-800" />

          <div data-reveal="up" className="mt-5 max-w-[900px] rounded-md border border-[#f4e0a6] bg-[#fffaeb] p-5 text-[14px] leading-[1.8] text-brand-neutral-900">
            {content.intro.note}
          </div>

          <DocumentGroup title={content.groups.legalTitle} documents={legal} />
          <DocumentGroup title={content.groups.associationsTitle} documents={associations} />
        </div>
      </Reveal>
    </section>
  );
}
