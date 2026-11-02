"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHeaderPanelTop } from "./useHeaderPanelTop";

/**
 * DUMMY CONTENT — regions and their treks for the "Trekking and Hiking"
 * mega-menu. Links are slugified from the trek titles and may not match
 * real package pages yet.
 */
const REGIONS: { label: string; href: string; treks: string[] }[] = [
  {
    label: "Everest Region",
    href: "/everest-region-treks",
    treks: [
      "Everest Base Camp Trek",
      "Everest Base Camp Trek In Comfort",
      "Renjo La Pass Trek",
      "Everest Base Camp Trek by Road",
      "Jiri Everest Base Camp Trek",
      "Mani Rimdu Festival Trek - 2026",
      "Cho La Pass With EBC Trek",
      "12 Days EBC Trek from Kathmandu",
      "Short Everest Base Camp Trek",
      "Everest Marathon Trek",
      "Everest High Passes Trek",
      "Everest Base Camp Trek From Pokhara",
      "Gokyo Lake Trek",
      "Pikey Peak Trek",
      "Luxury Everest Base Camp Trek",
      "Ama Dablam Base Camp Trek",
      "Everest Panorama Trek",
      "Everest Base Camp Trek Return by Helicopter",
    ],
  },
  {
    label: "Annapurna Region",
    href: "/annapurna-region-treks",
    treks: [
      "Annapurna Base Camp Trek",
      "Annapurna Circuit Trek",
      "Ghorepani Poon Hill Trek",
      "Mardi Himal Trek",
      "Annapurna Sanctuary Trek",
      "Khopra Danda Trek",
      "Tilicho Lake Trek",
      "Mustang Trek",
      "Short Annapurna Base Camp Trek",
    ],
  },
  {
    label: "Langtang Region",
    href: "/langtang-region-treks",
    treks: [
      "Langtang Valley Trek",
      "Gosaikunda Lake Trek",
      "Helambu Circuit Trek",
      "Tamang Heritage Trail",
      "Langtang Gosaikunda Helambu Trek",
    ],
  },
  {
    label: "Manaslu Region",
    href: "/manaslu-region-treks",
    treks: ["Manaslu Circuit Trek", "Tsum Valley Trek", "Comfort Manaslu Circuit Trek", "Short Manaslu Trek"],
  },
  {
    label: "Treks From Pokhara",
    href: "/trekking-routes-in-nepal",
    treks: ["Ghorepani Poon Hill Trek", "Mardi Himal Trek", "Dhampus Sarangkot Trek", "Panchase Hill Trek"],
  },
];

function trekHref(title: string): string {
  return `/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

/**
 * "Trekking and Hiking" nav item: the trigger plus a mega-menu panel with
 * a region list on the left and the selected region's treks in three
 * columns on the right. Portaled and positioned under the header like the
 * Destinations menu; Esc or a click outside closes it.
 */
export function TrekkingMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState(REGIONS[0]!.label);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const top = useHeaderPanelTop(open, triggerRef);

  const active = REGIONS.find((region) => region.label === activeLabel) ?? REGIONS[0]!;

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
              <div className="pointer-events-auto mx-auto flex w-full max-w-[1760px] items-stretch gap-6 rounded-[6px] bg-brand-neutral-000 px-7 py-5 shadow-[0_12px_40px_rgba(6,74,112,0.28)]">
                <div className="flex w-[250px] shrink-0 flex-col gap-1 self-stretch rounded-[4px] bg-[#e0ecf5] px-[18px] py-3.5">
                  {REGIONS.map((region) => {
                    const isActive = region.label === active.label;
                    return (
                      <Link
                        key={region.label}
                        href={region.href}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setActiveLabel(region.label)}
                        onFocus={() => setActiveLabel(region.label)}
                        className={cn(
                          "rounded-[4px] px-4 py-3 text-center text-[18px] whitespace-nowrap transition-colors",
                          isActive
                            ? "bg-brand-neutral-000 text-logo-navy-dark"
                            : "text-brand-neutral-800 hover:text-logo-navy-dark",
                        )}
                      >
                        {region.label}
                      </Link>
                    );
                  })}
                </div>

                <ul className="destination-scroll grid max-h-[min(440px,calc(100dvh-230px))] min-w-0 flex-1 grid-cols-1 content-start gap-x-10 overflow-y-auto pr-4 min-[768px]:grid-cols-2 min-[1280px]:grid-cols-3">
                  {active.treks.map((trek) => (
                    <li key={trek}>
                      <Link
                        href={trekHref(trek)}
                        onClick={() => setOpen(false)}
                        className="block py-[10px] text-[16px] leading-snug text-brand-neutral-900 transition-colors hover:text-logo-navy"
                      >
                        {trek}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
