"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronRight, Search, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppGlyph } from "@/components/ui/WhatsAppButton";
import { loadRegionTrips } from "@/features/trips/api/load-region-trips";
import type { Trip } from "@/features/trips/types/trip.types";
import { toTitleCase, tripMeta } from "@/lib/menu-utils";
import { tripHref } from "@/lib/trip-href";
import { cn } from "@/lib/utils";
import { useMenuDisclosure } from "./useMenuDisclosure";
import {
  destinationDropdown as staticDestinationDropdown,
  aboutDropdown as staticAboutDropdown,
  menuNavigation,
  type AboutDropdownData,
  type DestinationCategory,
  type DestinationDropdownData,
  type DestinationSubCategory,
  type DestinationSubSubCategory,
} from "@/config/navigation";

interface MobileNavPanelProps {
  solid: boolean;
  variant?: "dark" | "light";
  onSearch?: () => void;
  /**
   * Real, admin-editable Destination taxonomy (category → sub-category →
   * sub-sub-category → package) from `getHeaderNavData()` — the exact same
   * data desktop's `DestinationDropdown` renders. Defaults to
   * `config/navigation.ts`'s static content.
   */
  destinationDropdown?: DestinationDropdownData;
  /** Same real About data desktop's `AboutDropdown` renders. */
  aboutDropdown?: AboutDropdownData;
  /** Phone number shown in the contact bar (opens WhatsApp); the bar is skipped without it. */
  phone?: string;
  phoneHref?: string;
  /** The header's "Plan with us" button. */
  ctaLabel?: string;
  ctaHref?: string;
}

/** One level of the menu; the panel keeps a stack of these and slides between them. */
type Screen =
  | { kind: "root" }
  | { kind: "countries" }
  | { kind: "country"; country: DestinationCategory }
  | { kind: "sub"; country: DestinationCategory; sub: DestinationSubCategory }
  | { kind: "about" };

const ROW_CLASS =
  "group flex w-full items-center gap-4 border-b border-white/15 py-[18px] text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-logo-sun";
const TITLE_CLASS = "font-playfair-display min-w-0 flex-1 text-[22px] leading-tight font-bold break-words";

/**
 * Full-screen mobile menu as a stack of single-column screens: the main list
 * (large serif titles with yellow numbers) drills into Destinations →
 * country → trip type → regions and packages, or into About, each with a Back
 * button. Everything is one column, so it holds up on very narrow phones. A
 * contact bar (phone + "Plan with us") stays pinned at the bottom.
 */
