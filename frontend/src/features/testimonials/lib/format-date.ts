/**
 * Shared testimonial review-date formatter — extracted from
 * `TestimonialsPageSection` (built first, for `/reviews`) so
 * `TestimonialsSection` (the homepage section) doesn't duplicate it.
 */
export function formatTestimonialDate(value?: string | null) {
  if (!value) return "Recent review";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
