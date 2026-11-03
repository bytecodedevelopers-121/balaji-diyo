"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  destinationDropdown as staticDestinationDropdown,
  type DestinationCategory,
  type DestinationDropdownData,
} from "@/config/navigation";
import { getCategoriesTrips, getRegionPackages } from "@/features/trips/api/get-region-packages";
import { searchTrips } from "@/features/trips/api/search-trips";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { sampleTripsForCountry, sampleTripsForRegion } from "@/lib/sample-trips";
import { TRIP_CATEGORIES } from "@/config/trip-categories";
import type { Trip } from "@/features/trips/types/trip.types";
import { cn } from "@/lib/utils";
import { DestinationSearch } from "./DestinationSearch";
import { useHeaderPanelTop } from "./useHeaderPanelTop";

gsap.registerPlugin(useGSAP);

interface DestinationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  /** The "Destination" nav trigger — used to exclude it from the
   *  outside-click check below (clicking the trigger itself toggles
   *  the panel via its own handler, it shouldn't also count as an
   *  "outside" click that closes what that same click just opened). */
  triggerRef: RefObject<HTMLElement | null>;
  panelId: string;
  /** How far below the header the panel starts. Same pattern/reasoning
   *  as `MobileMenu`'s own `panelTopClassName` prop: this component has
   *  no way to measure the caller's rendered header height itself.
   *  Tailwind `top-*` class only. */
  panelTopClassName: string;
  /** Real, admin-editable content from `getHeaderNavData()` (see
   *  `features/navigation/lib/build-navigation.ts`) — defaults to
   *  `config/navigation.ts`'s static Figma-sampled content. */
  data?: DestinationDropdownData;
}

/**
 * "Destination" header dropdown — an exact reproduction of Figma node
 * 18:189 ("Homepage - Dropdown - Destination"): a full-width white
 * mega-menu panel over a 4-level taxonomy — category (country) →
 * sub-category (trip type) → sub-sub-category (region) → package
 * (individual trek) — sourced from `destinationDropdown` in
 * `@/config/navigation.ts` (see that config's own doc comment for what
 * is/isn't confirmed content at each tier).
 *
 * Hovering (or focusing, for keyboard users) a category reveals its
 * sub-categories; hovering/focusing a sub-category reveals its own
 * sub-sub-categories + packages in the content column. Categories are
 * still pure hover-triggers, not links themselves (they just pick which
 * sub-categories column to show) — but sub-categories are real links now
 * too (FIXED 2026-09-03, user-reported: clicking "Destination -> Nepal ->
 * Trekking Routes" did nothing; see that tier's own render comment
 * below for why), same as the two leaf-ward tiers (sub-sub-categories
 * and packages) always were. A category with no confirmed sub-categories
 * (e.g. Tibet/Bhutan, until curated) still shows a "Coming soon"
 * placeholder there rather than silently falling back to Nepal's own
 * data; a sub-category with no sub-sub-categories/packages yet (e.g.
 * Tours, Peak Climbing, or a curated-but-still-empty leaf like Tibet's
 * "Mt. Kailash Tour") renders that content column empty instead — its
 * own header row already has a real "View All" link, so there's nothing
 * to caveat (dropped 2026-09-04, explicit user direction — see that
 * tier's own render comment below).
 *
 * Every real link in this panel (sub-category, region, package, and
 * "View All") opens in a new tab (`target="_blank"` + `rel="noopener
 * noreferrer"`) as of 2026-09-09, explicit user direction — clicking a
 * destination shouldn't navigate the tab this mega-menu itself lives
 * on. `onClick={onClose}` still fires either way, so the panel closes
 * behind the newly opened tab instead of staying stuck open on the
 * original one.
 *
 * Portaled to `document.body` for the same reason as `MobileMenu.tsx`
 * and `MobileNavPanel.tsx`: the trigger sits inside a `.nav_link`
 * element that GSAP's entrance animation gives a `transform` on mount,
 * which would otherwise redefine the containing block for this panel's
 * `fixed` positioning.
 *
 * Deliberately NOT a modal dialog (no `aria-modal`, no scroll lock, no
 * stolen initial focus, unlike `useMenuDisclosure`'s full-screen-panel
 * behavior): this is a disclosure widget sitting below the header, not
 * a takeover — the rest of the page stays interactive while it's open,
 * scrolling included (direct feedback: scrolling with this open used to
 * force-close it outright, removed — see `Header.tsx`'s own comment on
 * its scroll handler). Closes on Escape, on an outside click, and
 * whenever a sub-sub-category or package link inside is activated (a
 * real navigation, so keeping the panel open past that point would just
 * be stale).
 *
 * Entrance/exit animation (GSAP, desktop-only — the trigger this
 * renders under only exists in Header's `min-[1120px]:flex` desktop
 * nav, so this never mounts below that breakpoint in the first place):
 * the panel fades + slides down into place while its 5 top-level
 * groups (categories / divider / sub-categories / divider / content)
 * stagger in underneath it, and reverses symmetrically on close —
 * same `mounted`/`isOpen` split as `MobileMenu.tsx`'s own identical
 * problem: `isOpen` (controlled by Header, drives Escape/outside-click/
 * scroll-close above) flips to `false` immediately, but the panel
 * stays mounted and in the DOM until the exit tween's `onComplete`
 * calls `setMounted(false)` — without that split the close animation
 * would never actually be visible, just an instant unmount.
 *
 * `mounted` starts `false` and is only ever flipped `true` by the
 * render-phase sync below (never inside an effect), so `document.body`
 * — `createPortal`'s target — is still never reached during this
 * Client Component's own server render (Next.js renders "use client"
 * components on the server too, where `document` doesn't exist): the
 * very first render is always `mounted === false` in both
 * environments, so the portal branch is unreachable there regardless
 * of `isOpen`.
 */
