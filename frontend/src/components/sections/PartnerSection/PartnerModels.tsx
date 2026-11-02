import { partnerModels } from "@/config/partner-content";

/**
 * "Who We Work With" — the three partnership-model cards (brand, creator,
 * agency), each with its own bullet accent colour from the config.
 *
 * Server Component.
 */
export function PartnerModels() {
  const { label, heading, body, cards } = partnerModels;

  return (
    <section className="bg-brand-neutral-000 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <span className="text-body-m font-bold tracking-widest text-primary-600 uppercase">
            {label}
          </span>
          <h2 className="mt-4 mb-6 text-[32px] leading-tight font-bold text-brand-neutral-900 sm:text-[40px] lg:text-raleway-5xl">
            {heading}
          </h2>
          <p className="text-body-l text-brand-neutral-800">{body}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.heading}
              className="rounded-card border border-brand-neutral-200 bg-brand-neutral-000 p-8 shadow-card-soft"
            >
              <span className="mb-6 inline-block rounded-chip bg-primary-100 px-3 py-1.5 text-body-s font-bold tracking-wider text-primary-900 uppercase">
                {card.tag}
              </span>
              <h3 className="mb-4 text-heading-2xl font-bold text-brand-neutral-900">
                {card.heading}
              </h3>
              <p className="mb-8 text-body-m text-brand-neutral-800">{card.description}</p>
              <ul className="space-y-4">
                {card.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start text-body-m text-brand-neutral-900"
                  >
                    <span
                      aria-hidden="true"
                      className={`mr-3 shrink-0 text-lg leading-none ${card.bulletClassName}`}
                    >
                      •
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
