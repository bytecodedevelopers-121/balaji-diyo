import { CmsProse } from "@/components/ui/CmsProse";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import { splitCmsSections } from "@/features/pages/lib/split-cms-sections";
import type { CmsPage } from "@/features/pages/types/cms-page.types";
import { FillImage } from "@/components/ui/FillImage";

interface ResponsibleTourismSectionProps {
  page: CmsPage;
}

/**
 * "Responsible Tourism" — the /responsible-tourism page's body,
 * transcribed from design-references/responsible-tourism.png
 * (+ -mobile.png for the stacking order).
 *
 * CONTENT vs LAYOUT split (confirmed with the user before building):
 * the design's own body copy is placeholder — the same "Ever since Nepal
 * opened its door..." paragraph repeats three times on the mockup and
 * again on legal-documents.png, and both of its image/text blocks carry
 * the identical "Respecting Local Communities" heading. Meanwhile the
 * legacy CMS has a real, ~7.9k-char Responsible Tourism page already
 * migrated into the DB and served by `GET /pages/responsible-tourism`.
 * So this renders the design's *layout* around the *real* content.
 *
 * LAYOUT: follows the new design's structure exactly — a centered intro
 * under the page heading, then alternating half-width photo/text blocks
 * (photo left, then photo right). The real article splits cleanly onto
 * that structure at its own `<h2>` boundaries (see splitCmsSections,
 * shared with BookingTermsSection — it also detects `<h3>` for that
 * page's differently-authored content): the lead paragraphs become the
 * centered intro, and each subsequent section fills one block. An
 * earlier revision of this file rendered the article as one long
 * centered column with full-bleed photo bands — that reproduced how the
 * *old* site presented this page rather than the new design, and was
 * corrected on user feedback.
 *
 * Because real section lengths vary (the "Why Boundless Adventure"
 * section is ~3× the one before it), each block's photo is a fixed-height
 * sticky panel rather than a stretched `h-full` element — side-by-side
 * as the design shows, without a tall section distorting its photo or
 * leaving a long empty gap beside the copy. Any section beyond the two
 * the design provides photos for renders full-width below, so later CMS
 * edits can never silently drop content.
 *
 * White background, not the mockup's black: same correction TeamSection
 * got by direct user feedback, applied to this page-template family
 * since.
 *
 * Both photos ARE taken from this design (unlike the hero — see the page
 * file's comment on why that one couldn't be). Verified clean: scanned
 * the mockup for the exact black/photo column boundary (a hard edge at
 * x=720) before extracting, so neither carries baked-in text.
 */

const BLOCK_PHOTOS = [
  {
    src: "/images/responsible-tourism/mountain-village.jpg",
    alt: "A traditional hillside village below the snow-capped Annapurna range",
  },
  {
    src: "/images/responsible-tourism/durbar-square.jpg",
    alt: "Crowds and a Nepali flag in front of a tiered pagoda temple at Durbar Square",
  },
];

export function ResponsibleTourismSection({ page }: ResponsibleTourismSectionProps) {
  const { intro, sections } = splitCmsSections(
    page.content ? normalizeCmsHtml(page.content) : "",
  );

  const photoBlocks = sections.slice(0, BLOCK_PHOTOS.length);
  const overflowSections = sections.slice(BLOCK_PHOTOS.length);

  return (
    <section className="bg-brand-neutral-000 py-11">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-6 px-6 text-center md:px-16">
        <h2 className="font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-1000">
          {page.title}
        </h2>
        {intro ? (
          <CmsProse html={intro} className="text-center" />
        ) : null}
      </div>

      {photoBlocks.map((section, index) => {
        const photo = BLOCK_PHOTOS[index];
        const photoOnRight = index % 2 === 1;

        return (
          <div
            key={section.id}
            className="mt-16 grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16"
          >
            <div
              className={
                photoOnRight
                  ? "relative order-1 h-[360px] overflow-hidden sm:h-[520px] lg:order-2 lg:sticky lg:top-24"
                  : "relative order-1 h-[360px] overflow-hidden sm:h-[520px] lg:sticky lg:top-24"
              }
            >
              <FillImage
                src={photo.src}
                alt={photo.alt}
                className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
            </div>

            <div
              className={
                photoOnRight
                  ? "order-2 px-6 lg:order-1 lg:pr-0 lg:pl-16"
                  : "order-2 px-6 lg:pr-16 lg:pl-0"
              }
            >
              <CmsProse html={section.html} />
            </div>
          </div>
        );
      })}

      {overflowSections.length > 0 ? (
        <div className="mx-auto mt-16 w-full max-w-[820px] px-6 md:px-0">
          {overflowSections.map((section) => (
            <CmsProse key={section.id} html={section.html} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