export function DestinationDropdown({
  isOpen,
  onClose,
  triggerRef,
  panelId,
  panelTopClassName,
  data = staticDestinationDropdown,
}: DestinationDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(isOpen);
  // See useHeaderPanelTop's own doc comment — replaces the stale
  // `panelTopClassName` value below whenever the header's real on-screen
  // position is known (i.e. as soon as this actually opens).
  const measuredTop = useHeaderPanelTop(isOpen, triggerRef);

  const { categories } = data;
  const defaultCategory =
    categories.find((category) => category.active) ?? categories[0];

  // Which category/sub-category is currently revealed — defaults to
  // the sampled node's own active pair (Nepal → Trekking Routes) and
  // updates on hover/focus. Two pieces of state (not one combined
  // selection) because hovering a *category* has to re-derive which
  // sub-category to show (that category's own `active` one, or its
  // first, or none) rather than keeping whatever sub-category label
  // happened to be hovered under the *previous* category.
  const [hoveredCategoryLabel, setHoveredCategoryLabel] = useState(
    defaultCategory.label,
  );

  // Reset back to the default pair every time the panel closes, so
  // reopening it doesn't land on whatever was last hovered. A
  // render-phase adjustment (React's documented pattern for resetting
  // state when a value changes: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // rather than a `useEffect`, so it doesn't trigger a cascading extra
  // render the way calling `setState` synchronously inside an effect
  // body would — same pattern Header.tsx uses for its own
  // close-on-route-change reset.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      // Mounting is the other half of this same render-phase sync (see
      // `mounted`'s own declaration above) — flipping it here, not in
      // an effect, means the very first paint after a click already
      // has the panel in the DOM (at its GSAP-driven hidden starting
      // state below) instead of one extra frame of nothing.
      setMounted(true);
    } else {
      setHoveredCategoryLabel(defaultCategory.label);
    }
  }

  const activeCategory =
    categories.find((category) => category.label === hoveredCategoryLabel) ??
    defaultCategory;
  function hoverCategory(label: string) {
    setHoveredCategoryLabel(label);
  }

  // Regions of the active country (across its trip types). Clicking one shows
  // its packages; they come from the menu when it lists them, otherwise from
  // the API by the region's slug (cached per region).
  const regionList = activeCategory.subCategories.flatMap((sub) =>
    sub.subSubCategories.map((region) => ({ ...region, group: sub.label })),
  );
  // Real regions only — the menu also lists individual tours (no package count) in the same tier, which are links not regions.
  const browseRegions = regionList.filter((region, index) => region.packageCount !== undefined && regionList.findIndex((other) => other.href === region.href) === index);
  const [selectedRegionHref, setSelectedRegionHref] = useState<string | null>(null);
  const selectedRegion = regionList.find((region) => region.href === selectedRegionHref) ?? null;
  const regionHref = selectedRegion?.href ?? null;
  const menuPackages = selectedRegion?.packages ?? [];
  const [regionTrips, setRegionTrips] = useState<Record<string, Trip[]>>({});
  const regionLoaded = regionHref !== null && regionTrips[regionHref] !== undefined;

  // Load every region's packages as soon as the menu opens, so the counts shown are real
  // (not the menu's static numbers) and picking a region is instant.
  const loadingRegions = useRef(new Set<string>());
  useEffect(() => {
    if (!isOpen) return;
    for (const region of browseRegions) {
      const href = region.href;
      if (region.packages.length > 0 || regionTrips[href] !== undefined || loadingRegions.current.has(href)) continue;
      loadingRegions.current.add(href);
      const title = region.title;
      getRegionPackages(href.replace(/^\/+|\/+$/g, ""))
        // No such category on the API — fall back to a title search ("Everest Region" -> "Everest").
        .then((trips) =>
          trips.length > 0 ? trips : searchTrips(title.replace(/\b(region|treks?|from|trekking)\b/gi, "").trim() || title),
        )
        // Empty database — show the sample trips for this region, like the rest of the site.
        .then((trips) => (trips.length === 0 && SHOW_SAMPLE_DATA ? sampleTripsForRegion(title) : trips))
        .catch(() => (SHOW_SAMPLE_DATA ? sampleTripsForRegion(title) : []))
        .then((trips) => setRegionTrips((prev) => ({ ...prev, [href]: trips })));
    }
  }, [isOpen, browseRegions, regionTrips]);


  // The package under the pointer drives the preview panel on the right.
  // Items that already carry a photo use it; menu-only items look their trip
  // up by title (debounced, cached).
  const [hovered, setHovered] = useState<PackageItem | null>(null);
  const [previews, setPreviews] = useState<Record<string, Trip | null>>({});
  // Every package that belongs to the active country — fetched from the
  // country's own category plus its trip types and regions (cached per country).
  const [countryTrips, setCountryTrips] = useState<Record<string, Trip[]>>({});
  const countryLabel = activeCategory.label;
  const countryLoaded = countryTrips[countryLabel] !== undefined;
  // Load every country's trips when the menu opens, so each country's journey count is real.
  const loadingCountries = useRef(new Set<string>());
  useEffect(() => {
    if (!isOpen) return;
    for (const category of categories) {
      const label = category.label;
      if (countryTrips[label] !== undefined || loadingCountries.current.has(label)) continue;
      loadingCountries.current.add(label);
      getCategoriesTrips(categorySlugs(category))
        // Empty database — show the sample trips assigned to this country, like the rest of the site.
        .then((trips) => (trips.length === 0 && SHOW_SAMPLE_DATA ? sampleTripsForCountry(label) : trips))
        .catch(() => (SHOW_SAMPLE_DATA ? sampleTripsForCountry(label) : []))
        .then((trips) => setCountryTrips((prev) => ({ ...prev, [label]: trips })));
    }
  }, [isOpen, categories, countryTrips]);

  // The packages shown: the whole country, or just the selected region.
  const countryItems = (countryTrips[countryLabel] ?? []).map(toPackageItem);
  const packageItems: PackageItem[] = selectedRegion
    ? menuPackages.length > 0
      ? menuPackages.map((pkg) => ({ title: pkg.label, href: pkg.href, meta: "", image: null }))
      : (regionHref ? (regionTrips[regionHref] ?? []) : []).map(toPackageItem)
    : countryItems;
  const packagesLoading = selectedRegion
    ? menuPackages.length === 0 && !regionLoaded
    : !countryLoaded;
  // Activity category filter (Trekking and Hiking, Climbing and Expedition, ...). Sample trips carry their
  // categories; API trips are matched against the category's own package list, fetched on demand.
  const [chosenCategory, setChosenCategory] = useState<string | null>(null);
  const categoryCounts: Record<string, number> = Object.fromEntries(
    TRIP_CATEGORIES.map((category) => [category.key, countryItems.filter((item) => item.categories?.includes(category.key)).length]),
  );
  // Until one is clicked, the first category that has packages in this country is selected.
  const categoryKey = chosenCategory ?? (TRIP_CATEGORIES.find((category) => categoryCounts[category.key] > 0)?.key ?? TRIP_CATEGORIES[0].key);
  const [categoryIds, setCategoryIds] = useState<Record<string, string[]>>({});
  const activeTripCategory = TRIP_CATEGORIES.find((category) => category.key === categoryKey) ?? TRIP_CATEGORIES[0];
  const needsCategoryIds = packageItems.some((item) => item.id && !item.categories);

  useEffect(() => {
    if (!isOpen || !activeTripCategory || !needsCategoryIds || categoryIds[activeTripCategory.key]) return;
    const controller = new AbortController();
    getRegionPackages(activeTripCategory.href.replace(/^\/+|\/+$/g, ""), { signal: controller.signal, perPage: 100 })
      .then((trips) => setCategoryIds((prev) => ({ ...prev, [activeTripCategory.key]: trips.map((trip) => trip.id) })))
      .catch(() => {
        if (!controller.signal.aborted) setCategoryIds((prev) => ({ ...prev, [activeTripCategory.key]: [] }));
      });
    return () => controller.abort();
  }, [isOpen, activeTripCategory, needsCategoryIds, categoryIds]);

  const visibleItems = activeTripCategory
    ? packageItems.filter((item) =>
        item.categories
          ? item.categories.includes(activeTripCategory.key)
          : item.id
            ? (categoryIds[activeTripCategory.key] ?? []).includes(item.id)
            : false,
      )
    : packageItems;

  // The regions (Everest, Annapurna, ...) belong to the Trekking and Hiking category.
  const trekkingCategory = TRIP_CATEGORIES[0];
  const regionsVisible = browseRegions.length > 0 && categoryKey === trekkingCategory.key;

  // How many packages a region really has (within the selected category), not the menu's static number.
  const regionCount = (region: { href: string; packages: unknown[] }) => {
    const trips = regionTrips[region.href];
    if (!trips) return region.packages.length;
    return trips.filter((trip) => {
      const categories = (trip as { categories?: string[] }).categories;
      return !categories || categories.includes(categoryKey);
    }).length;
  };

  // Countries with neither regions nor trips fall back to the menu's plain link list.
  const showPackages = browseRegions.length > 0 || !countryLoaded || countryItems.length > 0;

  // Countries listed only as plain links (no API trips) still preview on hover.
  const firstLink = activeCategory.links?.[0];
  const previewItem =
    hovered ??
    visibleItems[0] ??
    (firstLink ? { title: firstLink.label, href: firstLink.href, meta: "", image: null } : null);
  const previewKey = previewItem && !previewItem.image ? previewItem.title : null;
  const previewHref = previewItem?.href ?? null;

  useEffect(() => {
    if (!isOpen || !previewKey || !previewHref) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchTrips(previewKey, { signal: controller.signal })
        .then((trips) => {
          const match = trips.find((trip) => previewHref.endsWith(`/${trip.slug}`)) ?? trips[0] ?? null;
          setPreviews((prev) => (previewKey in prev ? prev : { ...prev, [previewKey]: match }));
        })
        .catch(() => {
          // Aborted or offline — keep the default photo.
        });
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isOpen, previewKey, previewHref]);

  useGSAP(
    () => {
      if (!panelRef.current) return;

      const panel = panelRef.current;
      const groups = gsap.utils.toArray<HTMLElement>(
        ".destination-dropdown-group",
        panel,
      );
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (isOpen) {
        if (prefersReducedMotion) {
          gsap.set(panel, { autoAlpha: 1, y: 0 });
          gsap.set(groups, { autoAlpha: 1, y: 0 });
          return;
        }

        gsap.set(panel, { autoAlpha: 0, y: -20 });
        gsap.set(groups, { autoAlpha: 0, y: 16 });
        gsap
          .timeline()
          .to(panel, {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            ease: "power3.out",
          })
          .to(
            groups,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.06,
              ease: "power3.out",
            },
            "-=0.22",
          );
      } else if (mounted) {
        // Closing — only reachable once the panel has actually mounted
        // (see `mounted`'s own doc comment); `onComplete` is what
        // actually removes it from the DOM afterward.
        if (prefersReducedMotion) {
          setMounted(false);
          return;
        }

        gsap
          .timeline({ onComplete: () => setMounted(false) })
          .to(groups, {
            autoAlpha: 0,
            y: -10,
            duration: 0.18,
            stagger: 0.03,
            ease: "power2.in",
          })
          .to(
            panel,
            { autoAlpha: 0, y: -14, duration: 0.22, ease: "power2.in" },
            "-=0.1",
          );
      }
    },
    { dependencies: [isOpen], scope: panelRef },
  );

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen, onClose, triggerRef]);

  // `mounted`, not `isOpen`: see `mounted`'s own doc comment — this
  // stays rendered through the close tween above, only actually
  // unmounting once that tween's `onComplete` fires.
  if (!mounted) return null;

  const previewTrip = previewKey ? (previews[previewKey] ?? null) : null;
  const previewImage = previewItem?.image || previewTrip?.imageUrl || fallbackImage(previewItem?.title ?? countryLabel);
  const previewTitle = previewItem?.title ?? `Explore ${activeCategory.label}`;
  const previewMeta =
    previewItem?.meta ||
    (previewTrip
      ? [
          previewTrip.duration ? `${previewTrip.duration} ${(previewTrip.durationType ?? "Days").toUpperCase()}` : null,
          previewTrip.priceFrom ? `FROM US$${previewTrip.priceFrom.toLocaleString()}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "");

  function selectCountry(label: string) {
    hoverCategory(label);
    setChosenCategory(null);
    setSelectedRegionHref(null);
    setHovered(null);
  }

  return createPortal(
    <div
      id={panelId}
      ref={panelRef}
      role="region"
      aria-label="Destination menu"
      className={cn(
        // `fixed` and kept in sync with the header by `useHeaderPanelTop`
        // (see its own doc comment for why `absolute` drifted).
        "pointer-events-none fixed inset-x-0 z-40 w-full px-4 min-[768px]:px-10 min-[1120px]:px-16",
        panelTopClassName,
      )}
      style={measuredTop != null ? { top: measuredTop } : undefined}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[1440px] overflow-hidden rounded-[6px] bg-[#064a70] text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
        <div className="destination-dropdown-group flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-7 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span aria-hidden="true" className="h-px w-8 bg-logo-sun" />
            <span className="font-playfair-display text-[24px] font-bold">Explore {activeCategory.label}</span>
            <span className="text-[11px] font-bold tracking-[0.14em] text-logo-sun uppercase">
              · Ten handcrafted journeys, one joyful crew
            </span>
          </div>
          <Link
            href={activeCategory.viewAllHref}
            onClick={onClose}
            className="text-[12px] font-bold tracking-[0.12em] text-logo-sun uppercase hover:opacity-80"
          >
            View all journeys →
          </Link>
        </div>

        <div
          className={cn(
            // The single row must be capped at the grid's max height (`minmax(0,1fr)`) so a tall column scrolls
            // inside itself instead of spilling over — and blocking clicks on — the search bar below.
            "grid max-h-[min(470px,calc(100dvh-300px))] grid-rows-[minmax(0,1fr)]",
            !showPackages && "min-[1120px]:grid-cols-[190px_minmax(0,1fr)_280px]",
            showPackages && regionsVisible && "min-[1120px]:grid-cols-[170px_200px_220px_minmax(0,1fr)_250px]",
            showPackages && !regionsVisible && "min-[1120px]:grid-cols-[170px_200px_minmax(0,1fr)_250px]",
          )}
        >
          {/* Countries. */}
          <div className="destination-dropdown-group flex flex-col gap-1 overflow-y-auto border-white/10 px-5 py-6 min-[1120px]:border-r">
            <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-white/55 uppercase">Where?</p>
            {categories.map((category) => {
              const isActive = category.label === activeCategory.label;
              const count = countryTrips[category.label]?.length ?? 0;
              return (
                <button
                  key={category.label}
                  type="button"
                  onMouseEnter={() => selectCountry(category.label)}
                  onFocus={() => selectCountry(category.label)}
                  onClick={() => selectCountry(category.label)}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <span className="font-playfair-display block text-[19px] leading-tight font-bold">{category.label}</span>
                  {count > 0 ? (
                    <span className="mt-0.5 block text-[11px] font-bold tracking-[0.1em] text-white/50 uppercase">
                      {count} {count === 1 ? "Journey" : "Journeys"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {showPackages ? (
            <>
              {/* Categories — what kind of trip; the regions and packages follow the selected one. */}
              <div className="destination-dropdown-group destination-scroll overflow-y-auto border-white/10 px-5 py-6 min-[1120px]:border-r">
                <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-white/55 uppercase">Category</p>
                <ul className="flex flex-col gap-1">
                  {TRIP_CATEGORIES.map((category) => {
                    const isActive = category.key === categoryKey;
                    const count = categoryCounts[category.key];
                    return (
                      <li key={category.key}>
                        <button
                          type="button"
                          onClick={() => {
                            setChosenCategory(category.key);
                            if (category.key !== trekkingCategory.key) setSelectedRegionHref(null);
                            setHovered(null);
                          }}
                          aria-pressed={isActive}
                          className={cn(
                            "group block w-full rounded-md px-3 py-2 text-left transition-colors",
                            isActive ? "bg-white/10" : "hover:bg-white/5",
                          )}
                        >
                          <span
                            className={cn(
                              "font-playfair-display block text-[16px] leading-snug font-bold",
                              isActive ? "text-logo-sun" : "text-white group-hover:text-logo-sun",
                            )}
                          >
                            {category.label}
                          </span>
                          {count > 0 ? (
                            <span className="mt-0.5 block text-[11px] font-bold tracking-[0.08em] text-white/50 uppercase">
                              {count} {count === 1 ? "Package" : "Packages"}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Regions — only for Trekking and Hiking. "All" shows every trekking package of the country. */}
              {regionsVisible ? (
                <div className="destination-dropdown-group destination-scroll overflow-y-auto border-white/10 px-5 py-6 min-[1120px]:border-r">
                  <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-logo-sun uppercase">{trekkingCategory.label}</p>
                  <ul className="flex flex-col gap-1">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegionHref(null);
                          setHovered(null);
                        }}
                        aria-pressed={!selectedRegion}
                        className="group block w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-white/5"
                      >
                        <span
                          className={cn(
                            "font-playfair-display block text-[18px] leading-snug font-bold",
                            !selectedRegion ? "text-logo-sun" : "text-white group-hover:text-logo-sun",
                          )}
                        >
                          All {countryLabel}
                        </span>
                        {categoryCounts[categoryKey] > 0 ? (
                          <span className="mt-0.5 block text-[11px] font-bold tracking-[0.08em] text-white/50 uppercase">
                            {categoryCounts[categoryKey]} {categoryCounts[categoryKey] === 1 ? "Package" : "Packages"}
                          </span>
                        ) : null}
                      </button>
                    </li>
                    {browseRegions.map((region) => {
                      const isSelected = region.href === regionHref;
                      const count = regionCount(region);
                      return (
                        <li key={region.href}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRegionHref(region.href);
                              setHovered(null);
                            }}
                            aria-pressed={isSelected}
                            className="group block w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-white/5"
                          >
                            <span
                              className={cn(
                                "font-playfair-display block text-[18px] leading-snug font-bold",
                                isSelected ? "text-logo-sun" : "text-white group-hover:text-logo-sun",
                              )}
                            >
                              {toTitleCase(region.title)}
                            </span>
                            {count > 0 ? (
                              <span className="mt-0.5 block text-[11px] font-bold tracking-[0.08em] text-white/50 uppercase">
                                {count} {count === 1 ? "Package" : "Packages"}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {/* Packages — the whole country, or the selected region. */}
              <div
                className={cn(
                  "destination-dropdown-group destination-scroll overflow-y-auto px-6 py-6",
                )}
              >
                <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-3">
                  <p className="font-playfair-display text-[20px] font-bold">
                    {selectedRegion ? toTitleCase(selectedRegion.title) : `${countryLabel} packages`}
                  </p>
                  <Link
                    href={selectedRegion?.href ?? activeTripCategory?.href ?? activeCategory.viewAllHref}
                    onClick={onClose}
                    className="shrink-0 text-[11px] font-bold tracking-[0.12em] text-logo-sun uppercase hover:opacity-80"
                  >
                    View all →
                  </Link>
                </div>
                {packagesLoading ? (
                  <p className="mt-5 text-[14px] text-white/60">Loading packages…</p>
                ) : visibleItems.length === 0 ? (
                  <p className="mt-5 text-[14px] text-white/60">
                    {activeTripCategory ? `No ${activeTripCategory.label} packages here yet.` : "No packages listed here yet."}
                  </p>
                ) : (
                  <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 min-[768px]:grid-cols-2">
                    {visibleItems.map((item) => (
                      <li key={`${item.href}-${item.title}`}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          onMouseEnter={() => setHovered(item)}
                          onFocus={() => setHovered(item)}
                          className="group block"
                        >
                          {item.tag ? (
                            <span
                              className={cn(
                                "mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] uppercase",
                                item.tag === "Best Seller" && "bg-logo-sun text-logo-navy-dark",
                                item.tag === "Featured Trip" && "bg-[#1fb86a] text-white",
                                item.tag === "Inspiration Trip" && "bg-white/90 text-logo-navy-dark",
                              )}
                            >
                              {item.tag}
                            </span>
                          ) : null}
                          <span className="font-playfair-display block text-[18px] leading-snug font-bold group-hover:text-logo-sun">
                            {item.title}
                          </span>
                          {item.meta ? (
                            <span className="mt-0.5 block text-[11px] font-bold tracking-[0.08em] text-white/50 uppercase">
                              {item.meta}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="destination-dropdown-group destination-scroll overflow-y-auto px-6 py-6">
              {activeCategory.links?.length ? (
                <ul className="grid grid-cols-1 gap-x-8 gap-y-4 min-[768px]:grid-cols-2">
                  {activeCategory.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        onMouseEnter={() => setHovered({ title: link.label, href: link.href, meta: "", image: null })}
                        onFocus={() => setHovered({ title: link.label, href: link.href, meta: "", image: null })}
                        className="font-playfair-display block text-[18px] leading-snug font-bold hover:text-logo-sun"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start justify-between gap-6">
                  <span className="text-[16px] text-white/60">Coming soon</span>
                  <Link href={activeCategory.viewAllHref} onClick={onClose} className="text-[14px] font-semibold text-logo-sun hover:opacity-80">
                    View all {activeCategory.label} trips
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Preview of the package under the pointer (the first one by default). */}
          <Link
            href={previewItem?.href ?? selectedRegion?.href ?? activeCategory.viewAllHref}
            onClick={onClose}
            className="destination-dropdown-group group relative hidden min-h-[320px] overflow-hidden min-[1120px]:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CMS photo of unknown size */}
            <img
              key={previewImage}
              src={previewImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#064a70] via-[#064a70]/25 to-transparent" />
            <span className="absolute top-5 left-5 rounded-full border border-white/40 bg-black/30 px-3 py-1 text-[10px] font-bold tracking-[0.14em] uppercase backdrop-blur-sm">
              {hovered ? "Journey" : "Featured journey"}
            </span>
            <span className="absolute inset-x-6 bottom-6">
              <span className="font-playfair-display block text-[26px] leading-tight font-bold">{previewTitle}</span>
              {previewMeta ? <span className="mt-2 block text-[12px] font-bold tracking-[0.1em] text-logo-sun uppercase">{previewMeta}</span> : null}
              <span className="mt-3 block text-[12px] font-bold tracking-[0.12em] uppercase">Open the journey →</span>
            </span>
          </Link>
        </div>

        <div className="destination-dropdown-group border-t border-white/10 px-6 py-5">
          <DestinationSearch onNavigate={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Photos used when a menu entry has none of its own — picked by name, so each package gets a different, stable one. */
const FALLBACK_IMAGES = [
  "/images/journey/trek.jpg",
  "/images/trips/featured-annapurna-trek.jpg",
  "/images/journey/climb.jpg",
  "/images/hero/hero-3.jpeg",
  "/images/hero/12.jpeg",
  "/images/hero/hero-4.jpeg",
  "/images/cta/gokyo-lake-yak-wide.jpg",
  "/images/journey/tour.jpg",
  "/images/hero/hero-2.jpeg",
  "/images/journey/heli.jpg",
];

function fallbackImage(key: string): string {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

/** A trip as one menu row: title, "14 DAYS · FROM US$1,450" caption and its own photo. */
function toPackageItem(trip: Trip): PackageItem {
  return {
    title: trip.title,
    href: `/${trip.slug}`,
    meta: [
      trip.duration ? `${trip.duration} ${(trip.durationType ?? "Days").toUpperCase()}` : null,
      trip.priceFrom ? `FROM US$${trip.priceFrom.toLocaleString()}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    image: trip.imageUrl ?? null,
    id: trip.id,
    categories: (trip as { categories?: string[] }).categories,
    tag: trip.isPopular ? "Best Seller" : trip.isFeatured ? "Featured Trip" : "Inspiration Trip",
  };
}

interface PackageItem {
  title: string;
  href: string;
  /** Small caption under the title: length and price, when known. */
  meta: string;
  /** The package's own photo, when the API supplied one. */
  image: string | null;
  /** API trip id, for matching against a category's package list. */
  id?: string;
  /** Activity category keys, for sample trips. */
  categories?: string[];
  /** Which group it belongs to: Best Seller, Featured Trip or Inspiration Trip (API trips only). */
  tag?: string;
}

/** The category slugs behind a country: itself, its trip types and its real regions. */
function categorySlugs(category: DestinationCategory): string[] {
  const hrefs = [
    category.viewAllHref,
    ...category.subCategories.flatMap((sub) => [
      sub.viewAllHref,
      ...sub.subSubCategories.filter((region) => region.packageCount !== undefined).map((region) => region.href),
    ]),
  ];
  return [
    ...new Set(
      hrefs
        .map((href) => href.replace(/^\/+|\/+$/g, ""))
        .filter((slug) => slug && !slug.startsWith("#") && !slug.includes("/") && !slug.includes(":")),
    ),
  ];
}

/** "EVEREST REGION" -> "Everest Region" (source data is all-caps). */
function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}
