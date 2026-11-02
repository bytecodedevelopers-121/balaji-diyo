/**
 * "We're Associated With" — the trade-body / government logos strip
 * (`public/images/associate/associate.png`, a transparent PNG: Nepal
 * Government, NMA, NTB, TAAN, KEEP), on a pale panel. Add
 * hiker illustrations either side once the artwork is available.
 */
export function AssociatedWithSection() {
  return (
    <section className="bg-site-bg px-4 pt-6 pb-4 text-center min-[768px]:px-10">
      <h2 suppressHydrationWarning className="reveal text-[24px] font-bold tracking-wide min-[768px]:text-[30px] text-brand-neutral-900 uppercase">
        We&apos;re Associated With
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element -- small static logo strip */}
      <img
        src="/images/associate/associate.png"
        alt="Nepal Government, Nepal Mountaineering Association, Nepal Tourism Board, TAAN and KEEP"
        width={250}
        height={50}
        loading="lazy"
        className="mx-auto mt-4 h-auto w-[340px] max-w-full min-[768px]:w-[520px]"
      />
    </section>
  );
}
