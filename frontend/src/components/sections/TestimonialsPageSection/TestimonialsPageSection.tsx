"use client";

import { ChevronDown, Quote, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  ReviewPlatformBadge,
  reviewPlatforms,
} from "@/components/ui/ReviewPlatformBadge";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import type { Testimonial } from "@/features/testimonials/types/testimonial.types";
import { formatTestimonialDate as formatDate } from "@/features/testimonials/lib/format-date";

interface TestimonialsPageSectionProps {
  testimonials: Testimonial[];
}

function numericRating(testimonial: Testimonial) {
  return Math.max(1, Math.min(5, Number(testimonial.reviewRating) || 5));
}

function Stars({ rating, size = "size-[18px]" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex gap-1 text-secondary-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={size}
          fill={index < rating ? "currentColor" : "none"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export function TestimonialsPageSection({ testimonials }: TestimonialsPageSectionProps) {
  const [packageId, setPackageId] = useState("");
  const [ratings, setRatings] = useState<number[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);

  const packages = useMemo(() => {
    const entries = new Map<string, string>();
    testimonials.forEach((testimonial) =>
      testimonial.packages?.forEach((pkg) => entries.set(pkg.id, pkg.title)),
    );
    return Array.from(entries, ([id, title]) => ({ id, title })).sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [testimonials]);

  // Real overall rating + per-star breakdown, computed from the actual
  // `testimonials` array — replaces a hardcoded "4.9/5" / "501 reviews" /
  // 422-6-10-3-1 `referenceBreakdown` fixture that never reflected the
  // real data (FIXED 2026-09-04, user-reported: those numbers were fake).
  const reviewCount = testimonials.length;
  const averageRating = reviewCount
    ? testimonials.reduce((sum, testimonial) => sum + numericRating(testimonial), 0) / reviewCount
    : 0;
  const ratingBreakdown = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const count = testimonials.filter((item) => numericRating(item) === rating).length;
        return { rating, count, percent: reviewCount ? (count / reviewCount) * 100 : 0 };
      }),
    [reviewCount, testimonials],
  );

  const countryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    testimonials.forEach((testimonial) => {
      counts.set(testimonial.countryName, (counts.get(testimonial.countryName) ?? 0) + 1);
    });
    return Array.from(counts, ([country, count]) => ({ country, count })).sort((a, b) =>
      a.country.localeCompare(b.country),
    );
  }, [testimonials]);

  const filtered = useMemo(
    () =>
      testimonials.filter((testimonial) => {
        const matchesPackage =
          !packageId || testimonial.packages?.some((pkg) => pkg.id === packageId);
        const matchesRating =
          ratings.length === 0 || ratings.includes(numericRating(testimonial));
        const matchesCountry =
          countries.length === 0 || countries.includes(testimonial.countryName);
        return matchesPackage && matchesRating && matchesCountry;
      }),
    [countries, packageId, ratings, testimonials],
  );

  function toggleValue<T>(value: T, setter: Dispatch<SetStateAction<T[]>>) {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
    setVisibleCount(5);
  }

  return (
    <section className="bg-brand-neutral-200 px-6 py-12 md:px-16 md:py-16">
      <div className="mx-auto max-w-[1312px]">
        <div className="grid gap-8 rounded-[24px] bg-white px-8 py-9 md:grid-cols-[1fr_1.2fr] md:px-24">
          <div className="flex flex-col justify-center">
            <p className="font-poppins text-[22px] font-semibold text-brand-neutral-1000">
              Overall Rating:
            </p>
            <p className="mt-2 font-poppins text-[48px] leading-none text-brand-neutral-1000">
              {averageRating.toFixed(1)}/5
            </p>
            <div className="mt-7 flex items-center gap-4">
              <Stars rating={Math.round(averageRating)} size="size-5" />
              <span className="font-poppins text-[16px] text-brand-neutral-800">
                {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {ratingBreakdown.map((item) => (
              <div key={item.rating} className="grid grid-cols-[20px_22px_1fr_42px] items-center gap-2">
                <span className="text-right font-poppins text-sm text-brand-neutral-800">{item.rating}</span>
                <Star className="size-[18px] text-secondary-500" fill="currentColor" />
                <div className="h-3 overflow-hidden rounded-full bg-brand-neutral-200">
                  <div
                    className="h-full rounded-full bg-secondary-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="font-poppins text-sm text-brand-neutral-800">({item.count})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-5 flex flex-col gap-5 rounded-2xl bg-white p-3 md:flex-row md:items-center md:justify-between">
          {/*
            Deterministic 2-per-row on mobile (2026-09-03), same as
            TestimonialsSection's identical badge row — plain
            `flex flex-wrap` only happened to land 2-per-row depending
            on how wide each platform's label rendered, not reliably.
            `md:flex md:flex-wrap` restores one row once this card's
            own layout switches to `md:flex-row`.
          */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 items-center justify-items-start gap-3 md:flex md:flex-wrap">
            {reviewPlatforms.map((platform) => (
              <ReviewPlatformBadge key={platform.title} platform={platform} />
            ))}
          </div>
          <Link
            href="/contact"
            className="rounded-full bg-logo-sun px-8 py-4 text-center font-poppins text-[16px] font-bold text-logo-navy-dark hover:opacity-90"
          >
            Write A Review
          </Link>
        </div>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[400px_1fr]">
          <aside className="rounded-2xl border border-primary-300 bg-white p-6 lg:sticky lg:top-6">
            <FilterHeading>By Package</FilterHeading>
            <div className="relative mt-4">
              <select
                value={packageId}
                onChange={(event) => {
                  setPackageId(event.target.value);
                  setVisibleCount(5);
                }}
                className="h-12 w-full appearance-none rounded-xl border border-brand-neutral-300 bg-white px-4 pr-10 font-poppins text-sm text-brand-neutral-800 outline-none focus:border-primary-500"
              >
                <option value="">Select a package</option>
                {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.title}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" />
            </div>

            <FilterHeading className="mt-8">By Ratings</FilterHeading>
            <div className="mt-4 space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = testimonials.filter((item) => numericRating(item) === rating).length;
                return (
                  <label key={rating} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={ratings.includes(rating)}
                      onChange={() => toggleValue(rating, setRatings)}
                      className="size-4 accent-primary-500"
                    />
                    <Stars rating={rating} />
                    <span className="font-poppins text-sm text-brand-neutral-800">({count})</span>
                  </label>
                );
              })}
            </div>

            <FilterHeading className="mt-8">By Country</FilterHeading>
            <div className="mt-4 max-h-[330px] space-y-3 overflow-y-auto pr-2 [scrollbar-color:#e0e0e0_transparent] [scrollbar-width:thin]">
              {countryOptions.map(({ country, count }) => (
                <label key={country} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={countries.includes(country)}
                    onChange={() => toggleValue(country, setCountries)}
                    className="size-4 accent-primary-500"
                  />
                  <span className="font-poppins text-sm text-brand-neutral-800">
                    {country} ({String(count).padStart(2, "0")})
                  </span>
                </label>
              ))}
            </div>
          </aside>

          <div>
            <div className="space-y-5">
              {filtered.slice(0, visibleCount).map((testimonial) => (
                <article key={testimonial.id} className="relative rounded-2xl border border-primary-300 bg-white p-7 shadow-[0_8px_20px_rgba(0,0,0,0.12)] md:p-8">
                  <Quote aria-hidden="true" className="absolute right-7 top-7 size-8 rotate-180 text-brand-neutral-300" fill="currentColor" />
                  <Stars rating={numericRating(testimonial)} />
                  <h2 className="mt-3 pr-12 font-playfair-display text-[18px] leading-none font-bold text-brand-neutral-1000">
                    {testimonial.reviewTitle || "A memorable journey with Joyful Trekking Pvt. Ltd."}
                  </h2>
                  <div
                    className="mt-3 line-clamp-4 font-poppins text-body-m font-medium text-brand-neutral-700 [&_p]:inline"
                    dangerouslySetInnerHTML={{ __html: testimonial.reviewAbstract || testimonial.review }}
                  />
                  <div className="mt-7 flex items-center gap-4 border-t border-brand-neutral-300 pt-6">
                    <InitialsAvatar name={testimonial.fullName} />
                    <div>
                      <p className="font-poppins text-sm font-bold text-brand-neutral-1000">{testimonial.fullName}</p>
                      <p className="font-poppins text-sm text-brand-neutral-700">{formatDate(testimonial.reviewDate)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center font-poppins text-brand-neutral-800">
                No reviews match the selected filters.
              </div>
            ) : null}

            {visibleCount < filtered.length ? (
              <div className="mt-7 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + 5)}
                  className="rounded-full bg-secondary-500 px-9 py-4 font-poppins font-semibold text-white hover:bg-secondary-500/90"
                >
                  Load More
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-poppins text-sm font-semibold uppercase text-brand-neutral-1000 ${className}`}>{children}</h2>;
}
