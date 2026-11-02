import { CmsProse } from "@/components/ui/CmsProse";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import { splitCmsSections } from "@/features/pages/lib/split-cms-sections";
import type { CmsPage } from "@/features/pages/types/cms-page.types";
import { TableOfContentsNav } from "@/components/ui/TableOfContentsNav";

interface BookingTermsSectionProps {
  page: CmsPage;
}

/**
 * "Booking Terms and Conditions" — the /booking-terms-and-conditions
 * page's body, transcribed from design-references/"Booking Terms and
 * Conditions.png" (+ booking-terms-mobile.png).
 *
 * Real content, real layout — unlike responsible-tourism, this design's
 * *structure* (sidebar table of contents + numbered sections) is also
 * genuinely useful for the real CMS article, not just its look: the real
 * `booking-terms-and-conditions` page (GET /pages/booking-terms-and-
 * conditions) already has 6 real numbered `<h3>` sections (Trip Booking
 * Terms, Deposit Requirement, Cancellation, Flight Delays, Services
 * Missed, Updating of Terms) that map onto the design's sidebar-nav
 * pattern directly — see splitCmsSections, shared with
 * ResponsibleTourismSection.
 *
 * The design's own sidebar items are placeholder, and inconsistent with
 * each other: the desktop mockup's list ("Down payment", "How to pay
 * your deposit", "Payment of the balance", ...) literally repeats itself
 * after "Incomplete tour", and the mobile mockup shows a *different* set
 * of tab labels ("Preparation & Fitness", "Permits", "Insurance", ...)
 * than the desktop sidebar. So the sidebar/tabs are generated from the
 * real section headings (TableOfContentsNav), not transcribed from
 * either mockup's list.
 *
 * No separate "Booking Terms and Conditions" H2 repeats the page title
 * here — the design goes straight from the hero into the two-column
 * layout, unlike legal-documents/responsible-tourism which repeat the
 * title as a section heading.
 *
 * The floating WhatsApp button this section used to mount itself is
 * now global (root layout, 2026-08-27) — every page gets it, not just
 * this one, so it's no longer rendered here.
 */
export function BookingTermsSection({ page }: BookingTermsSectionProps) {
  const { intro, sections } = splitCmsSections(
    page.content ? normalizeCmsHtml(page.content) : "",
  );

  return (
    <section className="bg-brand-neutral-000 py-16">
      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-8 px-6 md:px-16 lg:flex-row lg:items-start lg:gap-16">
        <TableOfContentsNav
          items={sections.map(({ id, heading }) => ({ id, heading }))}
        />

        <div className="min-w-0 flex-1">
          {intro ? <CmsProse html={intro} className="mb-10" numberedHeadings /> : null}
          {sections.map((section) => (
            <CmsProse key={section.id} html={section.html} className="mb-10" numberedHeadings />
          ))}
        </div>
      </div>
    </section>
  );
}
