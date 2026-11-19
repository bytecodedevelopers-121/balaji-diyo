"use client";

import { tripHref } from "@/lib/trip-href";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { destinationDropdown as staticDestinationDropdown, type DestinationDropdownData } from "@/config/navigation";
import { loadRegionTrips } from "@/features/trips/api/load-region-trips";
import type { Trip } from "@/features/trips/types/trip.types";
import { fallbackImage, toTitleCase, tripMeta } from "@/lib/menu-utils";
import { cn } from "@/lib/utils";
import { useHeaderPanelTop } from "./useHeaderPanelTop";

interface Region {
  title: string;
  href: string;
}

/** Sample trips carry activity categories; API trips don't, so only samples are filtered to trekking here. */
function isTrek(trip: Trip): boolean {
  const categories = (trip as { categories?: unknown }).categories;
  // API packages carry category objects here (not activity keys) — only sample trips can be filtered this way.
  if (!Array.isArray(categories) || !categories.every((entry) => typeof entry === "string")) return true;
  return categories.includes("trekking");
}

/**
 * "Trekking and Hiking" nav item: the trigger plus a mega-menu panel styled
 * like the Destinations menu — the regions of the default destination on the
 * left, the selected region's trekking packages beside them, and a photo
 * preview of the package under the pointer. Regions come from the same
 * destination data as the Destinations menu and their packages are loaded
 * from the API (or the sample trips while the database is empty), so the two
 * menus always agree. Portaled under the header; Esc or a click outside closes it.
 */
