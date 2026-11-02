import Link from "next/link";
import { Backpack } from "lucide-react";
import { headerCta } from "@/config/navigation";

/**
 * "Ready for the Himalaya Holidays?" — a pill-shaped yellow banner that
 * straddles a pale band above and the footer's deep blue below (the
 * background is split 50/50 at the banner's vertical centre, so the footer
 * reads as it rising out of the page). Shared by the homepage and every
 * inner page that ends with it.
 *
 * The `data-reveal` attributes drive the homepage's scroll animation
 * (`<Reveal variant="auto">`); they're inert elsewhere.
 */
export function CtaSection() {
  return (
    <section className="bg-[linear-gradient(to_bottom,var(--color-site-bg)_50%,var(--color-logo-navy-dark)_50%)] px-4 pt-6 pb-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 rounded-[36px] bg-logo-sun px-7 py-9 text-center shadow-[0_14px_40px_rgba(6,74,112,0.28)] min-[900px]:flex-row min-[900px]:rounded-[110px] min-[900px]:gap-10 min-[900px]:px-16 min-[900px]:py-10 min-[900px]:text-left">
        <div data-reveal="left" className="flex flex-col items-center gap-6 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:gap-10">
          <Backpack
            aria-hidden="true"
            className="size-16 shrink-0 text-logo-navy-dark min-[900px]:size-24"
            strokeWidth={1.1}
          />
          <div>
            <h2 className="text-[26px] leading-tight font-bold text-logo-navy-dark min-[900px]:text-[32px]">
              Ready for the Himalaya Holidays?
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-logo-navy-dark/90 min-[900px]:text-[18px]">
              Let us know when and where you want to spend your next holiday in Nepal, Bhutan, and Tibet. Locals know
              more than anyone about the destinations. Let&apos;s plan your next travel with Joyful Trekking Pvt. Ltd.
            </p>
          </div>
        </div>
        <Link
          data-reveal="right"
          data-magnetic
          href={headerCta.href}
          className="inline-flex h-14 shrink-0 items-center justify-center whitespace-nowrap rounded-pill bg-brand-neutral-000 px-9 text-[18px] font-medium text-logo-navy-dark transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy-dark"
        >
          Plan Your Trip Now
        </Link>
      </div>
    </section>
  );
}
