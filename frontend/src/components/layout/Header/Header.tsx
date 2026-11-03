"use client";

import { WhatsAppGlyph } from "@/components/ui/WhatsAppButton";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { COMPANY_LINKS, MoreMenu } from "./MoreMenu";
import { TrekkingMenu } from "./TrekkingMenu";
import { AnnouncementBar } from "./AnnouncementBar";
import { Logo } from "@/components/ui/Logo";
import {
  headerCta,
  headerNavigation as staticHeaderNavigation,
  destinationDropdown as staticDestinationDropdown,
  aboutDropdown as staticAboutDropdown,
  type NavItem,
  type DestinationDropdownData,
  type AboutDropdownData,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
import { AboutDropdown } from "./AboutDropdown";
import { DestinationDropdown } from "./DestinationDropdown";
import { HeaderSearchInput } from "./HeaderSearchInput";
import { HeaderSearchResults } from "./HeaderSearchResults";
import { SideMenu } from "./SideMenu";
import { MobileNavPanel } from "./MobileNavPanel";
import Image from "next/image";

/** Below this scroll offset, the "dark" variant still counts as "at the
 *  top" (transparent-over-hero). A few px of tolerance, not 0, so
 *  rubber-band overscroll at the very top doesn't flicker the variant. */
const TOP_THRESHOLD_PX = 30;
/**
 * The header only starts auto-hiding once scrolled past this — a small
 * buffer just above `TOP_THRESHOLD_PX`, not a large gap. It doesn't need
 * to be large: `isSolid` below is gated on `!hidden`, so leaving the
 * "dark" variant's transparent top state goes straight to hiding rather
 * than pausing on a visible solid frame first — there's nothing left for
 * a gap to protect against, and the whole point of this pass was to make
 * that hide feel instant instead of staged.
 */
const HIDE_THRESHOLD_PX = 24;
/** Ignore scroll deltas smaller than this (trackpad/wheel jitter) so
 *  `hidden` doesn't flicker on sub-pixel back-and-forth ticks. */
const MIN_DELTA_PX = 8;

interface HeaderProps {
  /**
   * "dark" (default): transparent, fixed overlay on a hero photo while
   * scrolled to the top — white nav text/icons, switching to a solid
   * white header (via CSS `invert` on the fixed white icon assets) once
   * scrolled past the hero. Used on the homepage only.
   * "light": opaque white, in normal document flow (`sticky top-0`) —
   * dark nav text/icons, using the dedicated "-dark" icon assets instead
   * of the invert filter. Used on every secondary page (about-us,
   * why-boundless-adventure, ...), matching both of those
   * design-references (each shows the same opaque white header, not the
   * homepage's transparent one).
   *
   * The logo art is the same in both variants, but its "ADVENTURE"
   * lettering is white in the export and vanishes on a white surface —
   * so the Logo gets `onLight` whenever the header is white (this
   * variant always, "dark" once solid); see Logo.tsx.
   */
  variant?: "dark" | "light";
  /** `siteConfig.name`/`.phone`/`.phoneHref`, passed down from the
   *  enclosing route-group layout (a Server Component) rather than
   *  imported from `@/config/site` here — that module pulls in
   *  `src/lib/env.ts`, which is `server-only`-gated and cannot be
   *  imported by a Client Component. Header needs to be a Client
   *  Component itself for the scroll-direction tracking below;
   *  MobileNavPanel has taken these same values as props from Header
   *  for the same reason since before Header needed to. */
  siteName: string;
  phone: string;
  phoneHref: string;
  /**
   * Real, admin-editable nav content resolved server-side by
   * `getHeaderNavData()` (see `features/navigation/lib/build-navigation.ts`
   * for the live `menu-item` API this replaces `config/navigation.ts`'s
   * hardcoded arrays with, and its own doc comment for the per-slot
   * fallback rules). Each field independently defaults to
   * `config/navigation.ts`'s static content when unpassed, so `Header`
   * still renders exactly as before if a caller doesn't fetch this.
   */
  headerNavigation?: NavItem[];
  destinationDropdown?: DestinationDropdownData;
  aboutDropdown?: AboutDropdownData;
  menuNavigation?: NavItem[];
}

/**
 * Site header with two color variants and one scroll behavior, per
 * direct product feedback (screenshot of a solid header, a request to
 * keep the homepage hero transparent and auto-hide/reveal on scroll,
 * and a follow-up that the solid variant briefly flashing on *every*
 * downward scroll — including the one leaving the homepage's
 * transparent top — read as broken rather than intentional):
 *
 * - **Transparent** — "dark" variant only, and only while scrolled
 *   within `TOP_THRESHOLD_PX` of the top: white text/icons, no
 *   background, `fixed` over the hero image. Matches
 *   design-references/homepage.png and hero-mobile.png.
 * - **Solid** — opaque white background, dark text/icons (the "dark"
 *   variant's nav icon SVGs are fixed `stroke="white"` exports, so this
 *   state runs them through a CSS `invert` filter rather than
 *   commissioning new dark assets; the "light" variant instead always
 *   uses the dedicated "-dark" icon assets and never needs the filter).
 *   Shown on every "light" page always, and on the "dark" page once
 *   scrolled past the hero — but *only while the header is actually
 *   visible* (`isSolid` is gated on `!hidden`, see its own comment):
 *   scrolling down out of the transparent top state hides the header
 *   before it would otherwise turn solid, so leaving the hero reads as
 *   one clean disappearance, not "flashes white, then hides". Scrolling
 *   back up still reveals it solid, matching the screenshot this was
 *   built from.
 *
 * Positioning differs by variant, not by page, to avoid a layout jump:
 * "dark" keeps `fixed` in both its states (nothing else needs the space
 * the header would otherwise reserve — the hero is meant to sit
 * directly under/behind it). "light" uses `sticky top-0` instead, which
 * reserves its own height in normal flow so page content starts below
 * it rather than being covered by a header that would otherwise take up
 * none of the layout.
 *
 * Scroll-direction hide/show (the original UX complaint this all
 * started from — "have to scroll all the way back to the top to see
 * the navbar again"): scrolling down past `HIDE_THRESHOLD_PX` slides it
 * away (`-translate-y-full`); any upward scroll reveals it immediately,
 * regardless of position. This applies to both variants. The
 * transparent top-of-"dark"-page state never hides — it's already the
 * "resting" state a reader lands on, not a bar competing for scroll
 * space.
 *
 * ## Breakpoint — 1120px
 *
 * Checked against both reference screenshots (design-references/
 * homepage.png, a 1440px desktop capture, and hero-mobile.png, a 430px
 * mobile capture) plus the actual rendered content width of this
 * implementation:
 *
 * - The desktop nav cluster (logo + Destination/About/Contact + phone
 *   + gradient CTA, none of which shrink or wrap) has a real minimum
 *   content width of ~1046px including 64px horizontal padding — the
 *   same measurement that ruled out the stock `lg` (1024px) breakpoint.
 * - The mobile header (logo + 2 icons) is comfortably narrow at any
 *   width below that; there's no content-fit pressure pushing the
 *   cutover earlier.
 * - Neither screenshot documents a tablet-width design, so there's no
 *   evidence for a different number — 1120px (measured minimum + ~70px
 *   safety margin) stands. Confirmed via the same E2E no-overflow check
 *   at 375/768/1024/1442px (tests/e2e/homepage.spec.ts).
 */
export function Header({
  variant = "dark",
  siteName,
  phone,
  phoneHref,
  headerNavigation = staticHeaderNavigation,
  destinationDropdown = staticDestinationDropdown,
  aboutDropdown = staticAboutDropdown,
}: HeaderProps) {
  const isDark = variant === "dark";
  // Only used to replay the entrance animation below on route changes
  // within the same route-group layout (Header persists across those
  // navigations rather than remounting).
  const pathname = usePathname();

  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  // True while the homepage hero (`#home-hero`) is still under the bar, so
  // the video keeps showing through it until the next section arrives.
  const [overHero, setOverHero] = useState(true);
  // Reported by the desktop nav's MobileMenu overlay (its own
  // `onOpenChange` prop) — forces the header solid below regardless of
  // scroll position while that overlay is open. Without this, opening
  // it at the top of the homepage left the header in its transparent
  // white-text-over-hero-photo state behind the overlay's own opaque
  // white panel: unreadable, since nothing was forcing the header's
  // nav text to the dark color it'd normally only get once actually
  // scrolled solid. The mobile row's own MobileNavPanel doesn't need
  // this — its trigger and the header bar behind it both stay onscreen
  // next to (not competing with) its slide-in drawer, not blocked by
  // it the way the desktop overlay sits directly behind/around itself.
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  // "Destination" nav item's mega-menu (DestinationDropdown.tsx, Figma
  // node 18:189) — same "force the header solid while open" need as
  // `desktopMenuOpen` above, and the same reasoning: an opaque white
  // panel behind still-white/transparent nav text would be unreadable.
  const [destinationOpen, setDestinationOpen] = useState(false);
  const destinationTriggerRef = useRef<HTMLButtonElement>(null);
  const destinationPanelId = useId();
  // "About" nav item's mega-menu (AboutDropdown.tsx, Figma node
  // 455:4949) — same shape and same "force the header solid while
  // open" need as `destinationOpen` above.
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutTriggerRef = useRef<HTMLButtonElement>(null);
  const aboutPanelId = useId();
  // Header search (Figma node 475:11314, "Homepage - Search" /
  // "Homepage - Search - Active") — same "force the header solid while
  // open" need as `destinationOpen`/`aboutOpen` above (the pill's white
  // background and dark typed text need a solid header behind them,
  // not the "dark" variant's transparent-over-hero state). Query is
  // lifted here (not owned by HeaderSearchInput) because it's rendered
  // twice — once per breakpoint, see the mobile row and desktop nav
  // below — and both copies plus the single portaled
  // HeaderSearchResults all need to stay in sync with the same value.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputId = useId();
  const searchPanelId = useId();

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  const [lastPathname, setLastPathname] = useState(pathname);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    function syncFromScroll() {
      const y = window.scrollY;
      const hero = document.getElementById("home-hero");
      setOverHero(hero ? hero.getBoundingClientRect().bottom > (headerRef.current?.offsetHeight ?? 80) : false);
      // Hysteresis: collapse past 60px, expand again only back under 10px.
      // A single threshold made the bar flip back and forth when the
      // collapse itself nudged the scroll position across it.
      setAtTop((wasAtTop) => (wasAtTop ? y < TOP_THRESHOLD_PX * 2 : y < TOP_THRESHOLD_PX / 3));

      const delta = y - lastScrollYRef.current;
      if (Math.abs(delta) < MIN_DELTA_PX) return; // jitter — wait for it to accumulate

      if (delta > 0 && y > HIDE_THRESHOLD_PX) {
        // The bar stays visible while scrolling (direct request) — only
        // the search results panel closes.
        // Destination/About no longer close on scroll (direct feedback:
        // scrolling with a mega-menu open used to make it vanish
        // outright — it should instead just scroll normally with the
        // page, like ordinary content, not track the viewport). See
        // DestinationDropdown.tsx/AboutDropdown.tsx's own panels, now
        // `absolute` instead of `fixed` for exactly this. Search still
        // closes here — a scroll-tracking search pill wasn't part of
        // this request, left as it was.
        setSearchOpen(false);
        setSearchQuery("");
      } else if (delta < 0) {
        setHidden(false);
      }
      lastScrollYRef.current = y;
    }

    syncFromScroll(); // sync immediately (e.g. a reload that lands mid-page)
    window.addEventListener("scroll", syncFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncFromScroll);
    // Empty deps deliberately: each route-group layout mounts its own
    // Header instance, so there's no cross-route persistence to reset
    // here — this only runs once on this instance's mount. `setHidden`/
    // `setAtTop`/`setSearchOpen`/`setSearchQuery` are all stable setter
    // identities, safe to omit.
  }, []);

  // Route changes always close both mega-menu dropdowns — each is most
  // directly reachable via a link inside its own panel (which also
  // calls this explicitly — see DestinationDropdown.tsx's "View All"
  // and every link in AboutDropdown.tsx), but this covers any other
  // navigation away too (e.g. browser back) so neither ever lingers
  // open on a new page. A render-phase adjustment (React's documented
  // pattern for resetting state when a prop/value changes:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // rather than a `useEffect`, so it doesn't trigger a cascading extra
  // render the way calling `setState` synchronously inside an effect
  // body would.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (destinationOpen) setDestinationOpen(false);
    if (aboutOpen) setAboutOpen(false);
    if (searchOpen) closeSearch();
  }

  const isTransparent = isDark && (atTop || overHero);
  // Gated on `!hidden` too, not just `!isTransparent`: color only ever
  // needs to change at the moment the header is about to be *shown*
  // (revealed on an upward scroll) — while it's hiding on a downward
  // scroll, it stays transparent the whole way, since it's about to be
  // off-screen anyway. Without this, leaving the "dark" variant's
  // transparent top state flipped straight to solid-and-visible for a
  // beat before `hidden` caught up, reading as "turns white, then
  // hides" instead of one clean disappearance.
  //
  // `|| desktopMenuOpen` overrides all of the above while that overlay
  // is open — see its own declaration's comment.
  const isSolid =
    (!isTransparent && !hidden) ||
    desktopMenuOpen ||
    destinationOpen ||
    aboutOpen ||
    searchOpen;

  // The bar is always the logo's navy now (both variants), so every
  // icon/text is the white export — no invert, no "-dark" assets.
  const searchIcon = "/icons/navigation/search.svg";
  const chevronIcon = "/icons/navigation/chevron-down.svg";
  const textClass = "text-brand-neutral-000";
  const outlineClass = "focus-visible:outline-logo-sun";
  const iconClass = "size-5";

  const [brandFirst = "", ...brandRest] = siteName.replace(/\s+pvt\.?\s*ltd\.?$/i, "").split(" ");

  const headerRef = useRef<HTMLElement>(null);

  // Publish the header's real height (it changes when the announcement
  // bar is dismissed) so the hero can pad itself below it.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    // Only publish while at the top: the bar shrinks/collapses on scroll,
    // and the hero's padding follows this value — publishing the shrunken
    // height mid-scroll shifted the page and fed back into the scroll
    // position (visible as the navbar flickering).
    const publish = () => {
      if (window.scrollY > TOP_THRESHOLD_PX * 2) return;
      document.documentElement.style.setProperty("--site-header-h", `${el.offsetHeight}px`);
    };
    publish();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      id="site-header"
      className={cn(
        "z-30 w-full transition-colors duration-300",
        // Over the hero video the bar is see-through (just a soft top fade
        // for legibility); it turns solid once scrolled or a panel opens.
        isTransparent && !isSolid
          ? "bg-gradient-to-b from-[#064a70]/70 to-transparent"
          : "bg-[#064a70]",
        isDark ? "fixed inset-x-0 top-0" : "sticky top-0",
      )}
    >
      {atTop ? <AnnouncementBar /> : null}
      <div className={cn("relative flex w-full items-center justify-between px-6 min-[1120px]:px-16", atTop ? "py-3 min-[1120px]:min-h-[66px] min-[1120px]:py-[7px]" : "py-1.5 min-[1120px]:min-h-[66px] min-[1120px]:py-[7px]")}>
        <div>
          <Link
            href="/"
            aria-label={`${siteName} — Home`}
            className={cn("nav_link flex w-fit shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4", outlineClass)}
          >
            <span className="rounded-full ring-[3px] ring-brand-neutral-000">
              <Logo compact />
            </span>
            <span className="hidden leading-tight min-[480px]:block">
              <span className="font-playfair-display block text-[18px] font-bold text-brand-neutral-000">
                {brandFirst} <span className="text-logo-sun">{brandRest.join(" ")}</span>
              </span>
              <span className="block text-[10px] font-medium tracking-[0.14em] text-white/70 uppercase">
                Nepal · Since 2011
              </span>
            </span>
          </Link>
        </div>

        {/* Mobile — logo + search + hamburger, matching hero-mobile.png.
            Becomes `flex-1` while search is open so the pill (rendered
            in the hamburger's place) has room to grow into — matches
            the desktop nav's own search-open behavior below.
            The icon/hamburger vs. pill halves below stay permanently
            mounted, toggled only by the `hidden` class (not a `{cond &&
            …}` conditional) — see the desktop nav's own comment on why:
            unmounting `.nav_link` elements loses the entrance
            animation's GSAP-applied inline styles for good. */}
        <div
          className={cn(
            "nav_link flex shrink-0 items-center gap-4 min-[1120px]:hidden",
            searchOpen && "min-w-0 flex-1",
          )}
        >
          <div className={cn("flex items-center gap-4", searchOpen && "hidden")}>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search trips"
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Image
                src={searchIcon}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                className={iconClass}
              />
            </button>
            <MobileNavPanel
              solid={false}
              variant="dark"
              onSearch={() => setSearchOpen(true)}
              destinationDropdown={destinationDropdown}
              aboutDropdown={aboutDropdown}
            />
          </div>
          <div className={cn("w-full", !searchOpen && "hidden")}>
            <HeaderSearchInput
              inputId={searchInputId}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onClose={closeSearch}
              className="w-full"
            />
          </div>
        </div>

        {/* Desktop — full nav (1120px+). Clicking the search icon swaps the
            nav-links cluster for the search pill in the same row. Both
            halves stay mounted and are toggled with the `hidden` class. */}
        <nav
          aria-label="Primary"
          className={cn(
            "hidden shrink-0 items-center gap-10 min-[1120px]:flex",
            searchOpen && "min-w-0 flex-1",
          )}
        >
          <div className={cn("flex items-center gap-10", searchOpen && "hidden")}>
            {headerNavigation.filter((item) => item.label !== "Contact").map((item) => {
              // First two items (Destination, About) show a chevron in
              // Figma and both now open real, Figma-accurate mega-menu
              // dropdowns — DestinationDropdown.tsx (node 18:189) and
              // AboutDropdown.tsx (node 455:4949), see navigation.ts.
              // Each gets its own dedicated `<button>` branch below
              // (same shape: portaled, fixed-position, full-width panel)
              // rather than a shared generic mechanism, since both are
              // simple two-state toggles with no meaningfully reusable
              // structure beyond that. Contact (last item) has no
              // chevron and no dropdown — falls through to a plain link.
              const hasChevron = true;
              const isDestination = item.label === "Destination";
              const isAbout = item.label === "About";

              if (isAbout) {
                return (
                  <MoreMenu
                    key={item.href}
                    label="Company"
                    links={COMPANY_LINKS}
                   
                  />
                );
              }

              if (isDestination) {
                const isOpen = isDestination ? destinationOpen : aboutOpen;
                const setOpen = isDestination ? setDestinationOpen : setAboutOpen;
                const triggerRef = isDestination
                  ? destinationTriggerRef
                  : aboutTriggerRef;
                const panelId = isDestination ? destinationPanelId : aboutPanelId;

                return (
                  <Fragment key={item.href}>
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen((open) => !open)}
                    className={cn(
                      "nav_link flex items-center gap-1 border-b-2 pb-0.5 text-body-l font-medium whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2",
                      textClass,
                      outlineClass,
                      // Figma's own small underline ("Vector 10" on both
                      // sampled nodes) under the label while its panel is
                      // open.
                      isOpen ? "border-brand-neutral-800" : "border-transparent",
                    )}
                  >
                    {isAbout ? "Company" : isDestination ? "Destinations" : item.label}
                    <Image
                      src={chevronIcon}
                      alt=""
                      aria-hidden="true"
                      width={16}
                      height={16}
                      className={cn(
                        "size-4 transition-transform",
                        isDark && isSolid && "invert",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isDestination ? (
                    <TrekkingMenu data={destinationDropdown} />
                  ) : null}
                  </Fragment>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav_link flex items-center gap-1 text-body-l font-medium whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2",
                    textClass,
                    outlineClass,
                  )}
                >
                  {item.label}
                  {hasChevron ? (
                    <Image
                      src={chevronIcon}
                      alt=""
                      aria-hidden="true"
                      width={16}
                      height={16}
                      className={cn("size-4", isDark && isSolid && "invert")}
                    />
                  ) : null}
                </Link>
              );
            })}
            <MoreMenu />
            <DestinationDropdown
              isOpen={destinationOpen}
              onClose={() => setDestinationOpen(false)}
              triggerRef={destinationTriggerRef}
              panelId={destinationPanelId}
              panelTopClassName="top-[95px]"
              data={destinationDropdown}
            />
            <AboutDropdown
              isOpen={aboutOpen}
              onClose={() => setAboutOpen(false)}
              triggerRef={aboutTriggerRef}
              panelId={aboutPanelId}
              panelTopClassName="top-[95px]"
              data={aboutDropdown}
            />
          </div>
          <div className={cn("w-full max-w-[400px]", !searchOpen && "hidden")}>
            <HeaderSearchInput
              inputId={searchInputId}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              onClose={closeSearch}
              className="w-full"
            />
          </div>
        </nav>

        <HeaderSearchResults
          isOpen={searchOpen}
          query={searchQuery}
          onClose={closeSearch}
          panelId={searchPanelId}
          panelTopClassName="top-[95px]"
        />

        <div className="hidden shrink-0 items-center gap-7 min-[1120px]:flex">
          {/* The number opens WhatsApp chat (wa.me), not the dialer. */}
          <a
            href={`https://wa.me/${phoneHref.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "nav_link inline-flex items-center gap-2 font-poppins text-body-l font-medium whitespace-nowrap transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2",
              textClass,
              outlineClass,
            )}
          >
            <WhatsAppGlyph className="size-5 shrink-0 text-[#25D366]" />
            {phone}
          </a>
          <Link
            href={headerCta.href}
            className={cn(
              "nav_link rounded-pill bg-logo-sun px-5 py-[9px] text-body-m font-semibold whitespace-nowrap text-logo-navy-dark shadow-[0_6px_18px_rgba(248,192,40,0.35)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2",
              outlineClass,
            )}
          >
            {headerCta.label}
          </Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className={cn("nav_link rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4", textClass, outlineClass)}
          >
            <Heart aria-hidden="true" className="size-6" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search trips"
            className={cn("nav_link rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4", outlineClass)}
          >
            <Image src={searchIcon} alt="" aria-hidden="true" width={20} height={20} className={iconClass} />
          </button>
            {/* Desktop-only: the full-screen Figma-accurate menu overlay
                (MobileMenu.tsx — node 455:6099), sized/positioned for the
                desktop header (20px icon, the node's own sampled size;
                95px panel offset, this header's own rendered height at
                this breakpoint). The mobile row above renders a
                deliberately different component (MobileNavPanel.tsx) —
                see its own doc comment for why the two aren't shared. */}
            <span className="shrink-0">
              <SideMenu
                triggerSizeClassName="size-5"
                onOpenChange={setDesktopMenuOpen}
              />
            </span>
        </div>
      </div>
    </header>
  );
}
