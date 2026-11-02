import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CmsProse } from "@/components/ui/CmsProse";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import { Pagination } from "@/components/ui/Pagination";
import { TripCard } from "@/components/sections/TrekkingRegionsSection";
import type { CategoryDetail } from "@/app/[slug]/resolve-content";

/**
 * A real legacy category-browse page (e.g. "Nepal Peak Climbing",
 * "Nepal Tour Packages", "Nepal Helicopter Tours" — real migrated
 * `Category` rows tagged onto packages via the many-to-many
 * `Package.categories` relation, each keeping its own real
 * `boundlessadventure.com/<slug>` URL). Same general shape as
 * `TrekkingRegionDetailSection` (real title, real package grid, real
 * CMS description) — reuses that file's own `TripCard` rather than a
 * second copy.
 *
 * 6-per-page, same shared `Pagination` component TrekkingRoutesSection
 * and BlogListingSection already use — no other filter/query param
 * lives on this page, so `buildHref` only ever needs to thread `page`.
 */
export function CategoryDetailSection({ data }: { data: CategoryDetail }) {
  const { category, trips, meta } = data;

  return (
    <section className="mx-auto w-full max-w-[1440px] px-6 pb-20 pt-14 md:px-16 md:pb-28 md:pt-16">
      <Breadcrumbs
        tone="dark"
        items={[{ label: "Home", href: "/" }, { label: category.title }]}
      />
      <h1 className="mt-7 text-center font-playfair-display text-[44px] font-medium leading-[1.1] text-brand-neutral-1000 md:text-[56px]">
        {category.title}
      </h1>

      {trips.length > 0 ? (
        <div className="mt-12 grid grid-cols-1 gap-x-5 gap-y-9 min-[640px]:grid-cols-2 min-[1120px]:grid-cols-3 min-[1440px]:grid-cols-4 md:mt-14">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
            />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center font-poppins text-body-l text-brand-neutral-700">
          New itineraries in this category are being prepared.
        </p>
      )}

      <div className="mt-10 md:mt-12">
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          buildHref={(targetPage) =>
            targetPage === 1 ? `/${category.slug}` : `/${category.slug}?page=${targetPage}`
          }
        />
      </div>

      {category.description ? (
        <CmsProse
          html={normalizeCmsHtml(category.description)}
          className="mx-auto mt-20 max-w-[1040px] overflow-x-auto text-brand-neutral-700 md:mt-28"
        />
      ) : null}
    </section>
  );
}
