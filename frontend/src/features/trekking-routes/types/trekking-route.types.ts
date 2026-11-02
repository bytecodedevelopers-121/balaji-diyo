/**
 * Trekking-route-map domain type — maps to the backend's PackageMap
 * module (backend/src/modules/package-map), exposed publicly via
 * `GET /package-maps` (list) and `GET /package-maps/slug/:slug`
 * (detail). Captured from a live response, not guessed. Only the fields
 * the public site actually renders are included here, same convention
 * as TeamMember's own type.
 *
 * "Trekking route" (this feature's own name, matching the page's real
 * legacy URL "/trekking-routes-map-of-nepal") vs. "trip map" (the
 * backend/admin's own name for the exact same PackageMap record, see
 * frontend-admin's TripMapForm.tsx) — same entity, named for its
 * audience on each side, not a mismatch to reconcile.
 */
export interface TrekkingRoute {
  id: string;
  packageId: string;
  mapTitle: string;
  /** Short summary — real CMS-authored HTML where set, plain text on a few older rows. Render with dangerouslySetInnerHTML either way (trusted admin content, same trust level as the rest of the site's copy). */
  mapAbstract: string | null;
  /** Full route description — real CMS-authored HTML, render with dangerouslySetInnerHTML (see CmsProse). */
  mapDetails: string | null;
  /**
   * The route map graphic. Resolved server-side from the FEATURED (or,
   * for the 46 legacy-migrated rows that predate that field, BANNER)
   * Attachment — see package-map.repository.ts's findFeaturedImagePaths
   * for why both roles are checked. Null only for a trip map with no
   * image attached yet.
   */
  mapImageUrl: string | null;
  /** Resolved from the owning `url_infos` row server-side; null only if that row is somehow missing. */
  slug: string | null;
  /**
   * The owning Package's `categories` (its region/style taxonomy —
   * "Everest Region Treks" etc, not the coarse `destination` field,
   * which is essentially "Nepal" for nearly every package) — only
   * present on the single-route response (`GET /package-maps/slug/:slug`),
   * not the list one, and only used to fetch "Related Maps"
   * (`categories[0]?.id`, mirroring `BlogPost.categories[0]?.id` for
   * blog's own related posts), never rendered directly. Sorted
   * server-side so a real region always sorts before a flat marketing
   * tag like "Best Selling" — see package-map.repository.ts's own
   * comment.
   */
  categories?: { id: string; title: string }[];
}
