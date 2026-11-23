/**
 * "In Their Own Words" — transcribed from design-references/
 * homepage.png (y≈5560–6180 at 1440px). Light background
 * (--color-primary-100), left-aligned heading beside a row of
 * review-platform badges, three testimonial cards below.
 *
 * Platform badges (TripAdvisor/Facebook/Google/Trustpilot) are cropped
 * directly from the screenshot (public/images/testimonials/badge-*.png)
 * rather than redrawn — these are third-party marks, and a screenshot
 * crop of the business's own real design reproduces them exactly
 * without hand-recreating trademarked logos.
 *
 * **API-integrated 2026-08-20**: pulls `GET /testimonials?
 * isFeatured=true` via `getFeaturedTestimonials()`, same admin-curated
 * `isFeatured` flag Popular Trips uses. No avatar field exists on
 * `Testimonial` — every real card renders a first-initial circle
 * (`InitialsAvatar`) instead of a photo, matching the real legacy site
 * (boundlessadventure.com/reviews never had reviewer photos either).
 * Falls back to the original 3 hardcoded cards only if no testimonial
 * is flagged `isFeatured` yet.
 *
 * **Carousel 2026-08-27**: the card row is now `TestimonialsCarousel`,
 * a Client Component — see its own comment (the "decorative prev/next
 * arrows" this comment used to claim existed never actually did; this
 * is the first time this section has real ones).
 */

import {
  ReviewPlatformBadge,
  reviewPlatforms,
} from "@/components/ui/ReviewPlatformBadge";
import { getFeaturedTestimonials } from "@/features/testimonials/api/get-testimonials";
import { formatTestimonialDate } from "@/features/testimonials/lib/format-date";
import { TestimonialsCarousel } from "./TestimonialsCarousel";

const FALLBACK_TESTIMONIALS = [
  {
    id: "fallback-1",
    title: "First and best trekking experience in Annapurna",
    body: "My wife and I went for the Everest base camp trek, and our experience was exceptional. We couldn't have asked for a better partner in this adventure than Your Company Pvt. Ltd.s. The team at Your Company Pvt. Ltd.s always made sure everything was smooth and easy. My wife and I went for the Everest base camp trek, and our experience was exceptional. We couldn't have asked for",
    name: "Haruu",
    date: "Apr 05, 2026",
  },
  {
    id: "fallback-2",
    title: "Majestic beauty if Ghorepani Poon Hill",
    body: "I heard a lot about the beauty of Nepal from many of my friends. Luckily, last October, I got to experience heaven with my two friends. One of my friends has already come to Nepal and has trekked through Your Company Pvt. Ltd., and we also chose the same company for our journey. We planned an extended vacation but had to leave as soon as possible due to some issues.",
    name: "Chen Li",
    date: "May 24, 2026",
  },
  {
    id: "fallback-3",
    title: "Lifetime experience of Everest Base Camp Trek",
    body: "My wife and I went for the Everest base camp trek, and our experience was exceptional. We couldn't have asked for a better partner in this adventure than Your Company Pvt. Ltd.s. The team at Your Company Pvt. Ltd.s always made sure everything was smooth and easy.",
    name: "Mark",
    date: "Jan 10, 2026",
  },
];

export async function TestimonialsSection() {
  const featured = await getFeaturedTestimonials();

  const testimonials =
    featured.length > 0
      ? featured.map((testimonial) => ({
          id: testimonial.id,
          title: testimonial.reviewTitle || testimonial.fullName,
          // `review`/`reviewAbstract` are rich-text HTML (see
          // TestimonialsPageSection's identical `reviewAbstract ||
          // review` preference), not plain text — rendered via
          // `dangerouslySetInnerHTML` below, same as that page.
          body: testimonial.reviewAbstract || testimonial.review,
          name: testimonial.fullName,
          date: formatTestimonialDate(testimonial.reviewDate),
        }))
      : FALLBACK_TESTIMONIALS;

  // `py-[50px]`, was `py-16` then `py-14` — see AboutSection.tsx's own
  // comment (2026-09-03, two passes).
  return (
    <section className="bg-primary-100 py-[2px] sm:py-[25px]">
      <div className="mx-auto w-full max-w-[1440px] md:px-16">
        <div className="flex flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-0">
          <div>
            <p className="text-body-l font-medium text-primary-500">
              Testimonials
            </p>
            <h2 className="mt-2 font-display text-raleway-4xl font-medium text-brand-neutral-1000 sm:text-display-section">
              In Their Own Words
            </h2>
          </div>
          {/*
            Mobile-requested (2026-09-03): the 4 platform badges should
            read as a deterministic 2×2 grid on mobile, not an
            organic `flex-wrap` that happened to land 2-per-row only
            by coincidence of how wide "Tripadvisor" vs "Google"
            render. `md:flex md:flex-wrap` restores the original
            single-row-next-to-the-heading layout at `md` and up,
            where there's room for all 4 in a row.
          */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 items-center justify-items-start gap-3 md:flex md:flex-wrap" aria-hidden="true">
            {reviewPlatforms.map((platform) => (
              <ReviewPlatformBadge key={platform.title} platform={platform} />
            ))}
          </div>
        </div>

        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
