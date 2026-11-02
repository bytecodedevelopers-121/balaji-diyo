"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
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
} from "@/config/navigation";

interface MobileNavPanelProps {
  solid: boolean;
  variant?: "dark" | "light";
  onSearch?: () => void;
  /**
   * Real, admin-editable Destination taxonomy (category → sub-category →
   * sub-sub-category → package) from `getHeaderNavData()` — the exact
   * same data desktop's `DestinationDropdown` renders. FIXED 2026-09-03
   * (user-reported: "Tibet and Bhutan not displayed" in this panel) —
   * this component used to hardcode only Nepal's own sub-content
   * (`NEPAL_LINKS`/`TREKKING_REGIONS`) plus two dead-end links for
   * Tibet/Bhutan, so however much real content an admin curated for
   * those categories in the Menu module, this panel never reflected it
   * — unlike the desktop mega-menu, which always read the live data.
   * Defaults to `config/navigation.ts`'s static content so this panel
   * still renders exactly as before if a caller doesn't fetch it.
   */
  destinationDropdown?: DestinationDropdownData;
  /** Same real About data desktop's `AboutDropdown` renders. */
  aboutDropdown?: AboutDropdownData;
}

/** Which sub-category's own drill-down screen is showing, if any. */
interface Drilldown {
  category: DestinationCategory;
  subCategory: DestinationSubCategory;
}

