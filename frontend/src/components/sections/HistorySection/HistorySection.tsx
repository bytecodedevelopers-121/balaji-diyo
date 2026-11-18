import { Compass, Flag, Footprints } from "lucide-react";
import { CmsProse } from "@/components/ui/CmsProse";
import { FillImage } from "@/components/ui/FillImage";
import { ABOUT_DEFAULTS, type AboutContent } from "@/features/page-content/company-defaults";

/** Icons cycle through the milestones in order. */
const ICONS = [Footprints, Compass, Flag];

/**
 * "Our History": three real milestones from the company's own story, drawn as
 * alternating photo-and-text rows along a dashed trail in the logo colours.
 * The dates and copy are the same as before (see the About Us page's earlier
 * notes on the 1992 / 2008 / 2010 timeline); only the layout and photos changed.
 */
export function HistorySection({ content = ABOUT_DEFAULTS.history }: { content?: AboutContent["history"] } = {}) {
  return (
    <section className="bg-[#e6f3fa] px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto w-full max-w-[1100px]">
        <h2 data-reveal="up" className="text-center font-playfair-display text-[clamp(34px,5vw,48px)] leading-[1.15] font-bold text-logo-navy-dark">
          {content.title} <span className="text-logo-sun italic">{content.titleAccent}</span>
        </h2>

        <ol className="relative mt-14 flex flex-col gap-14 min-[900px]:gap-20">
          <span
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-1/2 hidden w-px -translate-x-1/2 border-l-2 border-dashed border-logo-navy/30 min-[900px]:block"
          />
          {content.milestones.map((milestone, index) => {
            const Icon = ICONS[index % ICONS.length];
            const reversed = index % 2 === 1;
            return (
              <li key={`${milestone.year}-${index}`} className="relative grid items-center gap-6 min-[900px]:grid-cols-2 min-[900px]:gap-20">
                <span
                  aria-hidden="true"
                  data-reveal="zoom"
                  className="absolute top-1/2 left-1/2 z-10 hidden size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-logo-sun text-logo-navy-dark shadow-[0_0_0_6px_#e6f3fa] min-[900px]:grid"
                >
                  <Icon className="size-5" />
                </span>

                <div data-reveal={reversed ? "right" : "left"} className={`relative aspect-[16/10] overflow-hidden rounded-[14px] shadow-[0_10px_30px_rgba(6,74,112,0.2)] ${reversed ? "min-[900px]:order-2" : ""}`}>
                  <FillImage src={milestone.image} alt={milestone.imageAlt} className="absolute inset-0 size-full object-cover" sizes="(min-width:900px) 520px, 100vw" />
                </div>

                <div data-reveal={reversed ? "left" : "right"} className={`rounded-[14px] bg-white p-7 shadow-[0_6px_24px_rgba(6,74,112,0.12)] ${reversed ? "min-[900px]:order-1" : ""}`}>
                  <p className="inline-block rounded-pill bg-logo-sun px-4 py-1 text-[13px] font-bold text-logo-navy-dark">{milestone.year}</p>
                  <h3 className="mt-4 font-playfair-display text-[26px] leading-tight font-bold text-logo-navy-dark">{milestone.title}</h3>
                  <CmsProse html={milestone.body} className="mt-3 !text-[16px] !leading-[1.8] !text-brand-neutral-800 [&>*+*]:!mt-3" />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
