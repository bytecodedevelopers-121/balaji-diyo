import Link from "next/link";
import { Tag } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";
import type { HeroContent } from "@/features/page-content/home-defaults";
import { HOME_DEFAULTS } from "@/features/page-content/home-defaults";
import { getCategoryPackageCount } from "@/features/trips/api/get-category-by-slug";
import { HeroHeadline } from "./HeroHeadline";
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
export async function HeroSection({ content = HOME_DEFAULTS.hero }: { content?: HeroContent } = {}) {
  const CATEGORIES = content.categories;
  const videos = content.videos.map((video) => video.src).filter(Boolean);
  const PLACES = content.places.map((p) => p.name);
  // Real package counts where a category slug exists; others keep their
  // short subtitle. Failures resolve to null, so the hero never errors.
  const counts = await Promise.all(
    CATEGORIES.map((c) => (c.countSlug ? getCategoryPackageCount(c.countSlug) : null)),
  );
  return (
    <section id="home-hero" className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#064a70] text-white">
      {/* Background video (poster image for reduced motion) under a navy fade. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#064a70]">
        <HeroVideo videos={videos} poster={content.poster} />
        <FillImage
          src={content.poster}
          alt=""
          aria-hidden="true"
          className={videos.length > 0 ? "hidden object-cover motion-reduce:block" : "object-cover"}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#064a70]/55 via-[#064a70]/35 to-[#064a70]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center px-4 pt-[calc(var(--site-header-h,72px)+72px)] text-center min-[768px]:px-10 min-[1120px]:px-[72px] min-[1120px]:pt-[calc(var(--site-header-h,96px)+80px)]">
        <p className="inline-flex items-center gap-2 rounded-pill border border-white/25 bg-white/5 px-5 py-2 text-[11px] font-bold tracking-[0.16em] uppercase">
          <span aria-hidden="true" className="text-logo-sun">
            ✦
          </span>
          {content.badge}
        </p>

        <HeroHeadline lineOne={content.headlineLine1} lineTwo={content.headlineLine2} prefix={content.headlinePrefix} />

        <p className="mt-8 max-w-[560px] text-[15px] leading-[1.85] text-white/90 min-[768px]:text-[16px]">
          {content.description}
        </p>

        <div data-hero="pill" className="mt-9 w-full max-w-[600px]">
          <HeroSearchButton />
        </div>

        <ul className="mt-16 flex w-full max-w-[1180px] gap-3 overflow-x-auto px-1 pb-6 [scrollbar-width:none] min-[768px]:justify-center [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(({ label, sub, href, image }, index) => (
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
                ) : (
                  <Tag
                    aria-hidden="true"
                    className="size-9 text-logo-navy transition-colors group-hover:text-logo-green md:size-12"
                    strokeWidth={1.25}
                  />
                )}
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
