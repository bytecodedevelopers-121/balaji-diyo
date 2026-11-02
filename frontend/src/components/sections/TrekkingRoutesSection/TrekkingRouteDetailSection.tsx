import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CmsProse } from "@/components/ui/CmsProse";
import { ContactForm } from "@/components/sections/ContactSection/ContactForm";
import { getTrekkingRoutes } from "@/features/trekking-routes/api/get-trekking-routes";
import type { TrekkingRoute } from "@/features/trekking-routes/types/trekking-route.types";
import { TrekkingRouteCard } from "./TrekkingRouteCard";

/**
 * A single trekking route's own page — design-references/
 * trekking-route-details.png. No photo hero behind this one (unlike
 * every other secondary page): the design goes straight from the header
 * into breadcrumb + title + the route's own map graphic, so Breadcrumbs
 * renders in its "dark" tone here, same reasoning as /team/[slug]'s own
 * no-photo-hero page.
 *
 * White background — the "black" band the flattened screenshot shows
 * behind this whole section is the same transparent-export-hole
 * artifact already documented for ContactSection and
 * TrekkingRoutesSection (confirmed the same way: this PNG's own alpha
 * channel reads 0 there, not opaque black).
 *
 * The map image's "© Copyright Boundless Adventure..." bar is baked
 * into the graphic itself (every migrated map image already has it, see
 * a real one at /files/public/article/media-6dd9314b-1768732162.jpg) —
 * not re-rendered here as separate markup. "Download Map" is a real
 * link to that same image (`download` attribute — works for a
 * same-origin file, degrades to "open in a new tab" cross-origin, which
 * is still a reasonable way to save it).
 *
 * The inquiry form is literally ContactForm (ContactSection/ContactForm)
 * reused, not a second implementation — same fields, same submit
 * behavior, just "Make an Inquiry" instead of /contact's own heading,
 * a wider card to match this page's single-column layout, and
 * `packageId` set so the enquiry is linked to the route's underlying
 * trek package.
 *
 * "Related Maps" (2026-09-03, user-requested) — same shape as
 * BlogDetailSection's own "More Stories": reuses `TrekkingRouteCard`
 * (the exact card `/map`'s own listing grid renders) rather than a
 * second implementation, filtered to the route's own region/style
 * category (`route.categories[0]?.id` — see that field's own doc
 * comment on why the *first* category is the meaningful one, not the
 * coarse package-level "destination"), and only rendered when that
 * query actually finds other real routes — no fabricated/empty-state
 * filler card the way `similarPackages` on the package detail page
 * stays deliberately empty rather than inventing content.
 */
export async function TrekkingRouteDetailSection({ route }: { route: TrekkingRoute }) {
  const related = await getRelatedRoutes(route);

  return (
    <section className="bg-brand-neutral-000 py-16">
      <div className="mx-auto flex w-full max-w-[1024px] flex-col items-center px-6 text-center md:px-16">
        <Breadcrumbs
          tone="dark"
          items={[
            { label: "Home", href: "/" },
            { label: "Nepal" },
            {
              label: "Trekking Routes In Nepal",
              href: "/map",
            },
            { label: route.mapTitle },
          ]}
        />
        <h1 className="mt-4 font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-1000">
          {route.mapTitle}
        </h1>

        {route.mapImageUrl ? (
          <div className="relative mt-10 w-full">
            <a
              href={route.mapImageUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="absolute top-4 right-4 flex items-center gap-2 bg-secondary-500 px-4 py-2 font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-000 shadow-card-soft transition-opacity hover:opacity-90"
            >
              <DownloadIcon />
              Download Map
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element -- real, per-route content image (the route's own map graphic), not a static asset */}
            <img
              src={route.mapImageUrl}
              alt={`${route.mapTitle} — route map with legend and itinerary highlights`}
              className="w-full border border-brand-neutral-300"
            />
          </div>
        ) : null}

        {route.mapDetails ? (
          <CmsProse
            html={route.mapDetails}
            className="mt-10 max-w-[872px] text-center [&_h2]:text-center"
          />
        ) : null}
      </div>

      <div className="mx-auto mt-14 flex w-full max-w-[1024px] justify-center px-6 md:px-16">
        <ContactForm
          heading="Make an Inquiry"
          type="trekking-route"
          packageId={route.packageId}
          maxWidthClassName="max-w-full lg:max-w-[916px]"
        />
      </div>

      {related.length > 0 ? (
        // Wider than the rest of this page's `max-w-[1024px]` single
        // column — matches `/map`'s own listing width (`max-w-360`) so
        // the 3-column card grid gets the same room there, not squeezed
        // into a column sized for prose/a single map image.
        <div className="mx-auto mt-14 w-full max-w-360 px-6 md:px-16">
          <h2 className="text-center font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">
            Related Maps
          </h2>
          <div
            className="mt-6 grid w-full grid-cols-1 gap-px bg-brand-neutral-300 sm:grid-cols-2 lg:grid-cols-3"
            style={{ border: "var(--border-card-contact)" }}
          >
            {related.map((relatedRoute) => (
              <TrekkingRouteCard key={relatedRoute.id} route={relatedRoute} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Same shape as BlogDetailSection's own `getRelatedPosts`: filter the
 * generic list endpoint by the current item's own first (most specific —
 * see `TrekkingRoute.categories`' own doc comment) category, drop the
 * current route out of the result, cap at 3. `perPage: 4` rather than 3
 * for the same reason blog uses it — the current route itself is very
 * likely to be in its own "same category" result set, so one extra slot
 * covers that without a second request.
 */
async function getRelatedRoutes(route: TrekkingRoute): Promise<TrekkingRoute[]> {
  const categoryId = route.categories?.[0]?.id;
  if (!categoryId) return [];

  const page = await getTrekkingRoutes(1, 4, categoryId);
  return page.items.filter((item) => item.id !== route.id).slice(0, 3);
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
