/**
 * "We're Associated With" — the trade-body / government logos strip: Nepal
 * Government, Nepal Mountaineering Association, Nepal Tourism Board, TAAN and
 * KEEP, each its own SVG from `public/images/associate`.
 */
const PARTNERS = [
  { name: "Nepal Government", src: "/images/associate/nepal-goverment-logo.svg" },
  { name: "Nepal Mountaineering Association", src: "/images/associate/nma-logo.svg" },
  { name: "Nepal Tourism Board", src: "/images/associate/ntb-logo.svg" },
  { name: "Trekking Agencies' Association of Nepal (TAAN)", src: "/images/associate/taan-logo.svg" },
  { name: "Kathmandu Environmental Education Project (KEEP)", src: "/images/associate/keep-logo.svg" },
];

export function AssociatedWithSection() {
  return (
    <section className="bg-site-bg px-4 pt-6 pb-4 text-center min-[768px]:px-10">
      <h2 suppressHydrationWarning className="reveal text-[24px] font-bold tracking-wide min-[768px]:text-[30px] text-brand-neutral-900 uppercase">
        We&apos;re Associated With
      </h2>
      <ul className="mx-auto mt-6 flex max-w-[1100px] flex-wrap items-center justify-center gap-x-10 gap-y-6 min-[768px]:gap-x-14">
        {PARTNERS.map((partner) => (
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
