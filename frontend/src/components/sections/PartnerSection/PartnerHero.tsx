import { partnerHero } from "@/config/partner-content";

/**
 * Partnership page hero — eyebrow pill, headline, subheadline, two CTAs
 * (both same-page anchors) and the stats strip. Plain neutral background,
 * as in the client's partner.html mockup (no photo, unlike `PageHero`).
 *
 * Server Component — nothing interactive here.
 */
export function PartnerHero() {
  const { eyebrow, headlineLead, headlineAccent, subheadline, primaryCta, secondaryLink, stats } =
    partnerHero;

  return (
    <section className="relative overflow-hidden bg-brand-neutral-100 pt-16 pb-12 lg:pt-24 lg:pb-20">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <span className="mb-6 inline-block rounded-pill border border-primary-200 bg-primary-100 px-4 py-1 text-body-m font-bold tracking-widest text-primary-600 uppercase">
          {eyebrow}
        </span>
        <h1 className="mb-6 text-[36px] leading-tight font-extrabold tracking-tight text-brand-neutral-900 sm:text-[48px] lg:text-raleway-6xl">
          {headlineLead} <br className="hidden sm:block" />
          <span className="text-primary-500">{headlineAccent}</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-body-l leading-relaxed text-brand-neutral-800">
          {subheadline}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <a
            href="#partner-form"
            className="w-full rounded-pill bg-primary-500 px-8 py-4 text-center text-button-l font-bold text-brand-neutral-000 transition-colors duration-200 hover:bg-primary-600 sm:w-auto"
          >
            {primaryCta}
          </a>
          <a
            href="#whats-on-offer"
            className="px-6 py-4 font-bold text-primary-600 transition-colors duration-200 hover:text-primary-900"
          >
            {secondaryLink} &rarr;
          </a>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-5xl px-6 lg:mt-20">
        <dl className="grid grid-cols-1 gap-y-6 border-t border-brand-neutral-300 py-10 sm:grid-cols-3 sm:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col-reverse gap-1 text-center ${index === 1 ? "border-y border-brand-neutral-300 py-6 sm:border-x sm:border-y-0 sm:py-0" : ""}`}
            >
              <dt className="text-body-s font-semibold tracking-widest text-brand-neutral-800 uppercase">
                {stat.label}
              </dt>
              <dd
                className={`text-[36px] font-extrabold sm:text-raleway-5xl ${stat.accent ? "text-secondary-500" : "text-brand-neutral-900"}`}
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
