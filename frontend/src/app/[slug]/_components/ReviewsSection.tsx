"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import type { PackageDetail } from "../data";
import { StarIcon } from "./icons";
import { ReviewPlatformBadge, reviewPlatforms } from "@/components/ui/ReviewPlatformBadge";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { EmptyNote } from "./SectionRow";

const PAGE_SIZE = 4;
const CLAMP_LENGTH = 170;

function ReviewCard({ review }: { review: PackageDetail["reviews"][number] }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.body.length > CLAMP_LENGTH;
  const body = expanded || !long ? review.body : `${review.body.slice(0, CLAMP_LENGTH).trimEnd()}…`;

  return (
    <figure className="rounded-sm bg-white p-5 shadow-[0_2px_8px_rgba(6,74,112,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <span className="relative">
          <InitialsAvatar name={review.name} />
          <BadgeCheck aria-hidden="true" className="absolute -top-1 -right-1 size-4 fill-[#12805c] text-white" />
        </span>
        <div className="text-right text-[11px] text-brand-neutral-700">
          <span className="flex justify-end gap-0.5 text-[#f7931e]" role="img" aria-label={`Rated ${review.rating} out of 5`}>
            {Array.from({ length: review.rating }).map((_, index) => (
              <StarIcon key={index} className="size-3.5" />
            ))}
          </span>
          <span className="mt-1 block">{review.date}</span>
        </div>
      </div>
      <p className="mt-1 text-[12px] font-semibold text-brand-neutral-800">{review.name}</p>
      <figcaption className="mt-3 text-[17px] leading-snug font-semibold text-brand-neutral-800">{review.title}</figcaption>
      <blockquote className="mt-2 text-[13px] leading-relaxed text-brand-neutral-700">{body}</blockquote>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 text-[12px] font-semibold text-[#f7931e]"
        >
          {expanded ? "read less −" : "read more +"}
        </button>
      ) : null}
    </figure>
  );
}

/**
 * "<Trip> Review" — heading with the Travelers' Choice badge, a pale panel
 * of review cards (four at a time, "Load More" for the rest), and the
 * review-platform badges underneath. Video reviews follow in their own
 * section (see `VideoReviewsSection`).
 */
export function ReviewsSection({ trip }: { trip: PackageDetail }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = trip.reviews.slice(0, visible);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h3 className="text-[28px] leading-tight font-bold text-brand-neutral-900">{trip.title} Review</h3>
        <p className="flex items-center gap-2 text-[12px] font-semibold text-brand-neutral-900">
          <span className="grid size-8 place-items-center rounded-full bg-[#34e0a1] text-[#00381f]">
            <StarIcon className="size-4" />
          </span>
          <span>
            Travelers&apos; Choice
            <span className="block font-normal">2026</span>
          </span>
        </p>
      </div>
      <p className="mt-3 max-w-[640px] text-[13px] leading-relaxed text-brand-neutral-800">
        We collect reviews from popular platforms, including Google Maps, TripAdvisor, Facebook, Trustpilot, and others; they
        are genuine feedback from our previous customers.
      </p>

      <div className="mt-5 rounded-sm bg-[#dcebf3] p-6 sm:p-8">
        {trip.reviews.length === 0 ? (
          <EmptyNote>Reviews for this trip will be added soon.</EmptyNote>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
            {shown.map((review, index) => (
              <ReviewCard key={`${review.name}-${index}`} review={review} />
            ))}
          </div>
        )}
        {visible < trip.reviews.length ? (
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="mt-6 rounded-pill border border-[#f7931e] bg-white px-5 py-2 text-[12px] font-medium text-brand-neutral-900 transition-colors hover:bg-[#fdeee1]"
          >
            Load More →
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 items-center justify-items-start gap-3 sm:flex sm:flex-wrap">
        {reviewPlatforms.map((platform) => (
          <ReviewPlatformBadge key={platform.title} platform={platform} />
        ))}
      </div>
    </section>
  );
}
