import { CmsProse } from "@/components/ui/CmsProse";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import type { CmsPage } from "@/features/pages/types/cms-page.types";

interface BankingDetailsSectionProps {
  page: CmsPage;
}

/**
 * `/banking-details`'s body — no design reference exists for this page
 * (unlike every other CMS page built so far, e.g. ResponsibleTourismSection's
 * photo-block layout or BookingTermsSection's ToC sidebar), so this
 * deliberately stays plain: a centered page heading, then the real
 * migrated content (`GET /pages/banking-details`) rendered as-is in a
 * single prose column. No `splitCmsSections` photo-block treatment —
 * that layout was reverse-engineered from a specific screenshot this
 * page doesn't have one of, and the real content here (three numbered
 * bank-account blocks, mostly `<ul>` key/value lists) doesn't obviously
 * split into alternating photo/text sections the way Responsible
 * Tourism's prose did.
 *
 * Left-aligned, not centered like ResponsibleTourismSection's intro —
 * that section is short lead-in copy; this one is the full body,
 * list-heavy, and would read poorly center-aligned at length.
 */
export function BankingDetailsSection({ page }: BankingDetailsSectionProps) {
  const html = page.content ? normalizeCmsHtml(page.content) : "";

  return (
    <section className="bg-brand-neutral-000 py-11">
      <div className="mx-auto w-full max-w-[840px] px-6 md:px-16">
        <h2 className="font-playfair-display text-[32px] leading-[1.2] font-medium text-brand-neutral-1000 sm:text-[44px]">
          {page.title}
        </h2>
        {html ? <CmsProse html={html} className="mt-6" /> : null}
      </div>
    </section>
  );
}
