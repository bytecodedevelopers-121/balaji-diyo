"use client";

import { CarouselNavButton } from "@/components/ui/CarouselNavButton";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { useScrollCarousel } from "@/hooks/useScrollCarousel";

export interface CarouselTestimonial {
  id: string;
  title: string;
  body: string;
  name: string;
  date: string;
}

/**
 * The 3-card row for `TestimonialsSection`, split into its own Client
 * Component the same way `TripsCarousel`/`BlogCarousel` are — split
 * out 2026-08-27. The section's own comment previously claimed
 * "decorative prev/next arrows either side... aren't wired to
 * anything further", but no such arrows actually existed in the
 * markup — that comment was stale. This is the first time this
 * section has real prev/next paging, using the shared
 * `CarouselNavButton` (single-card-per-view on mobile, matching
 * Trips/Trips Lineup/Blog).
 */
export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: CarouselTestimonial[];
}) {
  const { scrollerRef, canScrollLeft, canScrollRight, scrollByPage } =
    useScrollCarousel<HTMLDivElement>([testimonials]);

  return (
    <div className="relative mt-10">
      <CarouselNavButton
        direction="left"
        onClick={() => scrollByPage(-1)}
        disabled={!canScrollLeft}
        label="Previous testimonials"
        className="hidden md:flex"
      />
      <CarouselNavButton
        direction="right"
        onClick={() => scrollByPage(1)}
        disabled={!canScrollRight}
        label="Next testimonials"
        className="hidden md:flex"
      />

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto px-5 scroll-smooth [scrollbar-width:none] md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((testimonial) => (
          <figure
            key={testimonial.id}
            className="flex h-[332px] w-[390px] max-w-full shrink-0 snap-start flex-col justify-between border border-brand-neutral-300 bg-brand-neutral-000 p-4 md:h-auto md:w-full md:basis-[calc(33.333%-16px)] md:rounded-card md:p-6"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex gap-1 text-secondary-500" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={index} />
                  ))}
                </div>
                <span
                  aria-hidden="true"
                  className="text-4xl leading-none text-brand-neutral-300"
                >
                  &rdquo;
                </span>
              </div>
              <figcaption className="mt-3 font-playfair-display text-[18px] leading-none font-bold text-brand-neutral-1000">
                {testimonial.title}
              </figcaption>
              <blockquote
                className="mt-3 line-clamp-6 font-poppins text-body-m font-medium text-brand-neutral-700 [&_p]:inline"
                dangerouslySetInnerHTML={{ __html: testimonial.body }}
              />
            </div>
            <div className="flex items-center gap-3 border-t border-brand-neutral-300 pt-4">
              <InitialsAvatar name={testimonial.name} />
              <div>
                <p className="text-body-m font-bold text-brand-neutral-1000">
                  {testimonial.name}
                </p>
                <p className="font-poppins text-body-m font-medium text-brand-neutral-700">{testimonial.date}</p>
              </div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" />
    </svg>
  );
}
