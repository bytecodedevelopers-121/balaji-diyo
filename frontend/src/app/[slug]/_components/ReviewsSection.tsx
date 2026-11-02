import type { PackageDetail } from "../data";
import { StarIcon } from "./icons";
import {
  ReviewPlatformBadge,
  reviewPlatforms,
} from "@/components/ui/ReviewPlatformBadge";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";

/**
 * "<Trip> Trip Reviews" — the social-proof summary strip (avatar stack +
 * "100+ Happy Trekkers" + review-platform badges) matches Figma node
 * 1000006525 exactly; the rating breakdown bars and individual review
 * cards below are kept from the existing implementation since Figma's
 * page doesn't render them here but the data (and value) exists.
 */
export function ReviewsSection({ trip }: { trip: PackageDetail }) {
  return (
    <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
      <h2 className="font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">{trip.title} Trip Reviews</h2>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex">
          {trip.reviews.slice(0, 5).map((review, index) => (
            <InitialsAvatar
              key={review.name + index}
              name={review.name}
              size="stack"
              className="[&:not(:first-child)]:-ml-4"
            />
          ))}
        </div>
        <div>
          <p className="font-poppins text-2xl font-medium text-brand-neutral-900">100+ Happy Trekkers</p>
          <p className="font-poppins text-body-m font-medium text-brand-neutral-700">Explorations that last a lifetime.</p>
        </div>
      </div>

      {/*
        Deterministic 2-per-row on mobile (2026-09-03), same as
        TestimonialsSection's identical badge row — plain
        `flex flex-wrap` only happened to land 2-per-row depending on
        how wide each platform's label rendered, not reliably.
        `sm:flex sm:flex-wrap` lets all 4 sit in one row once there's
        room (this card's own `sm:p-8` step up).
      */}
      <div className="mt-6 grid grid-cols-2 items-center justify-items-start gap-3 sm:flex sm:flex-wrap">
        {reviewPlatforms.map((platform) => (
          <ReviewPlatformBadge key={platform.title} platform={platform} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-8 rounded-2xl border border-brand-neutral-300 p-6 sm:flex-row">
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 sm:w-40 sm:border-r sm:border-brand-neutral-300 sm:pr-6">
          <p className="font-poppins text-raleway-4xl font-medium text-brand-neutral-1000">{trip.rating.toFixed(1)}</p>
          <div className="flex gap-1 text-secondary-500" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon key={index} className="size-4" />
            ))}
          </div>
          <p className="font-poppins text-body-s font-medium text-brand-neutral-700">{trip.reviewCount} reviews</p>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {trip.reviewBreakdown.map((row) => (
            <div key={row.stars} className="flex items-center gap-3 font-poppins text-body-s font-medium text-brand-neutral-700">
              <span className="w-10 shrink-0">{row.stars} star</span>
              <span className="h-2 flex-1 overflow-hidden rounded-pill bg-brand-neutral-200">
                <span className="block h-full rounded-pill bg-secondary-500" style={{ width: `${row.percent}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right">{row.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {trip.reviews.map((review) => (
          <figure key={review.name} className="flex flex-col rounded-2xl border border-brand-neutral-300 p-6">
            <div className="flex gap-1 text-secondary-500" aria-hidden="true">
              {Array.from({ length: review.rating }).map((_, index) => (
                <StarIcon key={index} className="size-4" />
              ))}
            </div>
            <figcaption className="mt-3 font-playfair-display text-[18px] leading-none font-bold text-brand-neutral-1000">{review.title}</figcaption>
            <blockquote className="mt-3 font-poppins text-body-m font-medium text-brand-neutral-700">{review.body}</blockquote>
            <div className="mt-6 flex items-center gap-3 border-t border-brand-neutral-300 pt-4">
              <InitialsAvatar name={review.name} />
              <div>
                <p className="font-poppins text-body-m font-medium text-brand-neutral-1000">{review.name}</p>
                <p className="font-poppins text-body-m font-medium text-brand-neutral-700">{review.date}</p>
              </div>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
