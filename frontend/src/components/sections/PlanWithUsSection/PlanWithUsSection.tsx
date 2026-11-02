import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PlanWithUsWizard } from "./PlanWithUsWizard";
import { FillImage } from "@/components/ui/FillImage";

/**
 * /plan-with-us's hero + wizard card — design-references/
 * "Plan with us - Preferences.png" (+ "Plan With Us Details.png" /
 * "Plan with us - Review.png" for the other two steps, same hero
 * every time). The wizard card overlaps the bottom of the hero photo
 * (a different treatment than PageHero's other callers, none of which
 * float a card over the photo like this) — reproduced with a negative
 * top margin pulling the card up, then a plain white section
 * underneath supplies the rest of the card's height.
 *
 * Hero photo reuses contact/hero.jpg (Ama Dablam at dusk) — no clean
 * export of the design's own prayer-flags/autumn-foliage photo exists
 * in this repo, same "reuse an existing real export" call as every
 * other page built without Figma access to its own design file this
 * session.
 *
 * The lower `<section>` has `pt-px` — not decorative, load-bearing:
 * without *some* non-zero top padding/border there, its own top margin
 * would collapse straight through into the card wrapper's `-mt-*`
 * (plain CSS margin collapsing, since the section otherwise has no
 * top padding/border of its own to stop it), pulling the section's
 * white background up by the same amount as the card and covering the
 * hero photo with flat white instead of leaving it visible behind the
 * card — confirmed by measuring the section's actual rendered
 * `getBoundingClientRect()`, not assumed.
 */
export function PlanWithUsSection() {
  return (
    <>
      <section className="relative isolate flex min-h-[420px] w-full items-center overflow-hidden px-6 pt-16 pb-40 sm:min-h-[520px] md:px-16">
        <FillImage
          src="/images/contact/hero.jpg"
          alt="Prayer flags against a Himalayan peak at dusk"
          className="absolute inset-0 -z-10 block size-full object-cover object-center" sizes="100vw" />
        <div
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: "var(--gradient-photo-scrim)" }}
          aria-hidden="true"
        />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center text-center">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Plan with us" }]}
          />
          <h1 className="mt-4 max-w-4xl text-center font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-000 sm:text-[64px] sm:leading-[1.1]">
            Design Your Dream Journey
          </h1>
          <p className="mt-4 max-w-2xl text-center font-poppins text-[18px] leading-[28.8px] font-medium text-brand-neutral-000">
            Everything required before you set foot on the trail — permits, visas, and paperwork,
            explained simply.
          </p>
        </div>
      </section>

      <section className="bg-brand-neutral-000 px-6 pt-px pb-16 md:px-16">
        <div className="relative z-10 mx-auto -mt-32 flex w-full max-w-[1440px] justify-center sm:-mt-40">
          <PlanWithUsWizard />
        </div>
      </section>
    </>
  );
}
