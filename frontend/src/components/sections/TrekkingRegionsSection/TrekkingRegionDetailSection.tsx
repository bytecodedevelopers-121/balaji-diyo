import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CmsProse } from "@/components/ui/CmsProse";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import { Pagination } from "@/components/ui/Pagination";
import type { TrekkingRegionDetail } from "@/features/trekking-regions/types/trekking-region.types";
import type { Trip } from "@/features/trips/types/trip.types";
import { PackageCard } from "@/components/ui/PackageCard";

export function TripCard({ trip }: { trip: Trip }) {
  return <PackageCard trip={trip} />;
}

/**
 * Same layout as `CategoryDetailSection` (the "Nepal Tour Packages"-style
 * pages): breadcrumb, title, package grid, then the region's real CMS
 * description in the shared `CmsProse` colours.
 */
export function TrekkingRegionDetailSection({ data }: { data: TrekkingRegionDetail }) {
  const { region, trips, meta } = data;
  return (
    <section className="mx-auto w-full max-w-[1440px] px-6 pb-20 pt-14 md:px-16 md:pb-28 md:pt-16">
      <Breadcrumbs tone="dark" items={[{ label: "Home", href: "/" }, { label: "Nepal" }, { label: "Trekking Routes in Nepal", href: "/trekking-routes-in-nepal" }]} />
      <h1 className="mt-7 text-center font-playfair-display text-[44px] font-medium leading-[1.1] text-brand-neutral-1000 md:text-[56px]">{region.title}</h1>
      {trips.length ? (
        <div className="mt-12 grid grid-cols-1 gap-x-5 gap-y-9 min-[640px]:grid-cols-2 min-[1120px]:grid-cols-3 min-[1440px]:grid-cols-4 md:mt-14">
          {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      ) : (
        <p className="mt-16 text-center font-poppins text-body-l text-brand-neutral-700">New itineraries for this region are being prepared.</p>
      )}

      <div className="mt-10 md:mt-12">
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          buildHref={(targetPage) => (targetPage === 1 ? `/${region.slug}` : `/${region.slug}?page=${targetPage}`)}
        />
      </div>

      {region.description ? (
        <CmsProse
          html={normalizeCmsHtml(region.description)}
          className="mx-auto mt-20 max-w-[1040px] overflow-x-auto text-brand-neutral-700 md:mt-28"
        />
      ) : null}
    </section>
  );
}
