import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import type { Testimonial } from "../types/testimonial.types";

export async function getTestimonials(): Promise<Paginated<Testimonial>> {
  return apiFetch<Paginated<Testimonial>>(
    "/testimonials?perPage=100&isActive=true",
    { next: { revalidate: 3600, tags: ["testimonials"] } },
  );
}

/**
 * Fetches the homepage's curated testimonials (`GET /testimonials?
 * isFeatured=true`) for `TestimonialsSection`. Separate from
 * `getTestimonials()` above — that one pulls every active review for
 * `/reviews`, this pulls just the admin-curated set for the homepage.
 */
export async function getFeaturedTestimonials(limit = 3): Promise<Testimonial[]> {
  const page = await apiFetch<Paginated<Testimonial>>(
    `/testimonials?isFeatured=true&isActive=true&perPage=${limit}`,
    { next: { revalidate: 3600, tags: ["testimonials"] } },
  );
  return page.items;
}
