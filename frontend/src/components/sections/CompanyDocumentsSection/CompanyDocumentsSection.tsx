import { Reveal } from "@/components/animation/Reveal";
import { getCompanyDocuments } from "@/features/company-documents/api/get-company-documents";
import type { CompanyDocument } from "@/features/company-documents/types/company-document.types";
import { CompanyDocumentCard } from "./CompanyDocumentCard";

/** Documents issued by an association, board or membership body go in the second group. */
const ASSOCIATION_PATTERN = /associat|membership|board|federation|union/i;

function DocumentGroup({ title, documents }: { title: string; documents: CompanyDocument[] }) {
  if (documents.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 data-reveal="up" className="text-[22px] font-bold text-brand-neutral-1000">
        {title}
      </h2>
      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
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
export async function CompanyDocumentsSection() {
  const documents = await getCompanyDocuments();
  const associations = documents.filter((document) => ASSOCIATION_PATTERN.test(document.title));
  const legal = documents.filter((document) => !ASSOCIATION_PATTERN.test(document.title));

  return (
    <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <Reveal variant="auto">
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 data-reveal="up" className="mt-2 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
            Legal Documents
          </h1>

          <p data-reveal="up" className="mt-5 max-w-[900px] text-[15px] leading-[1.8] text-brand-neutral-800">
            <strong className="text-brand-neutral-1000">
              Joyful Trekking Pvt. Ltd. is legally registered and accredited by the Government of Nepal
            </strong>{" "}
            under the Company Act of Nepal, and is licensed by the Department of Tourism (Ministry of Culture, Tourism and Civil Aviation,
            Government of Nepal).
          </p>

          <div data-reveal="up" className="mt-5 max-w-[900px] rounded-md border border-[#f4e0a6] bg-[#fffaeb] p-5 text-[14px] leading-[1.8] text-brand-neutral-900">
            Joyful Trekking Pvt. Ltd. has fulfilled all the legal liabilities to operate a tourism business in Nepal, Tibet and Bhutan. So,
            book your holiday with us without worry, you are in safe hands and can view our legal documents hereunder.
          </div>

          <DocumentGroup title="Legal Documents" documents={legal} />
          <DocumentGroup title="Travel and Trade Associations" documents={associations} />
        </div>
      </Reveal>
    </section>
  );
}