export function MobileNavPanel({
  solid,
  variant = "dark",
  onSearch,
  destinationDropdown = staticDestinationDropdown,
  aboutDropdown = staticAboutDropdown,
}: MobileNavPanelProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [screen, setScreen] = useState<"main" | "drilldown">("main");
  const [drilldown, setDrilldown] = useState<Drilldown | null>(null);
  // Whichever category is curated `active` starts expanded (Nepal, in the
  // static/sampled data) — same convention `build-navigation.ts`'s own
  // `activeIndex` uses for the desktop mega-menu, since neither the real
  // `MenuItem` tree nor the static fallback has an explicit "default open"
  // field of its own.
  // Auto-expand every category that actually has sub-content (2026-09-03,
  // direct request: Nepal/Tibet/Bhutan should all start open in this
  // panel) — previously an accordion (`openCategory: string | null`) that
  // only ever let one category be open at a time, defaulting to whichever
  // one was curated `active` (Nepal). Multi-open by default now; a
  // category can still be individually collapsed/re-expanded via its own
  // chevron, it's just no longer exclusive with its siblings. Tibet/Bhutan
  // have no curated sub-categories yet (`config/navigation.ts`), so they
  // still render as plain links either way — this only visibly changes
  // once a category besides Nepal gets real sub-content.
  const defaultOpenCategories = destinationDropdown.categories
    .filter((category) => category.subCategories.length > 0)
    .map((category) => category.label);
  const [openCategories, setOpenCategories] = useState<string[]>(defaultOpenCategories);
  const { isOpen, toggle, close, panelId, triggerRef, panelRef } =
    useMenuDisclosure(closeButtonRef);

  function closeMenu() {
    setScreen("main");
    setDrilldown(null);
    setOpenCategories(defaultOpenCategories);
    setAboutOpen(false);
    close();
  }

  function openSearch() {
    closeMenu();
    onSearch?.();
  }

  function toggleMenu() {
    if (!isOpen) {
      setScreen("main");
      setDrilldown(null);
      setOpenCategories(defaultOpenCategories);
    }
    toggle();
  }

  function openDrilldown(category: DestinationCategory, subCategory: DestinationSubCategory) {
    setDrilldown({ category, subCategory });
    setScreen("drilldown");
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
        {/* Visible "Menu" label beside the icon (2026-09-07 direct
            request) — the button's own `aria-label="Menu"` above already
            covers the accessible name, so this is purely a sighted-user
            affordance; same color logic as the icon's `invert` above
            (light variant is always on a light bar; dark variant flips
            between the transparent-over-hero white and the scrolled-solid
            near-black). */}
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
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                aria-label="Close menu overlay"
                tabIndex={-1}
                onClick={closeMenu}
                className="absolute inset-0 bg-black/65"
              />
              <div
                id={panelId}
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                className="absolute inset-y-0 right-0 flex w-[calc(100%-2px)] max-w-[360px] flex-col overflow-hidden border-2 border-[#5d5d5d] bg-white font-poppins text-[#303030]"
              >
                <div className="flex h-[56px] shrink-0 items-center justify-between px-[14px]">
                  <Link
                    href="/"
                    aria-label="Joyful Trekking Pvt. Ltd. — Home"
                    onClick={closeMenu}
                    className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#078cbf]"
                  >
                    <Logo onLight />
                  </Link>
                  <div className="flex items-center gap-[18px]">
                    <button
                      type="button"
                      onClick={openSearch}
                      aria-label="Search trips"
                      className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#078cbf]"
                    >
                      <Search aria-hidden="true" className="size-[17px]" strokeWidth={2} />
                    </button>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={closeMenu}
                      aria-label="Close menu"
                      className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#078cbf]"
                    >
                      <X aria-hidden="true" className="size-[17px]" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {screen === "main" ? (
                  <MainMenu
                    categories={destinationDropdown.categories}
                    openCategories={openCategories}
                    onToggleCategory={(label) =>
                      setOpenCategories((prev) =>
                        prev.includes(label)
                          ? prev.filter((open) => open !== label)
                          : [...prev, label],
                      )
                    }
                    onOpenDrilldown={openDrilldown}
                    onNavigate={closeMenu}
                    about={aboutDropdown}
                    aboutOpen={aboutOpen}
                    onToggleAbout={() => setAboutOpen((open) => !open)}
                  />
                ) : drilldown ? (
                  <SubCategoryDrilldown
                    category={drilldown.category}
                    subCategory={drilldown.subCategory}
                    onBack={() => setScreen("main")}
                    onNavigate={closeMenu}
                  />
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

interface MainMenuProps {
  categories: DestinationCategory[];
  openCategories: string[];
  onToggleCategory: (label: string) => void;
  onOpenDrilldown: (category: DestinationCategory, subCategory: DestinationSubCategory) => void;
  onNavigate: () => void;
  about: AboutDropdownData;
  aboutOpen: boolean;
  onToggleAbout: () => void;
}

function MainMenu({ categories, openCategories, onToggleCategory, onOpenDrilldown, onNavigate, about, aboutOpen, onToggleAbout }: MainMenuProps) {
  return (
    <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-[14px] pb-8">
      {categories.map((category) => (
        <CategorySection
          key={category.label}
          category={category}
          isOpen={openCategories.includes(category.label)}
          onToggle={() => onToggleCategory(category.label)}
          onOpenDrilldown={onOpenDrilldown}
          onNavigate={onNavigate}
        />
      ))}

      <div>
        <button
          type="button"
          aria-expanded={aboutOpen}
          onClick={onToggleAbout}
          className="flex min-h-[39px] w-full items-center justify-between border-b border-[#e7e7e7] py-2 text-left text-[18px] font-medium"
        >
          About
          {aboutOpen ? (
            <ChevronUp aria-hidden="true" className="size-[14px]" strokeWidth={1.5} />
          ) : (
            <ChevronDown aria-hidden="true" className="size-[14px]" strokeWidth={1.5} />
          )}
        </button>
        {aboutOpen ? (
          <div className="pb-[5px] pl-[8px] text-[18px] text-[#777]">
            {about.columns.map((column) => (
              <div key={column.heading}>
                <p className="pt-2 text-[14px] font-semibold uppercase tracking-wide text-[#f36f21]">{column.heading}</p>
                {column.links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={onNavigate} className="flex min-h-[32px] items-center">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        {/* Contact sits in the desktop header next to Destination/About but
            isn't part of `menuNavigation` (the overlay's extra-links list),
            so on phones it was missing entirely. */}
        <Link
          href="/contact"
          onClick={onNavigate}
          className="flex min-h-[39px] items-center border-b border-[#e7e7e7] py-2 text-[18px] font-medium"
        >
          Contact
        </Link>
        {menuNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            // "Travel blogs" opens in a new tab (2026-09-09, explicit
            // user direction, same as every real link in
            // `DestinationDropdown.tsx`/`MobileMenu.tsx` — see
            // `DestinationDropdown`'s own doc comment) — every other item
            // here still navigates the current tab as before.
            {...(item.href === "/blog"
              ? { target: "_blank", rel: "noopener noreferrer" }
              : null)}
            onClick={onNavigate}
            className="flex min-h-[39px] items-center border-b border-[#e7e7e7] py-2 text-[18px] font-medium"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

interface CategorySectionProps {
  category: DestinationCategory;
  isOpen: boolean;
  onToggle: () => void;
  onOpenDrilldown: (category: DestinationCategory, subCategory: DestinationSubCategory) => void;
  onNavigate: () => void;
}

/**
 * One Destination category (Nepal/Tibet/Bhutan/...). A category with no
 * curated sub-categories yet renders as a plain link to its own page —
 * same "Coming soon"-tier honesty `DestinationDropdown.tsx` uses on
 * desktop, rather than a chevron implying an expand that has nothing to
 * reveal. A category that does have real sub-categories expands/collapses
 * exactly like "Nepal" always has, whichever category it is.
 *
 * Nepal/Tibet/Bhutan all share this same orange header color now
 * (2026-09-03, direct request) — previously only the curated `active`
 * category (Nepal) got the orange highlight while its siblings sat in
 * plain black, which read as if Tibet/Bhutan were secondary. Both render
 * branches below use the same `CATEGORY_HEADER_CLASS` regardless of
 * `category.active`.
 */
const CATEGORY_HEADER_CLASS =
  "flex h-[39px] items-center border-b border-[#e7e7e7] text-[18px] font-medium text-[#f36f21]";

function CategorySection({ category, isOpen, onToggle, onOpenDrilldown, onNavigate }: CategorySectionProps) {
  if (category.subCategories.length === 0) {
    return (
      <Link
        href={category.viewAllHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={CATEGORY_HEADER_CLASS}
      >
        {category.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={cn("w-full justify-between text-left", CATEGORY_HEADER_CLASS)}
      >
        {category.label}
        {isOpen ? (
          <ChevronUp aria-hidden="true" className="size-[14px]" strokeWidth={1.5} />
        ) : (
          <ChevronDown aria-hidden="true" className="size-[14px]" strokeWidth={1.5} />
        )}
      </button>

      {isOpen ? (
        <div className="pb-[5px] pl-[8px] text-[18px] text-[#777]">
          {category.subCategories.map((subCategory) =>
            subCategory.subSubCategories.length > 0 ? (
              <button
                key={subCategory.label}
                type="button"
                onClick={() => onOpenDrilldown(category, subCategory)}
                className="flex min-h-[32px] w-full items-center justify-between text-left"
              >
                {subCategory.label}
                <ChevronRight aria-hidden="true" className="size-[13px]" strokeWidth={1.5} />
              </button>
            ) : (
              <Link
                key={subCategory.label}
                href={subCategory.viewAllHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onNavigate}
                className="flex min-h-[32px] items-center justify-between"
              >
                {subCategory.label}
                <ChevronRight aria-hidden="true" className="size-[13px]" strokeWidth={1.5} />
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

interface SubCategoryDrilldownProps {
  category: DestinationCategory;
  subCategory: DestinationSubCategory;
  onBack: () => void;
  onNavigate: () => void;
}

/**
 * A sub-category's own sub-sub-category/package grid — generic version
 * of what used to be a component hardcoded to Nepal's "Trekking Routes"
 * alone (`TREKKING_REGIONS`), reachable now from any category's any
 * sub-category that has real `subSubCategories` (Tibet/Bhutan included,
 * whenever an admin curates that content for them).
 */
function SubCategoryDrilldown({ category, subCategory, onBack, onNavigate }: SubCategoryDrilldownProps) {
  const heading = `${subCategory.label} in ${category.label}`;

  return (
    <div className="flex-1 overflow-y-auto px-[14px] pb-8 text-[18px] text-[#666]">
      <button type="button" onClick={onBack} className="flex min-h-[31px] items-center gap-2 text-[#777]">
        <ArrowLeft aria-hidden="true" className="size-[14px]" strokeWidth={1.5} />
        Back
      </button>
      <div className="flex min-h-[34px] items-center justify-between gap-4 border-b border-[#e7e7e7] py-1.5 text-[#111]">
        <span className="font-semibold">{heading}</span>
        <Link
          href={subCategory.viewAllHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex items-center gap-2 font-medium text-[#f36f21]"
        >
          View All
          <ArrowRight aria-hidden="true" className="size-[14px]" strokeWidth={1.5} />
        </Link>
      </div>
      <nav aria-label={heading}>
        {subCategory.subSubCategories.map((region) => (
          <section key={region.title}>
            <Link
              href={region.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              className="flex min-h-[32px] items-center justify-center border-b border-[#e7e7e7] py-1 text-center font-semibold text-[#008bc1]"
            >
              {region.title}
            </Link>
            <ul className="py-[2px]">
              {region.packages.map((pkg, index) => (
                <li key={`${region.title}-${pkg.href}-${index}`}>
                  <Link
                    href={pkg.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onNavigate}
                    className="flex min-h-[28px] items-center py-1 leading-[22px]"
                  >
                    {pkg.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  );
}
