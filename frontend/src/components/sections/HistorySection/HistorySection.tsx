const MILESTONES = [
  {
    year: "1992 – 2008",
    title: "Guiding the Himalayas",
    paragraphs: [
      "Dambar Khadka — who would go on to found Joyful Trekking Pvt. Ltd. — spent these years leading trekkers through the Himalayas as a guide for an established trekking company, building the on-the-ground experience in Nepal's trails, terrain, and local customs the company still runs on today.",
    ],
  },
  {
    year: "2008 – 2010",
    title: "Working Independently",
    paragraphs: [
      "He struck out on his own as a freelance guide, continuing to lead trips through Nepal while building the relationships and reputation that would soon become the foundation of his own company.",
    ],
  },
  {
    year: "2010 – Present",
    title: "Founding Joyful Trekking Pvt. Ltd.",
    paragraphs: [
      "Drawing on nearly two decades in the field, Dambar Khadka founded Joyful Trekking Pvt. Ltd. with a team of fellow field experts, turning that guiding and freelance experience into a company focused on the traveler's satisfaction.",
      "The company built early partnerships with hotels including Yak & Yeti, Annapurna, Shangri-La, and Malla, and grew its team of field staff and tour leaders. Starting from a small space with three countries as trip destinations, it has continued expanding its reach ever since.",
    ],
  },
];

/**
 * "Our History" timeline, transcribed from Figma. The mock shows 3
 * dated milestones ("1962-2008 Planning & Foundation", etc.) — that's
 * placeholder copy, not real content: the real `about-us` CMS body
 * has no such dates anywhere (confirmed against `GET /pages/about-us`
 * 2026-08-27).
 *
 * These 3 milestones ARE real, though — from the CMS body's own
 * "6-Reliability Boundless Adventure Nepal" section: "[Dambar Khadka]
 * has led trekkers in the Himalayas from 1992 A.D till 2008 A.D. as a
 * guide from a trekking company, from 2008 to 2010 had been working
 * as a freelancer guide and decided to have his own company." That
 * directly *contradicts* the other real section this file used to
 * quote ("4-History...", "in 1992, he operated his own company") —
 * the old site's own migrated copy disagrees with itself on the
 * founding year. Per explicit user direction (2026-08-27, after
 * surfacing the conflict) this file uses the Reliability section's
 * more granular 3-period story — 1992–2008 guiding for another
 * company, 2008–2010 freelancing, 2010–present running Boundless
 * Adventure — over the single "founded 1992" claim. The big "1992"
 * watermark number below stays: it's still the real start of this
 * real timeline, just now framed as when Dambar Khadka's own
 * Himalayan-guiding story began rather than the company's founding
 * year specifically.
 *
 * Decoupled fully from the CMS as of the same rewrite that surfaced
 * this (see `AboutUsIntroSection`'s own comment for why): the legacy
 * article was never written in this design's dated-milestone shape,
 * so force-fitting it through `splitCmsSections` was always going to
 * be a losing fit. The rest of that legacy article no longer renders
 * anywhere on this page — an earlier pass added a block for it
 * further down, removed same day per explicit "don't display the old
 * content, match the Figma design" direction.
 */
export function HistorySection() {
  return (
    <section className="relative overflow-hidden bg-brand-neutral-200 py-[2px] sm:py-[25px]">
      <p
        aria-hidden="true"
        className="pointer-events-none absolute top-[50px] left-1/2 sm:top-[73px] -translate-x-1/2 text-[220px] leading-none font-bold text-brand-neutral-000 select-none"
      >
        1992
      </p>

      <div className="relative mx-auto w-full max-w-[1136px] px-6 md:px-0">
        <h2 className="text-center font-playfair-display text-[40px] leading-[1.15] font-medium text-brand-neutral-1000 sm:text-display-section">
          Our History
        </h2>

        <ol className="mt-16 flex flex-col gap-16">
          {MILESTONES.map((milestone, index) => (
            <li key={milestone.year} className="relative flex gap-6 pl-2">
              {index < MILESTONES.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-10 left-[28px] h-[calc(100%+64px-40px)] border-l border-dashed border-brand-neutral-500"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-500 bg-brand-neutral-200 text-body-m font-medium text-primary-500"
              >
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="font-poppins text-body-l font-medium text-primary-500">
                  {milestone.year}
                </p>
                <p className="font-poppins text-heading-2xl font-bold text-primary-500">
                  {milestone.title}
                </p>
                {milestone.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="font-poppins text-body-l font-medium text-brand-neutral-1000"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
