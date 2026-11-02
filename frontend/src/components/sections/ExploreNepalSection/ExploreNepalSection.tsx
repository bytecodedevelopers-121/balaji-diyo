import Link from "next/link";
import { ArrowRight, Mountain, Plus } from "lucide-react";

/**
 * "Explore Nepal with …" — intro copy with a Know More button and a
 * "Why Choose Us?" accordion card, over a pale-sky mountain scene in the
 * logo's colors. The accordion is native `<details name="why-choose-us">`
 * (exclusive: opening one closes the others) so this stays a Server
 * Component with no client JS.
 *
 * DUMMY COPY — replace the paragraphs and `WHY_ITEMS` with the real text.
 */
const WHY_ITEMS = [
  {
    title: "20+ Years Experienced Team",
    body: "Our guides and trip planners have spent over two decades on the trails and in the villages of Nepal, so every itinerary is built on first-hand knowledge.",
  },
  {
    title: "Registered and Authorized",
    body: "Joyful Trekking Pvt. Ltd. is a government-registered and authorized trekking and travel company, fully licensed to operate in Nepal.",
  },
  {
    title: "Happy Clients and Repeated Customers",
    body: "Travelers from around the world trust us, and many return year after year for their next trek, tour or climb.",
  },
  {
    title: "Use of Local Products",
    body: "We stay in local lodges, eat local food and hire local porters and guides, so your trip supports the communities you walk through.",
  },
];

export function ExploreNepalSection() {
  return (
    <section className="relative overflow-hidden bg-[#e6f3fa] px-4 pt-12 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <Scenery />

      <div className="relative mx-auto w-full max-w-[1280px]">
        <div data-reveal="left" className="max-w-[720px]">
          <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy-dark">
            <Mountain aria-hidden="true" className="size-4" />
            We make your travel dreams come true,
          </p>
          <h2 className="font-display text-[clamp(24px,5vw,34px)] leading-tight font-bold text-brand-neutral-1000">
            Explore Nepal with Joyful Trekking Pvt. Ltd.
          </h2>

          <div className="mt-5 space-y-4 text-[13px] leading-relaxed text-brand-neutral-800">
            <p>
              <strong className="text-logo-navy-dark">Joyful Trekking Pvt. Ltd.</strong>, known simply as{" "}
              <strong className="text-logo-navy-dark">Joyful Trekking</strong>, is an independent, Kathmandu-based
              trekking, tour and travel company with{" "}
              <strong className="text-logo-navy-dark">over 20 years of experience</strong> in Nepal&apos;s tourism and
              hospitality industry. We specialize in trekking, hiking, tours, holidays, jungle safaris and climbing
              adventures across the Nepal Himalayas, and extend our travel services to Bhutan and Tibet.
            </p>
            <p>
              Our best-selling holiday packages include the{" "}
              <strong className="text-logo-navy-dark">
                Everest Base Camp, Annapurna Base Camp, Manaslu Circuit, Langtang Valley, Annapurna Circuit,
                Kathmandu Tour, Pokhara Tour, Spirit of Nepal, Chitwan Safari
              </strong>{" "}
              and the <strong className="text-logo-navy-dark">Nepal Bhutan Tour</strong>.
            </p>
          </div>

          <Link
            href="/about-us"
            data-magnetic
            className="mt-6 inline-flex items-center gap-2 rounded-pill bg-logo-sun px-5 py-2.5 text-[13px] font-bold text-logo-navy-dark transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
          >
            Know More
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div data-reveal="up" className="mt-8 max-w-[390px] rounded-[6px] bg-brand-neutral-000 px-6 py-6 shadow-[0_6px_24px_rgba(6,74,112,0.15)]">
          <h3 className="text-[22px] font-bold text-brand-neutral-900">Why Choose Us?</h3>
          <div className="mt-4 border-t border-brand-neutral-300">
            {WHY_ITEMS.map((item) => (
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

/** Layered mountains, sun and snow-line in the logo's sky / green / sun colors. */
function Scenery() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 800 420"
      preserveAspectRatio="xMaxYMax slice"
      className="pointer-events-none absolute right-0 bottom-0 h-[80%] w-[min(900px,100%)] min-[1120px]:h-[92%]"
    >
      <circle cx="470" cy="150" r="62" fill="#f8c028" opacity="0.55" />
      <path d="M120 420 L330 120 L420 220 L520 70 L760 420Z" fill="#b9dcef" />
      <path d="M520 70 L440 210 L480 190 L520 250 L560 180 L600 220Z" fill="#ffffff" opacity="0.85" />
      <path d="M330 120 L290 185 L330 170 L370 200Z" fill="#ffffff" opacity="0.85" />
      <path d="M0 420 L170 250 L300 340 L420 270 L620 420Z" fill="#8cc9e6" opacity="0.8" />
      <path d="M0 420 L0 360 C120 330 220 380 340 360 C480 335 600 390 800 350 L800 420Z" fill="#38b050" opacity="0.28" />
      <path d="M0 420 L0 392 C140 372 260 408 400 390 C560 370 680 408 800 388 L800 420Z" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}
