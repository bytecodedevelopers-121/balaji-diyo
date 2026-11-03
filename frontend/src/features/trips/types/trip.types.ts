/**
 * Trip domain type — maps to the backend's Package module
 * (backend/src/modules/package), exposed publicly via `GET /packages`
 * (list) and `GET /packages/:slug` (detail).
 *
 * PROVISIONAL: fields below are the ones visible on the admin
 * create-package DTO that make sense for a public listing. The exact
 * public response shape (what `findAllPublic`/`findPublicBySlug` actually
 * serialize) hasn't been captured from a live response yet — adjust this
 * once it has.
 */
export interface Trip {
  id: string;
  title: string;
  slug: string;
  abstract?: string;
  /** Card photo — resolved server-side from the package's FEATURED/BANNER attachment, absolute URL or null if neither was ever uploaded. */
  imageUrl?: string | null;
  duration?: number | string;
  durationType?: string;
  /** Lowest real per-person price across the package's PriceGroup rows (offer price preferred over list price), not `Package.price` — that flat column is unused/0 on real migrated data. */
  priceFrom?: number;
  /** Average of active testimonial ratings, computed for region listing cards. */
  rating?: number;
  reviewCount?: number;
  /** Admin flag: shown in the homepage "Best Sellers" pool. */
  isPopular?: boolean;
  /** Admin flag: shown in the Featured Trips pool. */
  isFeatured?: boolean;
}

/** Raw `GET /packages` price-group shape, just enough to derive `Trip.priceFrom`. Decimal fields serialize as numeric strings — see `lib/decimal.ts`. */
export interface RawPackagePriceGroup {
  unitPrice: number | string;
  offerUnitPrice?: number | string | null;
}
