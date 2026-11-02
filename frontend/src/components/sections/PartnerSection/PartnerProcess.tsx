import { partnerProcess } from "@/config/partner-content";

/**
 * "How It Works" — four numbered steps on the dark primary-1000 band.
 * The big background numerals are decorative (`aria-hidden`); the steps
 * are an ordered list so the sequence is announced.
 *
 * Server Component.
 */
export function PartnerProcess() {
  const { label, heading, body, steps } = partnerProcess;

  return (
    <section className="bg-primary-1000 py-16 text-brand-neutral-000 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
          <span className="text-body-m font-bold tracking-widest text-primary-400 uppercase">
            {label}
          </span>
          <h2 className="mt-4 mb-6 text-[32px] leading-tight font-bold text-brand-neutral-000 sm:text-[40px] lg:text-raleway-5xl">
            {heading}
          </h2>
          <p className="text-body-l text-primary-200">{body}</p>
        </div>

        <ol className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <li key={step.heading} className="relative pt-14">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 text-[72px] leading-none font-black text-brand-neutral-000/10"
              >
                {index + 1}
              </span>
              <h3 className="relative z-10 mb-3 text-heading-2xl font-bold text-brand-neutral-000">
                {step.heading}
              </h3>
              <p className="relative z-10 text-body-m text-primary-100">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
