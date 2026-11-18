import Link from "next/link";
import { ArrowRight, Mountain, Plus } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";

import { HOME_DEFAULTS, type ExploreNepalContent } from "@/features/page-content/home-defaults";

/**
 * "Explore Nepal with …" — intro copy with a Know More button and a
 * "Why Choose Us?" accordion card, over a dimmed background photo. The accordion is native `<details name="why-choose-us">`
 * (exclusive: opening one closes the others) so this stays a Server
 * Component with no client JS.
 */
export function ExploreNepalSection({ content = HOME_DEFAULTS.exploreNepal }: { content?: ExploreNepalContent }) {
  return (
    <section className="relative overflow-hidden bg-[#e6f3fa] px-4 pt-12 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <Scenery image={content.backgroundImage} />

      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-8 min-[1120px]:grid-cols-[minmax(0,1fr)_390px] min-[1120px]:gap-16">
        <div data-reveal="left" className="max-w-[720px]">
          <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy-dark">
            <Mountain aria-hidden="true" className="size-4" />
            {content.eyebrow}
          </p>
          <h2 className="font-display text-[clamp(24px,5vw,34px)] leading-tight font-bold text-brand-neutral-1000">
            {content.title}
          </h2>

          <div
            className="mt-5 space-y-4 text-[13px] leading-relaxed text-brand-neutral-800 [&_strong]:text-logo-navy-dark"
            dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
          />

          <Link
            href={content.buttonHref}
            data-magnetic
            className="mt-6 inline-flex items-center gap-2 rounded-pill bg-logo-sun px-5 py-2.5 text-[13px] font-bold text-logo-navy-dark transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
          >
            {content.buttonLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div data-reveal="up" className="w-full max-w-[390px] justify-self-start rounded-[6px] min-[1120px]:justify-self-end bg-brand-neutral-000 px-6 py-6 shadow-[0_6px_24px_rgba(6,74,112,0.15)]">
          <h3 className="text-[22px] font-bold text-brand-neutral-900">{content.whyTitle}</h3>
          <div className="mt-4 border-t border-brand-neutral-300">
            {content.whyItems.map((item) => (
              <details key={item.title} name="why-choose-us" className="group border-b border-brand-neutral-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[14px] font-medium text-brand-neutral-900 marker:hidden focus-visible:outline-2 focus-visible:outline-logo-navy [&::-webkit-details-marker]:hidden">
                  {item.title}
                  <Plus
                    aria-hidden="true"
                    className="size-4 shrink-0 text-brand-neutral-800 transition-transform group-open:rotate-45"
                  />
                </summary>
                <p className="pb-3 text-[13px] leading-relaxed text-brand-neutral-800">{item.body}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Dimmed photo behind the section, washed toward the pale-sky tint so the text stays readable. */
function Scenery({ image }: { image: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <FillImage
        src={image}
        alt=""
        aria-hidden="true"
        className="object-cover opacity-30"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[#e6f3fa]/55" />
    </div>
  );
}
