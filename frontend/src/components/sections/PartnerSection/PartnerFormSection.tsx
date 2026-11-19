import { partnerFormIntro, type PartnerFormId } from "@/config/partner-content";
import { PartnerInquiryForm } from "./PartnerInquiryForm";

function TrustIcon({ icon }: { icon: "48h" | "lock" | "globe" }) {
  if (icon === "48h") {
    return <span className="font-bold text-primary-600">48h</span>;
  }

  const path =
    icon === "lock"
      ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      : "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z";

  return (
    <svg
      className="size-6 text-primary-600"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

/**
 * Bottom "Start the Conversation" block: intro copy + trust signals on the
 * left, the tabbed inquiry form (client component) on the right. The
 * section id is the target of the hero's "Apply to Partner" anchor.
 *
 * Server Component — only `PartnerInquiryForm` is interactive.
 */
export function PartnerFormSection({ visibleFormIds }: { visibleFormIds?: readonly PartnerFormId[] }) {
  const { label, heading, body, trustSignals } = partnerFormIntro;

  return (
    <section id="partner-form" className="scroll-mt-24 bg-brand-neutral-100 py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-start gap-12 px-6 lg:grid-cols-5 lg:gap-16">
        <div className="lg:col-span-2">
          <span className="text-body-m font-bold tracking-widest text-primary-600 uppercase">
            {label}
          </span>
          <h2 className="mt-4 mb-6 text-[32px] leading-tight font-bold text-brand-neutral-900 sm:text-[40px] lg:text-raleway-5xl">
            {heading}
          </h2>
          <p className="mb-10 text-body-l text-brand-neutral-800 lg:mb-12">{body}</p>

          <ul className="space-y-8">
            {trustSignals.map((signal) => (
              <li key={signal.heading} className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-button-circle bg-primary-100">
                  <TrustIcon icon={signal.icon} />
                </div>
                <div>
                  <h3 className="text-body-l font-bold text-brand-neutral-900">
                    {signal.heading}
                  </h3>
                  <p className="mt-1 text-body-m text-brand-neutral-800">{signal.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-card border border-secondary-500/40 bg-brand-neutral-000 p-5 shadow-card-strong sm:p-8 lg:col-span-3">
          <PartnerInquiryForm visibleFormIds={visibleFormIds} />
        </div>
      </div>
    </section>
  );
}
