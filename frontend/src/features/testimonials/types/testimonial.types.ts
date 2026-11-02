/**
 * Testimonial domain type — maps to the backend's Testimonial module
 * (backend/src/modules/testimonial), mounted at `GET /testimonials`.
 *
 * PROVISIONAL — see features/trips/types/trip.types.ts for the same caveat.
 */
export interface Testimonial {
  id: string;
  salutation?: string | null;
  fullName: string;
  reviewAbstract?: string | null;
  reviewTitle?: string | null;
  review: string;
  reviewRating?: number | string | null;
  reviewDate?: string | null;
  countryCode: string;
  countryName: string;
  isFeatured?: boolean;
  packages?: Array<{ id: string; title: string }>;
}
