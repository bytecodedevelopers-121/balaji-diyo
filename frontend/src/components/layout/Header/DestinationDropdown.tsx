"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  destinationDropdown as staticDestinationDropdown,
  type DestinationDropdownData,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
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

  return createPortal(
    <div
      id={panelId}
      ref={panelRef}
      role="region"
      aria-label="Destination menu"
      className={cn(
        // `fixed`, not `absolute` (2026-09-07 — see
        // `useHeaderPanelTop.ts`'s own doc comment for the full history):
        // `absolute` was tried first, positioned via a one-time
        // document-relative measurement so scrolling wouldn't force-close
        // the panel — but `Header.tsx`'s own root is itself
        // `fixed`/`sticky`, so that measurement drifted out of sync with
        // the header on the very next scroll, leaving the panel floating
        // over unrelated page content. `fixed` can't drift (it's
        // viewport-relative by definition); `useHeaderPanelTop` now keeps
        // `top` continuously synced to the header's real position instead
        // of snapshotting it once, which also means the panel still
        // follows the header down and out of view on a hide-triggering
        // scroll rather than floating disconnected — no force-close
        // needed either way.
        "pointer-events-none fixed inset-x-0 z-40 w-full px-4 min-[768px]:px-10 min-[1120px]:px-16",
        panelTopClassName,
      )}
      style={measuredTop != null ? { top: measuredTop } : undefined}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-[1760px] items-stretch gap-6 rounded-[6px] bg-brand-neutral-000 px-7 py-5 shadow-[0_12px_40px_rgba(6,74,112,0.28)]">
        {/* Countries — hover/focus selects which country's trip types show. */}
        <div className="destination-dropdown-group sticky top-0 flex w-[250px] shrink-0 flex-col gap-1 self-stretch rounded-[4px] bg-[#e0ecf5] px-[18px] py-3.5">
          {categories.map((category) => {
            const isActive = category.label === activeCategory.label;
            return (
              <button
                key={category.label}
                type="button"
                onMouseEnter={() => hoverCategory(category.label)}
                onFocus={() => hoverCategory(category.label)}
                className={cn(
                  "rounded-[4px] px-4 py-3 text-center text-[18px] whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-brand-neutral-000 text-logo-navy-dark"
                    : "text-brand-neutral-800 hover:text-logo-navy-dark",
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Trip types for the active country, as headings with their
            regions/packages beneath — flowing into 3 columns, scrolling
            when taller than the viewport. */}
        <div className="destination-dropdown-group destination-scroll max-h-[min(440px,calc(100dvh-230px))] min-w-0 flex-1 overflow-y-auto pr-4">
          {activeCategory.subCategories.length ? (
            <div className="grid grid-cols-1 gap-x-10 min-[768px]:grid-cols-2 min-[1280px]:grid-cols-3">
              {splitIntoColumns(activeCategory.subCategories).map((column, columnIndex) => (
              <div key={columnIndex}>
              {column.map((sub) => (
                <div key={sub.label} className="mb-4">
                  <Link
                    href={sub.viewAllHref}
                    onClick={onClose}
                    className="block text-[19px] leading-tight font-medium text-[#d98a00] transition-opacity hover:opacity-80"
                  >
                    {sub.label}
                  </Link>
                  <ul className="mt-1 flex flex-col">
                    {sub.subSubCategories.map((region) => (
                      <li key={region.title}>
                        <Link
                          href={region.href}
                          onClick={onClose}
                          className="block py-[5px] text-[16px] leading-snug text-brand-neutral-900 transition-colors hover:text-logo-navy"
                        >
                          {toTitleCase(region.title)}
                          {(region.packageCount ?? region.packages.length) > 0 ? (
                            <span className="text-[13px] text-logo-navy">
                              {" "}
                              - {region.packageCount ?? region.packages.length} Packages
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              </div>
              ))}
            </div>
          ) : (
            activeCategory.links?.length ? (
              <ul className="grid grid-cols-1 gap-x-10 min-[768px]:grid-cols-2 min-[1280px]:grid-cols-3">
                {activeCategory.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block py-[7px] text-[16px] leading-snug text-brand-neutral-900 transition-colors hover:text-logo-navy"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-start justify-between gap-6">
                <span className="text-body-l text-brand-neutral-600">Coming soon</span>
                <Link
                  href={activeCategory.viewAllHref}
                  onClick={onClose}
                  className="text-body-l font-medium text-logo-navy hover:opacity-80"
                >
                  View all {activeCategory.label} trips
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Splits a list into consecutive pairs — used to lay a sub-category's
 *  `subSubCategories` out as the source's own two-row, two-column grid
 *  (see that grid's own comment on why this isn't a plain CSS grid: the
 *  row divider only appears under the first row, not every row
 *  boundary). */
/** "EVEREST REGION" -> "Everest Region" (source data is all-caps). */
function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

/** Roughly 22 rows (heading + items) per column; groups stay whole. */
const ROWS_PER_COLUMN = 22;

function splitIntoColumns<T extends { subSubCategories: unknown[] }>(groups: T[]): T[][] {
  const columns: T[][] = [[]];
  let rows = 0;
  for (const group of groups) {
    const size = group.subSubCategories.length + 1;
    if (rows > 0 && rows + size > ROWS_PER_COLUMN) {
      columns.push([]);
      rows = 0;
    }
    columns[columns.length - 1].push(group);
    rows += size;
  }
  return columns;
}
