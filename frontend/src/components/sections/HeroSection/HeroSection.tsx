import Link from "next/link";
import { Tag } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";
import { getCategoryPackageCount } from "@/features/trips/api/get-category-by-slug";
import { HeroSearchButton } from "./HeroSearchButton";
import { HeroVideo } from "./HeroVideo";

/**
 * Homepage hero. Server Component. A looping mountain video under a deep-indigo
 * fade, a centred headline, the "Find an Adventure" search
 * pill, a row of glass category cards, and a slow marquee of destinations
 * along the bottom edge.
 *
 * The H1 reads "Live the Nepal you've only dreamed of." with a visually
 * hidden prefix so screen readers and search engines still get
 * "Nepal's Local Trekking Agency".
 */
const CATEGORIES = [
  { label: "Trekking and Hiking", sub: "Himalayan treks", href: "/trekking-routes-in-nepal", image: "/images/nav/trekking-and-hiking.jpg" },
  { label: "Climbing and Expedition", sub: "Summit expeditions", countSlug: "nepal-peak-climbing", href: "/nepal-peak-climbing", image: "/images/nav/climbing-and-expedition.jpg" },
  // No dedicated jungle-safari / day-tour pages exist yet — both point at
  // the general tour packages listing.
  { label: "Jungle and Wildlife Safari", sub: "Chitwan and Bardia", href: "/nepal-tour-packages", image: "/images/nav/jungle-safari.jpg" },
  { label: "Nepal Tours and Holidays", sub: "Culture and sightseeing", countSlug: "nepal-tour-packages", href: "/nepal-tour-packages", image: "/images/nav/nepal-tours.webp" },
  { label: "Day Tours and Activities", sub: "Short getaways", href: "/nepal-tour-packages", image: "/images/nav/day-tours.webp" },
  { label: "Deals and Discounts", sub: "Last minute offers", href: "/last-minute-trip-deals", Icon: Tag },
];

const PLACES = [
  "Everest Base Camp",
  "Annapurna Circuit",
  "Poon Hill",
  "Chitwan",
  "Lumbini",
  "Upper Mustang",
  "Nagarkot",
  "Langtang",
  "Phewa",
  "Pokhara",
];

export async function HeroSection() {
  // Real package counts where a category slug exists; others keep their
  // short subtitle. Failures resolve to null, so the hero never errors.
  const counts = await Promise.all(
    CATEGORIES.map((c) => ("countSlug" in c && c.countSlug ? getCategoryPackageCount(c.countSlug) : null)),
  );
  return (
    <section id="home-hero" className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#064a70] text-white">
      {/* Background video (poster image for reduced motion) under a navy fade. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#064a70]">
        <HeroVideo />
        <FillImage
          src="/images/hero/hero-poster.jpg"
          alt=""
          aria-hidden="true"
          className="hidden object-cover motion-reduce:block"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#064a70]/55 via-[#064a70]/35 to-[#064a70]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center px-4 pt-[calc(var(--site-header-h,72px)+72px)] text-center min-[768px]:px-10 min-[1120px]:px-[72px] min-[1120px]:pt-[calc(var(--site-header-h,96px)+80px)]">
        <p className="inline-flex items-center gap-2 rounded-pill border border-white/25 bg-white/5 px-5 py-2 text-[11px] font-bold tracking-[0.16em] uppercase">
          <span aria-hidden="true" className="text-logo-sun">
            ✦
          </span>
          Namaste &amp; welcome to Nepal
        </p>

        <h1 className="font-playfair-display mt-8 text-[clamp(44px,8.5vw,92px)] leading-[1.08] font-bold">
          <span className="sr-only">Nepal&apos;s Local Trekking Agency — </span>
          Live the Nepal
          <span className="block text-logo-sun italic">you&rsquo;ve only dreamed of.</span>
        </h1>

        <p className="mt-8 max-w-[560px] text-[15px] leading-[1.85] text-white/90 min-[768px]:text-[16px]">
          Created for travellers who don&rsquo;t just visit the Himalayas, they feel them. Prayer flags at 5,000 m,
          rhinos at dawn, lakes the colour of sky. Guided by born-here locals since 2011.
        </p>

        <div data-hero="pill" className="mt-9 w-full max-w-[600px]">
          <HeroSearchButton />
        </div>

        <ul className="mt-16 flex w-full max-w-[1180px] gap-3 overflow-x-auto px-1 pb-6 [scrollbar-width:none] min-[768px]:justify-center [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(({ label, sub, href, image, Icon }, index) => (
            <li key={label} data-hero="card" className="shrink-0">
              <Link
                href={href}
                className="group flex h-[150px] w-[150px] flex-col justify-between rounded-[6px] bg-brand-neutral-000 p-4 text-left shadow-[0_6px_20px_rgba(6,74,112,0.18)] transition-[transform,background-color] duration-200 hover:-translate-y-1 hover:bg-logo-sun focus-visible:-translate-y-1 focus-visible:bg-logo-sun focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy md:h-[193px] md:w-[177px]"
              >
                {image ? (
                  <span className="relative block h-[64px] w-full md:h-[76px]">
                    <FillImage
                      src={image}
                      alt=""
                      aria-hidden="true"
                      className="object-contain object-left mix-blend-multiply"
                      sizes="176px"
                    />
                  </span>
                ) : Icon ? (
                  <Icon
                    aria-hidden="true"
                    className="size-9 text-logo-navy transition-colors group-hover:text-logo-green md:size-12"
                    strokeWidth={1.25}
                  />
                ) : null}
                <span>
                  <span className="block text-body-m leading-snug font-semibold text-brand-neutral-800 transition-colors group-hover:text-logo-navy-dark group-focus-visible:text-logo-navy-dark md:text-[17px]">
                    {label}
                  </span>
                  <span className="mt-1 block text-body-s text-brand-neutral-800 transition-colors group-hover:text-logo-navy-dark group-focus-visible:text-logo-navy-dark">
                    {counts[index] ? `${counts[index]} Packages` : sub}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Destination marquee. */}
      <div aria-hidden="true" className="relative overflow-hidden border-t border-white/10 py-5">
        <div className="hero-marquee flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {PLACES.map((place) => (
                <span key={place} className="flex items-center text-[12px] font-bold tracking-[0.2em] whitespace-nowrap uppercase">
                  <span className="px-8">{place}</span>
                  <span className="text-logo-sun">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
