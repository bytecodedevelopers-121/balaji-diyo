import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import type { CardTrip } from "@/components/ui/PackageCard";
import { getPopularTrips } from "@/features/trips/api/get-trips";
import { HOME_DEFAULTS, type BestSellersContent } from "@/features/page-content/home-defaults";
import { BestSellersCarousel } from "./BestSellersCarousel";

/**
 * "Best Sellers" as a coverflow fan on a dark stage: every best seller is a
 * `PackageCard`; the centre one is sharp and clickable, its neighbours tilt
 * away, blur and fade (see BestSellersCarousel). Fed by the admin's
 * "popular" pool; the section is hidden until there are popular trips.
 */
export async function BestSellersSection({ content = HOME_DEFAULTS.bestSellers }: { content?: BestSellersContent }) {
  const MAX_CARDS = content.maxCards;
  const trips: CardTrip[] = await getPopularTrips(MAX_CARDS).catch(() => []);
  if (trips.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#e6f3fa] px-4 pt-12 pb-12 text-brand-neutral-1000 min-[768px]:px-10 min-[1120px]:px-[72px]">
      {/* Faint dotted "world map" texture behind the stage. */}
      <div
        aria-hidden="true"
       className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(6,74,112,0.3)_1px,transparent_1.4px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div className="relative mx-auto w-full max-w-[1280px]">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy-dark">
              <Mountain aria-hidden="true" className="size-4" />
              {content.eyebrow}
            </p>
            <h2 className="font-display text-[clamp(22px,5vw,32px)] leading-tight font-bold">
              {content.title}
            </h2>
          </div>
          <Link
            href={content.buttonHref}
           className="hidden shrink-0 items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy-dark transition-colors hover:bg-logo-sun sm:inline-flex"
          >
            {content.buttonLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <BestSellersCarousel items={trips.slice(0, MAX_CARDS)} />
      </div>
    </section>
  );
}
