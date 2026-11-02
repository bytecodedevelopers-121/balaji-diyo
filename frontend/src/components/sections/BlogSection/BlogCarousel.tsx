"use client";

import Link from "next/link";
import { CarouselNavButton } from "@/components/ui/CarouselNavButton";
import { useScrollCarousel } from "@/hooks/useScrollCarousel";
import { FillImage } from "@/components/ui/FillImage";

export interface CarouselPost {
  slug: string | null;
  image: string;
  title: string;
  date: string;
  author: string;
}

/**
 * The 2-post row for `BlogSection`, split into its own Client Component
 * the same way `TripsCarousel` is — split out 2026-08-27 when this
 * became a real scroll-snap carousel instead of a static 2-up CSS
 * grid. On mobile the 2 posts previously just stacked vertically with
 * no way to page between them; now they're a single-card-per-view
 * horizontal carousel with the shared `CarouselNavButton`, same as
 * Trips/Trips Lineup/Testimonials. **Shown on mobile too, 2026-09-14**
 * (direct request) — see `TripsCarousel`'s own comment for the same
 * change there; was previously hidden below `md`.
 *
 * Card width was a fixed `389px` (plus `px-5` scroller padding) below
 * `md` until 2026-09-22 — same "only matched one device width" bug as
 * `TripsLineupCarousel` (see its own comment): broke at narrower
 * viewports like 540×720, where the nav button sat over the sliver of
 * the next card instead of the visible one. Now `w-full` with no
 * scroller padding, matching `TripsCarousel`'s proven pattern.
 */
export function BlogCarousel({ posts }: { posts: CarouselPost[] }) {
  const { scrollerRef, canScrollLeft, canScrollRight, scrollByPage } =
    useScrollCarousel<HTMLDivElement>([posts]);

  return (
    <div className="relative">
      <CarouselNavButton
        direction="left"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollLeft}
        label="Previous posts"
      />
      <CarouselNavButton
        direction="right"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollRight}
        label="Next posts"
      />

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => (
          <Link
            key={post.slug ?? post.title}
            href={post.slug ? `/blog/${post.slug}` : "/blog"}
            className="relative h-[460px] w-full shrink-0 snap-start overflow-hidden rounded-[16px] lg:aspect-[4/3.9] lg:h-auto lg:basis-[calc(50%-12px)]"
          >
            <FillImage
              src={post.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 33vw, 85vw" />
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "var(--gradient-photo-scrim)" }}
              aria-hidden="true"
            />
            <div className="absolute right-5 bottom-5 left-5 flex flex-col gap-1.5 text-brand-neutral-000">
              <p className="text-heading-xl font-bold">{post.title}</p>
              <div className="flex flex-wrap items-center gap-3 text-body-m">
                <span className="rounded-pill border border-brand-neutral-000/60 px-3 py-1">
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <PersonIcon />
                  {post.author}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PersonIcon() {
  return (
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