export function MobileNavPanel({
  solid,
  variant = "dark",
  onSearch,
  destinationDropdown = staticDestinationDropdown,
  aboutDropdown = staticAboutDropdown,
  phone,
  phoneHref,
  ctaLabel,
  ctaHref,
}: MobileNavPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [stack, setStack] = useState<Screen[]>([{ kind: "root" }]);
  const { isOpen, toggle, close, panelId, triggerRef, panelRef } = useMenuDisclosure(closeButtonRef);

  const screen = stack[stack.length - 1];
  const countries = destinationDropdown.categories;
  // "Trekking and Hiking" on the main list jumps straight to that trip type of the default destination.
  const home = countries.find((category) => category.active && category.subCategories.length > 0) ?? countries[0];
  const trekking = home?.subCategories.find((sub) => /trekking/i.test(sub.label) && sub.subSubCategories.length > 0);

  const push = (next: Screen) => setStack((current) => [...current, next]);
  const back = () => setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
  const resetScreens = () => setStack([{ kind: "root" }]);

  function closeMenu() {
    resetScreens();
    close();
  }

  function openSearch() {
    closeMenu();
    onSearch?.();
  }

  function toggleMenu() {
    if (!isOpen) resetScreens();
    toggle();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label="Menu"
        onClick={toggleMenu}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4",
          variant === "light"
            ? "focus-visible:outline-brand-neutral-900"
            : solid
              ? "focus-visible:outline-brand-neutral-1000"
              : "focus-visible:outline-brand-neutral-000",
        )}
      >
        <Image
          src={variant === "light" ? "/icons/navigation/menu-dark.svg" : "/icons/navigation/menu.svg"}
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className={cn("size-6", variant === "dark" && solid && "invert")}
        />
        {/* Visible "Menu" label beside the icon — the button's own `aria-label="Menu"` covers the accessible name. */}
        <span
          aria-hidden="true"
          className={cn(
            "text-body-m font-medium",
            variant === "light"
              ? "text-brand-neutral-900"
              : solid
                ? "text-brand-neutral-1000"
                : "text-brand-neutral-000",
          )}
        >
          Menu
        </span>
      </button>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 overflow-hidden">
              <div
                id={panelId}
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className="absolute inset-0 flex min-w-0 flex-col overflow-hidden bg-[#064a70] font-poppins text-white"
              >
                {/* Logo-colour stripe (sky → green → sun) across the very top. */}
                <div
                  aria-hidden="true"
                  className="h-[3px] shrink-0 bg-[linear-gradient(90deg,var(--color-logo-sky),var(--color-logo-green),var(--color-logo-sun))]"
                />
                <div className="flex h-[64px] shrink-0 items-center justify-between gap-3 px-5">
                  <Link
                    href="/"
                    aria-label="Joyful Trekking Pvt. Ltd. — Home"
                    onClick={closeMenu}
                    className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-sun"
                  >
                    <span className="block rounded-full ring-2 ring-white">
                      <Logo compact />
                    </span>
                  </Link>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={closeMenu}
                    aria-label="Close menu"
                    className="flex h-10 items-center gap-2 rounded-full border border-white/30 px-4 text-[14px] font-semibold transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-sun"
                  >
                    Close
                    <X aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pt-2 pb-8">
                  {screen.kind === "root" ? (
                    <nav aria-label="Mobile navigation">
                      <button
                        type="button"
                        onClick={openSearch}
                        className="mb-3 flex h-12 w-full items-center gap-3 rounded-full bg-white/10 px-5 text-left text-[15px] text-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-sun"
                      >
                        <Search aria-hidden="true" className="size-[18px] shrink-0 text-logo-sun" strokeWidth={2} />
                        <span className="truncate">Search trips</span>
                      </button>
                      <ul>
                        <NavRow index={1} onClick={() => push({ kind: "countries" })}>
                          Destinations
                        </NavRow>
                        {home && trekking ? (
                          <NavRow index={2} onClick={() => push({ kind: "sub", country: home, sub: trekking })}>
                            Trekking and Hiking
                          </NavRow>
                        ) : null}
                        <NavRow index={3} onClick={() => push({ kind: "about" })}>
                          About
                        </NavRow>
                        {[{ label: "Contact", href: "/contact" }, ...menuNavigation].map((item, index) => (
                          <NavRow
                            key={item.href}
                            index={4 + index}
                            href={item.href}
                            onNavigate={closeMenu}
                          >
                            {item.label}
                          </NavRow>
                        ))}
                      </ul>
                    </nav>
                  ) : (
                    <SubScreen
                      screen={screen}
                      countries={countries}
                      about={aboutDropdown}
                      onBack={back}
                      onPush={push}
                      onNavigate={closeMenu}
                    />
                  )}
                </div>

                {phone && phoneHref ? (
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/15 bg-[#04364f] px-5 py-3.5">
                    <a
                      href={`https://wa.me/${phoneHref.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-sun"
                    >
                      <WhatsAppGlyph className="size-5 shrink-0 text-[#25D366]" />
                      {phone}
                    </a>
                    {ctaLabel && ctaHref ? (
                      <Link
                        href={ctaHref}
                        onClick={closeMenu}
                        className="rounded-pill bg-logo-sun px-5 py-2 text-[14px] font-semibold text-logo-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {ctaLabel}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** One big row: a yellow number, the serif title and an arrow — a button that opens a level, or a link. */
function NavRow({
  index,
  children,
  onClick,
  href,
  external = false,
  onNavigate,
}: {
  index: number;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      <span aria-hidden="true" className="w-7 shrink-0 text-[12px] font-bold tracking-wider text-logo-sun">
        {String(index).padStart(2, "0")}
      </span>
      <span className={TITLE_CLASS}>{children}</span>
      {href ? (
        <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-white/50 group-hover:text-logo-sun" strokeWidth={1.75} />
      ) : (
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-logo-sun" strokeWidth={2} />
      )}
    </>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          // "Travel blogs" opens in a new tab; every other link navigates the current tab.
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
          onClick={onNavigate}
          className={ROW_CLASS}
        >
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={ROW_CLASS}>
          {content}
        </button>
      )}
    </li>
  );
}

/** A smaller row for the deeper levels: serif title with a chevron or an out-arrow. */
function ListRow({
  children,
  onClick,
  href,
  onNavigate,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      <span className="font-playfair-display min-w-0 flex-1 text-[19px] leading-snug font-bold break-words">{children}</span>
      {href ? (
        <ArrowUpRight aria-hidden="true" className="size-[18px] shrink-0 text-white/50 group-hover:text-logo-sun" strokeWidth={1.75} />
      ) : (
        <ChevronRight aria-hidden="true" className="size-[18px] shrink-0 text-logo-sun" strokeWidth={2} />
      )}
    </>
  );
  const className =
    "group flex w-full items-center gap-3 border-b border-white/15 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-logo-sun";

  return (
    <li>
      {href ? (
        <Link href={href} onClick={onNavigate} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {content}
        </button>
      )}
    </li>
  );
}

/**
 * One trekking region on the trip-type screen: its name (a link to the region page)
 * and its packages, loaded from the API (or the sample trips while the database is
 * empty) so each package links straight to its own `/trip/<slug>` page.
 */
function RegionSection({ region, onNavigate }: { region: DestinationSubSubCategory; onNavigate: () => void }) {
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const hasMenuPackages = region.packages.length > 0;

  useEffect(() => {
    if (hasMenuPackages) return;
    let active = true;
    void loadRegionTrips(region.href, region.title).then((loaded) => {
      if (active) setTrips(loaded);
    });
    return () => {
      active = false;
    };
  }, [hasMenuPackages, region.href, region.title]);

  return (
    <section className="border-b border-white/15 py-4">
      <Link
        href={region.href}
        onClick={onNavigate}
        className="flex items-center justify-between gap-3 font-playfair-display text-[19px] font-bold text-logo-sun"
      >
        <span className="min-w-0 break-words">{toTitleCase(region.title)}</span>
        <ArrowUpRight aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={2} />
      </Link>
      {hasMenuPackages ? (
        <ul className="mt-1">
          {region.packages.map((pkg, index) => (
            <li key={`${pkg.href}-${index}`}>
              <Link href={pkg.href} onClick={onNavigate} className="flex min-h-[40px] items-center py-1.5 pl-3 text-[15px] leading-snug text-white/85 break-words">
                {pkg.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : trips === null ? (
        <p className="mt-2 pl-3 text-[14px] text-white/60">Loading packages…</p>
      ) : (
        <ul className="mt-1">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={tripHref(trip.slug)} onClick={onNavigate} className="block py-2 pl-3 text-[15px] leading-snug text-white/90 break-words">
                {trip.title}
                {tripMeta(trip) ? (
                  <span className="mt-0.5 block text-[11px] font-bold tracking-[0.08em] text-white/50 uppercase">{tripMeta(trip)}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface SubScreenProps {
  screen: Exclude<Screen, { kind: "root" }>;
  countries: DestinationCategory[];
  about: AboutDropdownData;
  onBack: () => void;
  onPush: (screen: Screen) => void;
  onNavigate: () => void;
}

/** Every level below the main list: a Back button, the level's title, then its rows. */
function SubScreen({ screen, countries, about, onBack, onPush, onNavigate }: SubScreenProps) {
  let title: string;
  let viewAll: { href: string; label: string } | null = null;
  let body: ReactNode;

  if (screen.kind === "countries") {
    title = "Destinations";
    body = (
      <ul>
        {countries.map((country) =>
          country.subCategories.length > 0 ? (
            <ListRow key={country.label} onClick={() => onPush({ kind: "country", country })}>
              {country.label}
            </ListRow>
          ) : (
            <ListRow key={country.label} href={country.viewAllHref} onNavigate={onNavigate}>
              {country.label}
            </ListRow>
          ),
        )}
      </ul>
    );
  } else if (screen.kind === "country") {
    const { country } = screen;
    title = country.label;
    viewAll = { href: country.viewAllHref, label: `View all ${country.label}` };
    body = (
      <ul>
        {country.subCategories.map((sub) =>
          sub.subSubCategories.length > 0 ? (
            <ListRow key={sub.label} onClick={() => onPush({ kind: "sub", country, sub })}>
              {sub.label}
            </ListRow>
          ) : (
            <ListRow key={sub.label} href={sub.viewAllHref} onNavigate={onNavigate}>
              {sub.label}
            </ListRow>
          ),
        )}
      </ul>
    );
  } else if (screen.kind === "sub") {
    const { country, sub } = screen;
    title = `${sub.label} in ${country.label}`;
    viewAll = { href: sub.viewAllHref, label: "View all" };
    body = (
      <nav aria-label={title}>
        {sub.subSubCategories.map((region) =>
          // Real regions (they carry a package count) list their packages; anything else is a plain link.
          region.packageCount !== undefined || region.packages.length > 0 ? (
            <RegionSection key={region.href} region={region} onNavigate={onNavigate} />
          ) : (
            <ul key={region.href}>
              <ListRow href={region.href} onNavigate={onNavigate}>
                {toTitleCase(region.title)}
              </ListRow>
            </ul>
          ),
        )}
      </nav>
    );
  } else {
    title = "About";
    body = (
      <div>
        {about.columns.map((column) => (
          <section key={column.heading} className="border-b border-white/15 py-4">
            <p className="text-[11px] font-bold tracking-[0.16em] text-logo-sun uppercase">{column.heading}</p>
            <ul className="mt-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={onNavigate} className="flex min-h-[44px] items-center text-[17px] font-medium break-words">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 items-center gap-2 text-[14px] font-semibold text-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-sun"
      >
        <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
        Back
      </button>
      <h2 className="mt-2 font-playfair-display text-[28px] leading-tight font-bold break-words">{title}</h2>
      {viewAll ? (
        <Link
          href={viewAll.href}
          onClick={onNavigate}
          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold tracking-[0.1em] text-logo-sun uppercase"
        >
          {viewAll.label}
          <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
        </Link>
      ) : null}
      <div className="mt-3">{body}</div>
    </div>
  );
}
