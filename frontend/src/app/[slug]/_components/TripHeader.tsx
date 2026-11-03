import { ImageGallery } from "@/components/ui/ImageGallery";
import type { PackageDetail } from "../data";

/**
 * Full-bleed photo collage — transcribed from the Figma itinerary page
 * (file Ak1b0xbJLdSUXt2TLDMy89, node 125:117, "Frame 1000006452"). Used
 * to lead with a breadcrumb trail ("Frame 1000006453") above the
 * gallery — removed outright (2026-09-07 direct request, desktop and
 * mobile both) rather than hidden per breakpoint; `PackageDetail.breadcrumb`
 * (see `../data.ts`) is unused now but left in place rather than torn out
 * of the type/mapping too, in case it's wanted again.
 *
 * The title/rating/quick-actions bar that used to live in this same
 * file ("Frame 1000006460") moved out into its own `TripTitleBar`
 * component (2026-09-02, client-requested restructure): `<TabNav>` now
 * renders directly below the photo instead of below the title bar, with
 * TripTitleBar right after it — `id="overview"` lives on TripTitleBar
 * itself now, so clicking the Overview tab lands on the trip's name
 * first, not partway into `HighlightsAndOverview`'s own content.
 *
 * `id="trip-hero"` on the root `<header>` — this element is never
 * `position: sticky`, so its `getBoundingClientRect()` always reflects
 * its true scroll position, unlike `<TabNav>` right after it (which,
 * once stuck, reports its *pinned* viewport position instead). TabNav
 * reads this element's bottom edge to find its own true natural-flow
 * top regardless of whether it's currently stuck — see its own comment.
 */
export function TripHeader({ trip }: { trip: PackageDetail }) {
  const galleryImages = trip.heroImages.map((src, index) => ({
    src,
    alt:
      index === 0
        ? `${trip.title} — lead photo`
        : `${trip.title} — photo ${index + 1}`,
  }));

  return (
    <header id="trip-hero" className="[background:linear-gradient(#064a70_0,#064a70_94px,transparent_94px)]">
      {/*
       * Client-requested narrower gallery (2026-09-02) — was near-full-bleed
       * per the original Figma spec (only ~9px inset from the page edge),
       * now pulled in to the same max-w-360/64px-margin container every
       * other section on this page uses, instead of breaking out past it.
       */}
      {/*
       * `mt-[5px]` — client-requested extra gap between the navbar and
       * the gallery (2026-10-02, "increase by 4,5 pixel"). Margin rather
       * than padding so the sm:/lg: fixed heights below still describe
       * the gallery itself.
       */}
      <div className="mx-auto w-full pt-5 max-w-360 px-6 sm:h-[360px] md:px-16 lg:h-[540px]">
        <ImageGallery
          images={galleryImages}
          className="h-full"
        />
      </div>
    </header>
  );
}
