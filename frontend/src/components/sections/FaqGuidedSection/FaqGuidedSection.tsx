import Link from "next/link";
import { ArrowRight, CircleCheck, Mountain, Plus } from "lucide-react";

/**
 * Blue band with two columns: a white "Travel Queries" FAQ card (native
 * exclusive `<details>` accordion, no client JS) and the "Why Guided
 * Travel?" points. DUMMY COPY — replace `FAQS` / `POINTS` with real text.
 */
const FAQS = [
  {
    q: "What is Joyful Trekking Pvt. Ltd.?",
    a: "Joyful Trekking Pvt. Ltd. is a Kathmandu-based trekking, tour and travel company offering treks, peak climbs, tours and safaris across Nepal, Bhutan and Tibet.",
  },
  {
    q: "Where is Joyful Trekking Pvt. Ltd. located?",
    a: "Our main office is in Kathmandu, Nepal. See the contact page for the full address and map.",
  },
  {
    q: "What is the best time to travel to Nepal?",
    a: "Spring (March to May) and autumn (September to November) offer the clearest views and the most stable weather for trekking.",
  },
  {
    q: "How to get a Nepal tourist visa?",
    a: "Most nationalities can get a visa on arrival at Kathmandu airport or apply online in advance. We can guide you through the steps.",
  },
];

const POINTS = [
  {
    title: "Know the destinations",
    body: "We provide local expert guides on our trekking and tour holidays who interpret the destination, people, culture, lifestyle, history, geography and much more. No one can interpret the destination better than the locals.",
  },
  {
    title: "Peace of mind",
    body: "We arrange all the related travel services for your holidays from arrival to departure, including airport transfer, hotel booking, transport, domestic flights, guides, tours, porters, permits and entrance fees. You enjoy your holiday with peace of mind.",
  },
  {
    title: "Travel safety",
    body: "Adventure trekking holidays involve traveling into the high Himalayas, and it is risky to travel alone without a guide. You are safe when you are on our guided holidays.",
  },
  {
    title: "Support local economy",
    body: "Nepal has been facing unemployment problems, and tourism is a fast-growing industry that can offer job opportunities to many locals, including porters, guides, drivers and organizers. Taking guided holidays means you support the local economy.",
  },
];

export function FaqGuidedSection() {
  return (
    <section className="bg-logo-navy px-4 py-12 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-8">
        <div data-reveal="left" className="rounded-[4px] bg-brand-neutral-000 px-6 py-6 shadow-[0_6px_24px_rgba(6,74,112,0.25)]">
          <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy">
            <Mountain aria-hidden="true" className="size-4" />
            Top FAQs
          </p>
          <h2 className="font-display text-[clamp(22px,4vw,28px)] leading-tight font-bold text-brand-neutral-1000">
            Joyful Travel Queries
          </h2>
          <div className="mt-4 border-t border-brand-neutral-300">
            {FAQS.map((faq) => (
              <details key={faq.q} name="faq" className="group border-b border-brand-neutral-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[13px] font-medium text-brand-neutral-900 marker:hidden focus-visible:outline-2 focus-visible:outline-logo-navy [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="grid size-5 shrink-0 place-items-center rounded-[3px] bg-logo-sun text-logo-navy-dark">
                    <Plus aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-45" strokeWidth={3} />
                  </span>
                </summary>
                <p className="pb-3 text-[13px] leading-relaxed text-brand-neutral-800">{faq.a}</p>
              </details>
            ))}
          </div>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center gap-2 rounded-pill border border-logo-sun px-4 py-1.5 text-[12px] font-semibold text-logo-navy transition-colors hover:bg-logo-sun"
          >
            More FAQs
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div data-reveal="right" className="text-brand-neutral-000">
          <p className="mb-1 flex items-center gap-2 text-body-s font-medium">
            <Mountain aria-hidden="true" className="size-4" />
            Explore with Locals
          </p>
          <h2 className="font-display text-[clamp(22px,4vw,28px)] leading-tight font-bold">Why Guided Travel?</h2>
          <ul className="mt-5 grid gap-x-6 gap-y-6 sm:grid-cols-2">
            {POINTS.map((point) => (
              <li key={point.title}>
                <p className="flex items-center gap-2 text-[12px] font-bold tracking-wide uppercase">
                  <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
                  {point.title}
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-brand-neutral-100">{point.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
