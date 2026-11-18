import { Mountain } from "lucide-react";
import { CmsProse } from "@/components/ui/CmsProse";
import { FillImage } from "@/components/ui/FillImage";
import { ABOUT_DEFAULTS, type AboutContent } from "@/features/page-content/company-defaults";

/** The first photo spans both columns; the others are portrait. */
const COLLAGE_CLASSES = ["col-span-2 aspect-[16/10]", "aspect-[4/5]", "aspect-[4/5]"];

/**
 * "About Us" intro: story text beside a photo collage, a stats band in the
 * logo colours, and a photo strip. The copy is the same real company copy
 * the page has always carried; only the layout and the photos are new.
 */
export function AboutUsIntroSection({ content = ABOUT_DEFAULTS.story }: { content?: AboutContent["story"] } = {}) {
  return (
    <section className="bg-brand-neutral-000">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-6 py-16 min-[1000px]:grid-cols-2 min-[1000px]:gap-14 min-[1000px]:py-20 md:px-10">
        <div data-reveal="left">
          <p className="inline-flex items-center gap-2 rounded-pill border border-logo-sun/50 bg-logo-sun/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-logo-navy uppercase">
            <Mountain aria-hidden="true" className="size-3.5" />
            {content.label}
          </p>
          <h2 className="mt-5 font-playfair-display text-[clamp(34px,5vw,52px)] leading-[1.1] font-bold text-logo-navy-dark">
            {content.heading} <span className="text-logo-sun italic">{content.headingAccent}</span>
          </h2>
          <CmsProse html={content.body} className="mt-6 !text-[17px] !leading-[1.85] !text-brand-neutral-800" />
        </div>

        <div data-reveal="right" className="grid grid-cols-2 gap-4">
          {content.collage.map((photo, index) => (
            <div key={`${photo.image}-${index}`} className={`relative overflow-hidden rounded-[14px] shadow-[0_10px_30px_rgba(6,74,112,0.18)] ${COLLAGE_CLASSES[index] ?? "aspect-[4/5]"}`}>
              <FillImage src={photo.image} alt={photo.imageAlt} className="absolute inset-0 size-full object-cover" sizes="(min-width:1000px) 560px, 100vw" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-logo-navy-dark">
        <dl className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-10 text-center text-white sm:grid-cols-3 md:px-10">
          {content.stats.map((stat) => (
            <div key={stat.label} data-reveal="up">
              <dt className="font-playfair-display text-[48px] leading-none font-bold text-logo-sun">{stat.value}</dt>
              <dd className="mt-2 text-[15px] text-white/85">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex gap-3 overflow-x-auto px-3 py-3 sm:px-0 sm:py-0">
        {content.strip.map((photo, index) => (
          <div key={`${photo.image}-${index}`} data-reveal="zoom" className="relative aspect-[3/4] min-w-[44%] flex-1 overflow-hidden sm:min-w-0 sm:rounded-none">
            <FillImage src={photo.image} alt={photo.imageAlt} className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 20vw, 50vw" />
          </div>
        ))}
      </div>
    </section>
  );
}
