import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * "The Difference Is in the Details" — transcribed from
 * design-references/homepage.png (y≈6900–7530 at 1440px). Light blue
 * background, centered heading, 6-card icon grid.
 *
 * Icons are the real Figma exports (dropped into public/icons/
 * 2026-08-27, renamed from their export hashes to descriptive names).
 * Each came out of Figma as a raster PNG baked into an image-fill
 * pattern rather than real vector paths — no `currentColor` tinting
 * possible, so these render as plain `<img>`s rather than inline SVG
 * like a true vector icon would; the color is already baked in at
 * a blue matching this section's accent.
 *
 * The source repeats two of the six descriptions verbatim under
 * different titles (#3/#4 and #1/#5 and #2/#6 each share body copy) —
 * kept as-is, not deduped, per the fidelity rule the rest of this
 * page's transcription has followed.
 */

const FEATURES = [
  {
    title: "Unique & Adventurous Destinations",
    description:
      "We design trips to Nepal's most unique and adventurous spots. We take you off the beaten path to discover hidden gems.",
    icon: "/icons/feature-adventurous-destinations.png",
  },
  {
    title: "Safe, Healthy & Hassle-Free Trips",
    description:
      "We deliver personalized service with close attention to detail, ensuring every part of your trip exceeds expectations.",
    icon: "/icons/feature-safe-healthy-trips.png",
  },
  {
    title: "Guaranteed Trip Satisfaction",
    description:
      "Your safety and well-being are our top priorities. With comprehensive health protocols, experienced guides, quality equipment.",
    icon: "/icons/feature-trip-satisfaction.png",
  },
  {
    title: "Fair Pricing & Flexible Options",
    description:
      "Your safety and well-being are our top priorities. With comprehensive health protocols, experienced guides, quality equipment.",
    icon: "/icons/feature-fair-pricing.png",
  },
  {
    title: "Local Experience & Expert Guides",
    description:
      "We design trips to Nepal's most unique and adventurous spots. We take you off the beaten path to discover hidden gems.",
    icon: "/icons/feature-expert-guides.png",
  },
  {
    title: "Safe For Solo Female Traveller",
    description:
      "We deliver personalized service with close attention to detail, ensuring every part of your trip exceeds expectations.",
    icon: "/icons/feature-solo-female-traveller.png",
  },
];

export function FeaturesSection() {
  // `py-[50px]`, was `py-16` then `py-14` — see AboutSection.tsx's own
  // comment (2026-09-03, two passes).
  return (
    <section className="bg-primary-100 py-[2px] sm:py-[25px]">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-16">
        <SectionHeading
          eyebrow="Features"
          title="The Difference Is in the Details"
          description="Twenty-five years of experience, local expertise, and journeys built entirely around you."
          align="center"
          className="mx-auto max-w-4xl"
        />

        <div className="mx-auto mt-12 grid max-w-[1216px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              // Orange `#fbc99d` border to match the card treatment on the
              // trip detail page's Itinerary/FAQ sections, per direct
              // request (2026-09-04) — was plain `border-brand-neutral-300`.
              className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-card border border-[#fbc99d] bg-brand-neutral-000 px-8 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not a Next/Image content image */}
              <img src={feature.icon} alt="" aria-hidden="true" loading="lazy" className="size-16" />
              <p className="text-heading-xl font-bold text-brand-neutral-1000">
                {feature.title}
              </p>
              <p className="text-body-m text-brand-neutral-800">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
