/**
 * A real, migrated legacy category-browse page (e.g. "Nepal Peak
 * Climbing", "Nepal Tour Packages") — confirmed live against real data:
 * these are `Category` rows (any `CategoryType`, historically
 * `destination`) tagged onto packages via the many-to-many
 * `Package.categories` relation, each with its own real migrated
 * `url_infos` slug matching the old site's actual URL
 * (`https://boundlessadventure.com/nepal-peak-climbing`, etc.) — not
 * invented routing.
 */
export interface Category {
  id: string;
  title: string;
  slug: string;
  /** Real CMS-authored HTML (legacy `description` column) — already normalized (legacy-URL fixups), render with CmsProse/dangerouslySetInnerHTML like every other admin-authored copy on this site. */
  description: string | null;
  /** Real FEATURED/BANNER/SINGLE_BANNER attachment, absolute URL — confirmed live, all 3 real category pages this page serves have one. */
  imageUrl: string | null;
}
