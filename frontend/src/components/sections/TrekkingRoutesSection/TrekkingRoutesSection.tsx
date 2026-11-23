import { getTrekkingRoutes } from "@/features/trekking-routes/api/get-trekking-routes";
import { Pagination } from "@/components/ui/Pagination";
import { TrekkingRouteCard } from "./TrekkingRouteCard";

const PER_PAGE = 6;

/**
 * /map's main section (moved 2026-09-03 from /trekking-routes-map-of-
 * nepal — see that page's own doc comment) — intro copy (design-
 * references/trekking-route.png, y≈700–1200 at 1440px) + a grid of
 * route-map cards (y≈1210–2170).
 *
 * White background, not the solid black band it first appears to be in
 * the screenshot — same transparent-export-hole artifact already
 * documented for ContactSection (see that component's own comment);
 * this page's own alpha channel confirms the same thing (RGBA 0,0,0,0
 * behind the intro/grid, not opaque black).
 *
 * The design mockup shows exactly 6 cards (2 rows × 3), but only 3
 * unique route maps repeated twice — a mockup placeholder, not real
 * content (confirmed against the 48 real, legacy-migrated trip maps
 * behind GET /package-maps; see getTrekkingRoutes). `PER_PAGE = 6` is
 * kept anyway since it reproduces the exact 2×3 grid density the design
 * shows on every page, while real pagination (unlike the mockup) walks
 * through all 48 real routes instead of hiding 42 of them.
 */
export async function TrekkingRoutesSection({ page }: { page: number }) {
  const { items: routes, meta } = await getTrekkingRoutes(page, PER_PAGE);

  return (
    <section className="bg-brand-neutral-000 py-11">
      <div className="mx-auto flex w-full max-w-[1442px] flex-col items-center gap-6 px-6 text-center md:px-16">
        <h2 className="font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-1000">
          Trekking Routes Map of Nepal
        </h2>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          With an area of 147,516 sq. km, Nepal is a small Asian country.
          Despite its small size, it is a paradise for travelers worldwide.
          With various landscapes, a unique culture, spirituality, and
          mesmerizing mountain peaks, it is a top destination for visitors
          seeking an all-in-one experience.
        </p>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          Even a tiny country has several trekking routes that attract
          adventure seekers worldwide. One of the essential aspects of
          trekking in Nepal that every trekker must know is the various
          trekking routes and their maps, which help you experience the
          thrill of trekking. Likewise, it is equally important to
          understand the value of trekking route maps and to learn how to
          interpret them.
        </p>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          Your Company Pvt. Ltd. has provided a map of trekking routes in
          Nepal, offering trekkers in-depth information on the specific
          route they are trekking. By providing a map of the several
          trekking routes in Nepal, we aim to help trekkers with
          navigation, safety, and self-planning.
        </p>
        <p className="max-w-4xl font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-700">
          The route maps of Nepal&apos;s trekking destinations feature two
          crucial elements: LEGEND and itinerary highlights, along with
          detailed descriptions of every trekking area. They are
          downloadable with zoom-in and zoom-out features.
        </p>

        {routes.length > 0 ? (
          <div
            className="mt-5 grid w-full grid-cols-1 gap-px bg-brand-neutral-300 sm:grid-cols-2 lg:grid-cols-3"
            style={{ border: "var(--border-card-contact)" }}
          >
            {routes.map((route) => (
              <TrekkingRouteCard key={route.id} route={route} />
            ))}
          </div>
        ) : (
          <p className="mt-5 font-poppins text-body-m text-brand-neutral-600">
            No trekking route maps are available right now.
          </p>
        )}

        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          buildHref={(targetPage) =>
            targetPage === 1 ? "/map" : `/map?page=${targetPage}`
          }
        />
      </div>
    </section>
  );
}
