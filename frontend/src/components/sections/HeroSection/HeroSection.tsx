import Link from "next/link";
import { Tag } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";
import { getCategoryPackageCount } from "@/features/trips/api/get-category-by-slug";
import { HeroSearchButton } from "./HeroSearchButton";
import { HeroVideo } from "./HeroVideo";

/**
 * Homepage hero. Server Component. Layout follows the reference site:
 * a navy "night" band with a starfield, a rounded video frame with the
 * search pill straddling its top edge, a snow-line at the bottom, and a
 * row of category cards straddling the frame's bottom edge. Colors come
 * from the logo emblem (see `--color-logo-*` in theme.css).
 *
 * Background video: `HeroVideo` plays `public/videos/hero-1..3.mp4` in
 * sequence, muted, `preload="metadata"` — that attribute is load-bearing,
 * see tests/e2e/homepage.spec.ts (`page.goto` waits for `load`). The
 * poster doubles as the `prefers-reduced-motion` static fallback.
 *
 * The H1 is visually hidden (the design shows only the video) but kept
 * for SEO and screen readers.
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

const STARS =
  "radial-gradient(1.5px 1.5px at 4% 22%,#fff 99%,transparent),radial-gradient(1.5px 1.5px at 96% 38%,#fff 99%,transparent),radial-gradient(2px 2px at 2% 62%,#fff 99%,transparent),radial-gradient(1.5px 1.5px at 97% 70%,#fff 99%,transparent),radial-gradient(1px 1px at 8% 80%,#fff 99%,transparent),radial-gradient(1px 1px at 92% 18%,#fff 99%,transparent),radial-gradient(1.5px 1.5px at 15% 40%,#cfe9ff 99%,transparent)";

export async function HeroSection() {
  // Real package counts where a category slug exists; others keep their
  // short subtitle. Failures resolve to null, so the hero never errors.
  const counts = await Promise.all(
    CATEGORIES.map((c) => ("countSlug" in c && c.countSlug ? getCategoryPackageCount(c.countSlug) : null)),
  );
  return (
    <section className="relative w-full bg-site-bg">
      {/* Navy band — extends behind the frame, ending at the snow-line. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 bottom-[150px] bg-logo-navy-dark md:bottom-[140px]"
        style={{ backgroundImage: STARS }}
      >
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -bottom-px h-8 w-full fill-site-bg md:h-10"
        >
          <path d="M0 40V26c40-8 70-18 120-12 50 6 70 16 130 10 60-6 80-18 150-12 70 6 90 14 160 8 70-6 90-16 160-10 70 6 100 16 170 10 70-6 90-16 160-10 60 6 90 14 140 8 50-6 80-14 150-8V40z" />
        </svg>
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-4 pt-[calc(var(--site-header-h,72px)+60px)] min-[768px]:px-10 min-[1120px]:px-[72px] min-[1120px]:pt-[calc(var(--site-header-h,96px)+64px)]">
        <h1 className="sr-only">Nepal&apos;s Local Trekking Agency</h1>

        {/* Video frame, search pill straddling its top edge. */}
        <div className="relative">
          <div data-hero="pill" className="absolute inset-x-0 top-0 z-10 mx-auto w-full max-w-[966px] -translate-y-1/2 px-2 md:px-0">
            <HeroSearchButton />
          </div>
          <div data-hero="frame" className="relative h-[420px] overflow-hidden rounded-[6px] bg-logo-navy-dark min-[1120px]:h-[calc(100dvh-330px)] min-[1120px]:min-h-[440px]">
            <div suppressHydrationWarning data-parallax="5" className="absolute inset-x-0 -top-[8%] -bottom-[8%]">
              <HeroVideo />
            {/* Static fallback for prefers-reduced-motion. */}
            <FillImage
              src="/images/hero/hero-poster.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 hidden size-full object-cover motion-reduce:block"
              sizes="100vw"
            />
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-logo-navy-dark/50 via-transparent to-logo-navy-dark/25"
            />
          </div>

          {/* Category cards straddling the frame's bottom edge. */}
          <ul className="relative z-10 mx-auto -mt-16 flex max-w-[1180px] gap-3 overflow-x-auto px-1 pb-6 [scrollbar-width:none] min-[768px]:-mt-24 min-[768px]:justify-center min-[1120px]:-mt-[100px] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map(({ label, sub, href, image, Icon }, index) => (
              <li key={label} data-hero="card" className="shrink-0">
                <Link
                  href={href}
                  className="group flex h-[150px] w-[150px] flex-col justify-between rounded-[6px] bg-brand-neutral-000 p-4 shadow-[0_6px_20px_rgba(6,74,112,0.18)] transition-[transform,background-color] duration-200 hover:-translate-y-1 hover:bg-logo-sun focus-visible:-translate-y-1 focus-visible:bg-logo-sun focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy md:h-[193px] md:w-[177px]"
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
                    <span className="mt-1 block text-body-s text-brand-neutral-800 transition-colors group-hover:text-logo-navy-dark group-focus-visible:text-logo-navy-dark">{counts[index] ? `${counts[index]} Packages` : sub}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
