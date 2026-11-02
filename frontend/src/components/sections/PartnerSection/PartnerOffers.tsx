import { partnerOffers } from "@/config/partner-content";

/**
 * "What's On The Table" — the four concrete offers. The section id is the
 * target of the hero's "See what's on offer" anchor.
 *
 * Server Component.
 */
export function PartnerOffers() {
  const { label, heading, body, items } = partnerOffers;

  return (
    <section id="whats-on-offer" className="scroll-mt-24 bg-brand-neutral-100 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-3xl lg:mb-16">
          <span className="text-body-m font-bold tracking-widest text-primary-600 uppercase">
            {label}
          </span>
          <h2 className="mt-4 mb-6 text-[32px] leading-tight font-bold text-brand-neutral-900 sm:text-[40px] lg:text-raleway-5xl">
            {heading}
          </h2>
          <p className="text-body-l text-brand-neutral-800">{body}</p>
        </div>

        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {items.map((item) => (
            <div key={item.kicker} className="border-l-[3px] border-primary-500 pl-6">
              <p className="mb-2 text-body-s font-bold tracking-widest text-primary-600 uppercase">
                {item.kicker}
              </p>
              <h3 className="mb-3 text-heading-2xl font-bold text-brand-neutral-900">
                {item.heading}
              </h3>
              <p className="text-body-m text-brand-neutral-800">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
