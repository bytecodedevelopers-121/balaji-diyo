import { HOME_DEFAULTS, type AssociatedWithContent } from "@/features/page-content/home-defaults";

/**
 * "We're Associated With" — the trade-body / government logos strip: Nepal
 * Government, Nepal Mountaineering Association, Nepal Tourism Board, TAAN and
 * KEEP, each its own SVG from `public/images/associate`.
 */
export function AssociatedWithSection({ content = HOME_DEFAULTS.associatedWith }: { content?: AssociatedWithContent }) {
  return (
    <section className="bg-site-bg px-4 pt-6 pb-4 text-center min-[768px]:px-10">
      <h2 className="text-[24px] font-bold tracking-wide min-[768px]:text-[30px] text-brand-neutral-900 uppercase">
        {content.title}
      </h2>
      <ul className="mx-auto mt-6 flex max-w-[1100px] flex-wrap items-center justify-center gap-x-10 gap-y-6 min-[768px]:gap-x-14">
        {content.partners.map((partner) => (
          <li key={partner.name}>
            {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logos */}
            <img
              src={partner.src}
              alt={partner.name}
              loading="lazy"
             className="h-14 w-auto max-w-[170px] object-contain min-[768px]:h-[72px]"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
