/**
 * "Origins" — company introduction, transcribed from
 * design-references/homepage.png (y≈2400–3100 at 1440px). Light blue
 * background (#F5FCFE, sampled directly off the screenshot — matches
 * --color-primary-100 exactly), centered heading + two body paragraphs
 * + a "Know More" link.
 *
 * The reference's decorative illustrated mountain-range pattern behind
 * this text is a real exported asset (origins-mountains.svg, supplied
 * 2026-08-25 — not recreated from the screenshot crop, same "real
 * asset, not a guess" precedent as the footer's own background art:
 * `Footer.tsx`'s `footer-landscape.svg`/`footer-hiker.svg`), layered as
 * an absolutely-positioned, non-interactive `<img>` behind the text —
 * `object-fill` (stretch, no crop) since the section's height is
 * content-driven (`py-[50px]`) rather than fixed like the footer's.
 *
 * `py-[50px]` (2026-09-03, direct request: tighten + unify the gap
 * between homepage/package-detail sections, then a follow-up "reduce
 * 5,6px more" on top of that first pass) — was `py-20` originally, the
 * one outlier against every sibling homepage section's `py-16`; landed
 * on `py-14` (56px) in the first pass, then this second pass dropped
 * every section in this set another 6px — off the 4px Tailwind scale
 * (`py-13` is only -4px, `py-12` is -8px, neither hits the requested
 * range) so an arbitrary value here, same as every sibling homepage
 * section now shares — see those files' own matching comment.
 */
export function AboutSection() {
  return (
    <section className="relative isolate overflow-hidden bg-primary-100 py-[2px] sm:py-[25px]">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative full-bleed SVG background, not a Next/Image content image */}
      <img
        src="/images/about/origins-mountains.svg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-0 -z-10 size-full object-fill opacity-40"
      />
      <div className="relative mx-auto flex w-full max-w-[1012px] flex-col items-center gap-[44px] px-6 text-center md:px-16">
        <h2 className="font-display text-raleway-4xl font-medium text-brand-neutral-1000 sm:text-display-section">
          25 Years Guiding Travelers Through the Himalayas
        </h2>
        <p className="text-justify text-heading-xl text-brand-neutral-800">
          Joyful Trekking Pvt. Ltd. started in Nepal and never left. For over 25
          years we&apos;ve been guiding travelers through the Himalayas,
          not from a desk somewhere else, but from here, with local guides
          who know these trails, valleys, passes, and villages by heart.
          Whether you want to go on a trek to Everest Base Camp, a
          thrilling tiger safari in Bardiya, a Kathmandu visit, a Bhutan
          tour, a pilgrimage to Mount Kailash, or something further off
          the map, we build the trip around you instead of handing you a
          fixed itinerary.
        </p>
        <p className="text-justify text-heading-xl text-brand-neutral-800">
          This local knowledge, combined with our love for nature, is why
          we take sustainability seriously. We work with the same tea
          houses, porters, and communities year after year. This keeps
          the trails and villages we love intact for the next traveler
          and for the people who live here. It&apos;s a smaller, more
          careful way to run a trekking company, and it&apos;s also why
          many travelers come back to us and bring their friends along.
        </p>
        <a
          href="/company/about-us"
          className="flex items-center gap-2 text-body-l font-medium text-primary-500 hover:opacity-80"
        >
          Know More
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
