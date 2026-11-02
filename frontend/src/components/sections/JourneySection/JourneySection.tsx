import { getCategoryBySlug } from "@/features/trips/api/get-category-by-slug";
import { JourneyCarousel } from "./JourneyCarousel";

/**
 * "Choose Your Adventure" — trip-category picker, transcribed from
 * design-references/homepage.png (y≈950–1540 at the 1440px source
 * width). White background, centered heading (eyebrow + supporting
 * description copy removed, 2026-09-22 direct request — see homepage
 * for the sibling `PopularTripsSection` change made at the same time),
 * followed by an edge-to-edge (no container padding) 4-up photo grid.
 *
 * **Wired to the real old site's own URL pattern, 2026-08-24** — user
 * flagged the real legacy page `boundlessadventure.com/nepal-peak-climbing`
 * and asked for parity. Confirmed live against the migrated DB: real
 * `Category` rows (tagged onto packages via the many-to-many
 * `Package.categories` relation, not the `styleId` FK this section used
 * at first) carry their own real migrated URL slugs matching the old
 * site exactly — `nepal-tour-packages` (30 packages), `nepal-peak-climbing`
 * (8), `nepal-helicopter-tours` (8), each with a real admin-set featured
 * image too. Trekking has no single equivalent (split across 5 real
 * region categories — Everest/Annapurna/Langtang Region Treks,
 * Restricted Area Trekking, Nepal Short Treks) — user's call: the Trek
 * tile links to `/trekking-routes-in-nepal` instead (a real legacy URL
 * already fully built elsewhere in this project), using the Everest
 * Region Treks category purely as a representative photo source.
 *
 * Each tile now shows a real photo (that category's own real featured
 * image, falling back to the original design-reference crop only if a
 * category has none) and links to the real page — resolved through the
 * flat `/<slug>` resolver's "category" content type, same mechanism
 * every other real content type on this site uses
 * (`app/[slug]/resolve-content.ts`), not a made-up nested route.
 *
 * Tile labels ("Nepal Himalaya Treks" / "Nepal Tours" / "Peak Climbing" /
 * "Helicopter Tours"), 2026-09-02 client-requested copy change from the
 * original design-reference labels (Trek / Tour / Climb / Heli), then
 * 2026-09-04 client-requested a further rename of the first two ("Treks"
 * → "Nepal Himalaya Treks", "Tours" → "Nepal Tours"); hrefs and category
 * slugs are unaffected both times.
 */
const TILES = [
  { label: "Nepal Himalaya Treks", imageCategorySlug: "everest-region-treks", href: "/trekking-routes-in-nepal", fallbackImage: "/images/journey/trek.jpg" },
  { label: "Nepal Tours", imageCategorySlug: "nepal-tour-packages", href: "/nepal-tour-packages", fallbackImage: "/images/journey/tour.jpg" },
  { label: "Peak Climbing", imageCategorySlug: "nepal-peak-climbing", href: "/nepal-peak-climbing", fallbackImage: "/images/journey/climb.jpg" },
  { label: "Helicopter Tours", imageCategorySlug: "nepal-helicopter-tours", href: "/nepal-helicopter-tours", fallbackImage: "/images/journey/heli.jpg" },
];

export async function JourneySection() {
  const tiles = await Promise.all(
    TILES.map(async (tile) => {
      const category = await getCategoryBySlug(tile.imageCategorySlug);
      return { ...tile, image: category?.imageUrl ?? tile.fallbackImage };
    }),
  );

  // `py-[50px]`, was `py-16` then `py-14` (2026-09-03, direct request,
  // two passes — see AboutSection.tsx's own comment for the full
  // reasoning on both, including why the second pass is arbitrary px).
  return (
    <section className="bg-brand-neutral-000 py-[2px] sm:py-[25px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-4 px-6 pb-10 text-center md:px-16">
        <h2 className="whitespace-nowrap font-display text-[clamp(24px,7.8vw,32px)] leading-[1.6] font-medium text-brand-neutral-1000 sm:text-display-section">
          Choose Your Adventure
        </h2>
      </div>

      {/*
        Mobile: horizontal scroll (native swipe, plus `JourneyCarousel`'s
        own prev/next buttons — added 2026-09-14, see that component's
        own comment; previously native-swipe-only) instead of wrapping
        into a 2x2 grid. `md:` and up reverts to the original static 4-up
        grid unchanged — all four tiles already fit in one row there, so
        nothing needs to scroll or page.

        Card width was a fixed 314px (Figma spec), which left the next
        card peeking in by only a thin, accidental-looking sliver at
        common phone widths — 2026-09-03, per direct request, switched to
        `calc(100vw-40px)` (viewport minus the row's own 40px total
        left+right padding, 20px each side) so exactly one full card
        fills the view per swipe with no partial next card visible. Height moved from a
        fixed 460px to `aspect-[314/460]` so the card's proportions still
        match the original design at any width. The row's own `py-3`/12px
        padding is unchanged — all `md:`-reset back to the desktop grid's
        original spacing/aspect-ratio sizing.
      */}
      {/*
        `scroll-px-5` alongside the matching `px-5` — CSS scroll-snap
        aligns to `scroll-padding`, not a box's regular `padding`, so
        without this the mandatory snap silently auto-scrolled the row on
        load to flush the first card against the edge, canceling the
        intended margin out entirely (confirmed via a real computed-style
        check: `padding-left` read a value but the first card's actual
        rendered `left` was still 0).

        Was an asymmetric `pl-5`/`pr-2.5` (20px left, 10px right), then
        an even `15px`/`15px` (2026-09-07, "left side margin is high,
        keep it in center") — immediate follow-up ("add margin a little
        bit more on both side") bumped both to `px-5`/20px each.

        `gap-5` (20px, was `gap-2.5`/10px) is load-bearing now, not just
        spacing — confirmed via a real computed-geometry check (Playwright
        at a 390px viewport) that with `px-5`'s 20px right padding and
        the old 10px gap, the *next* card started at x=380, 10px inside
        the 390px-wide viewport, i.e. visibly peeking in exactly the way
        the screenshot showed. The right-padding-caused gap between one
        card's right edge and the viewport edge only ever reaches
        `min(padding-right, gap)` — the container's `padding-right` isn't
        physically enforced between flex items, only after the very last
        one, so a gap smaller than the padding gets silently overridden
        by the next card starting right after it. Widening the gap to
        match `px-5` closes that: card 1 ends, a 20px gap follows, and
        card 2 now starts exactly at the viewport edge (x=390 at this
        width) with zero pixels visible. `gap-2.5` on the far side of
        `md:` is untouched (`md:gap-[9px]`, the static desktop grid).
      */}
      <JourneyCarousel tiles={tiles} />
    </section>
  );
}