export function TrekkingMenu({
  className,
  data = staticDestinationDropdown,
}: {
  className?: string;
  data?: DestinationDropdownData;
}) {
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Trip | null>(null);
  const [regionTrips, setRegionTrips] = useState<Record<string, Trip[]>>({});
  const loading = useRef(new Set<string>());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const top = useHeaderPanelTop(open, triggerRef);

  // The default country's real regions (the entries that carry a package count).
  const country = data.categories.find((category) => category.active) ?? data.categories[0];
  const regions: Region[] = (country?.subCategories ?? [])
    .flatMap((sub) => sub.subSubCategories)
    .filter((region) => region.packageCount !== undefined)
    .map((region) => ({ title: toTitleCase(region.title), href: region.href }))
    .filter((region, index, all) => all.findIndex((other) => other.href === region.href) === index);

  // The same region can arrive twice under different links. Show each name once,
  // keeping the copy that has packages (the first one until counts have loaded).
  const packageCount = (region: Region) => (regionTrips[region.href] ?? []).filter(isTrek).length;
  const displayRegions = regions.reduce<Region[]>((acc, region) => {
    const name = region.title.trim().toLowerCase();
    const existingIndex = acc.findIndex((other) => other.title.trim().toLowerCase() === name);
    if (existingIndex === -1) acc.push(region);
    else if (packageCount(region) > packageCount(acc[existingIndex])) acc[existingIndex] = region;
    return acc;
  }, []);

  const active = displayRegions.find((region) => region.href === activeHref) ?? displayRegions[0] ?? null;
  const trips = active ? (regionTrips[active.href] ?? null) : null;
  const treks = (trips ?? []).filter(isTrek);
  const preview = hovered ?? treks[0] ?? null;

  useEffect(() => {
    if (!open) return;
    for (const region of regions) {
      if (regionTrips[region.href] !== undefined || loading.current.has(region.href)) continue;
      loading.current.add(region.href);
      void loadRegionTrips(region.href, region.title).then((loaded) =>
        setRegionTrips((prev) => ({ ...prev, [region.href]: loaded })),
      );
    }
    // `regions` is rebuilt every render; its hrefs are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, regionTrips, regions.map((region) => region.href).join("|")]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const previewImage = preview?.imageUrl || fallbackImage(preview?.title ?? "trekking");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1 border-b-2 pb-0.5 text-body-l font-medium whitespace-nowrap text-brand-neutral-000 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-sun",
          open ? "border-logo-sun" : "border-transparent",
          className,
        )}
      >
        Trekking and Hiking
        <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open
        ? createPortal(
            <div
              id={panelId}
              ref={panelRef}
              role="region"
              aria-label="Trekking and hiking menu"
              className="pointer-events-none fixed inset-x-0 z-40 w-full px-4 min-[768px]:px-10 min-[1120px]:px-16"
              style={{ top: top ?? 100 }}
            >
              <div className="pointer-events-auto mx-auto w-full max-w-[1440px] overflow-hidden rounded-[6px] bg-[#064a70] text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-7 py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-playfair-display text-[24px] font-bold">Trekking and Hiking</span>
                    <span className="text-[11px] font-bold tracking-[0.14em] text-logo-sun uppercase">
                      · Himalayan treks, region by region
                    </span>
                  </div>
                  <Link
                    href="/trekking-routes-in-nepal"
                    onClick={() => setOpen(false)}
                    className="text-[12px] font-bold tracking-[0.12em] text-logo-sun uppercase hover:opacity-80"
                  >
                    View all treks →
                  </Link>
                </div>

                <div className="grid max-h-[min(470px,calc(100dvh-230px))] grid-rows-[minmax(0,1fr)] min-[1120px]:grid-cols-[230px_minmax(0,1fr)_280px]">
                  <div className="destination-scroll overflow-y-auto border-white/10 px-5 py-6 min-[1120px]:border-r">
                    <p className="mb-3 text-[11px] font-bold tracking-[0.14em] text-white/55 uppercase">Regions</p>
                    <ul className="flex flex-col gap-1">
                      {displayRegions.map((region) => {
                        const isActive = region.href === active?.href;
                        const loaded = regionTrips[region.href];
                        const count = loaded ? loaded.filter(isTrek).length : 0;
                        return (
                          <li key={region.href}>
                            <button
                              type="button"
                              onMouseEnter={() => {
                                setActiveHref(region.href);
                                setHovered(null);
                              }}
                              onFocus={() => {
                                setActiveHref(region.href);
                                setHovered(null);
                              }}
                              onClick={() => {
                                setActiveHref(region.href);
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
                                  "font-playfair-display block text-[18px] leading-snug font-bold",
                                  isActive ? "text-logo-sun" : "text-white group-hover:text-logo-sun",
                                )}
                              >
                                {region.title}
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

                  <div className="destination-scroll overflow-y-auto px-6 py-6">
                    {active ? (
                      <>
                        <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-3">
                          <p className="font-playfair-display text-[20px] font-bold">{active.title}</p>
                          <Link
                            href={active.href}
                            onClick={() => setOpen(false)}
                            className="shrink-0 text-[11px] font-bold tracking-[0.12em] text-logo-sun uppercase hover:opacity-80"
                          >
                            View all →
                          </Link>
                        </div>
                        {trips === null ? (
                          <p className="mt-5 text-[14px] text-white/60">Loading packages…</p>
                        ) : treks.length === 0 ? (
                          <p className="mt-5 text-[14px] text-white/60">No packages listed here yet.</p>
                        ) : (
                          <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 min-[768px]:grid-cols-2">
                            {treks.map((trek) => (
                              <li key={trek.id}>
                                <Link
                                  href={tripHref(trek.slug)}
                                  onClick={() => setOpen(false)}
                                  onMouseEnter={() => setHovered(trek)}
                                  onFocus={() => setHovered(trek)}
                                  className="group block"
                                >
                                  <span className="font-playfair-display block text-[18px] leading-snug font-bold group-hover:text-logo-sun">
                                    {trek.title}
                                  </span>
                                  {tripMeta(trek) ? (
                                    <span className="mt-0.5 block text-[11px] font-bold tracking-[0.08em] text-white/50 uppercase">
                                      {tripMeta(trek)}
                                    </span>
                                  ) : null}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <p className="text-[14px] text-white/60">No regions listed yet.</p>
                    )}
                  </div>

                  <Link
                    href={preview ? tripHref(preview.slug) : (active?.href ?? "/trekking-routes-in-nepal")}
                    onClick={() => setOpen(false)}
                    className="group relative hidden min-h-[320px] overflow-hidden min-[1120px]:block"
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
                      <span className="font-playfair-display block text-[26px] leading-tight font-bold">
                        {preview?.title ?? "Explore our treks"}
                      </span>
                      {preview && tripMeta(preview) ? (
                        <span className="mt-2 block text-[12px] font-bold tracking-[0.1em] text-logo-sun uppercase">
                          {tripMeta(preview)}
                        </span>
                      ) : null}
                      <span className="mt-3 block text-[12px] font-bold tracking-[0.12em] uppercase">Open the journey →</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
