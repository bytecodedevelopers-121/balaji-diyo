import { getCompanyDocuments } from "@/features/company-documents/api/get-company-documents";
import { CompanyDocumentCard } from "./CompanyDocumentCard";

/**
 * "Legal Documents" — the /company-documents page's main section,
 * transcribed from design-references/legal-documents.png (y≈300–2470 at
 * 1440px): centered intro copy on a section background, then a 3-column
 * grid of document cards (image, title, description). No per-document
 * detail page/link ("Read More") — the design shows plain static cards.
 *
 * White background, matching TeamSection's own correction (the black
 * background this same template family originally shipped with was
 * removed there per direct user feedback 2026-08-19) — applied
 * proactively here rather than reintroducing the same issue, since this
 * page uses the identical intro-section template.
 *
 * The intro copy is byte-identical to TeamSection's — the design's own
 * desktop mockup shows this exact "As pioneers in Nepali tourism..."
 * text here too (the mobile mockup shows a different, Nepal-trekking-
 * themed paragraph instead — kept out of scope as the less likely
 * canonical version; the desktop mockup is the primary reference and
 * this exact text was already confirmed correct for the sibling /team
 * page). Kept verbatim/duplicated rather than "fixed", per this
 * codebase's established fidelity rule for reused design copy (see
 * AboutUsIntroSection's own comment on the same pattern).
 *
 * No real document scan images exist anywhere yet (unlike the sibling
 * /team page's photos, which turned out to already be sitting in the
 * legacy-migrated uploads — checked, nothing equivalent here since this
 * whole feature is new, not migrated). The 9 real document titles below
 * are transcribed from the design reference (real content, just no
 * accompanying image asset); cards fall back to a plain document-shaped
 * placeholder icon until an admin uploads the real scans via the new
 * "Document Image" field (frontend-admin's CompanyDocumentForm).
 * Deliberately not extracting the scanned certificates from the design
 * screenshot itself the way team photos were — those scans include a
 * real person's ID photo and government document numbers, a different
 * sensitivity level than stock/team photography, not something to
 * publish without explicit confirmation.
 */
export async function CompanyDocumentsSection() {
  const documents = await getCompanyDocuments();

  return (
    <section className="bg-brand-neutral-000 py-11">
      <div className="mx-auto flex w-full max-w-[1442px] flex-col items-center gap-6 px-6 text-center md:px-16">
        <h2 className="font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-1000">
          Legal Documents
        </h2>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          As pioneers in Nepali tourism, we have felt the pulse and rhythm of
          the country with every virgin trail we&apos;ve walked, every nook
          and cranny we&apos;ve traversed, and every new face that has smiled
          at us. We know every bump on the road, every bloodstain in our
          history and the slightest gesture in our culture. Believe us when
          we say that we single-handedly bring more to the table than the
          entire travel industry set up in Thamel.
        </p>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          Joyful Trekking Pvt. Ltd.: A child was growing up, observing and
          enjoying the geographical variation and the beauty it produced.
          Since childhood, he has enjoyed the chirps of birds, the howling of
          jackals, the gurgling of rivers, and the Himalayas playing
          hide-and-seek with clouds, and trees staying bare, sometimes, then
          again, bearing new leaves and fruits of their kind. Besides, he
          observed and participated in cultural programs celebrated in his
          multi-ethnic communities. His upbringing taught him to love nature
          and respect culture.
        </p>
      </div>

      <div className="mx-auto mt-14 grid w-full max-w-[1312px] grid-cols-1 gap-x-11 gap-y-14 px-6 sm:grid-cols-2 md:px-16 lg:grid-cols-3 lg:px-0">
        {documents.map((document) => (
          <div key={document.id} className="flex flex-col gap-4">
            <CompanyDocumentCard document={document} />
            <div className="flex flex-col gap-1 text-left">
              <p className="font-playfair-display text-xl text-brand-neutral-900">
                {document.title}
              </p>
              {document.description ? (
                <p className="text-body-l text-brand-neutral-700">
                  {document.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
