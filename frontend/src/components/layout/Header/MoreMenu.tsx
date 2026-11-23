"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuLink {
  label: string;
  href: string;
}

/** Trekking and Hiking dropdown links (real trek pages, see navigation.ts). */
export const TREKKING_LINKS: MenuLink[] = [
  { label: "Trekking Routes in Nepal", href: "/trekking-routes-in-nepal" },
  { label: "Everest Base Camp Trek", href: "/trip/everest-base-camp-trek" },
  { label: "Annapurna Circuit Trek", href: "/annapurna-circuit-trekking" },
  { label: "Manaslu Circuit Trek", href: "/manaslu-circuit-trek" },
  { label: "Upper Mustang Trek", href: "/upper-mustang-trekking" },
  { label: "Kanchenjunga Base Camp Trek", href: "/kanchenjunga-base-camp-trekking" },
  { label: "Trekking Routes Map", href: "/map" },
];

/** "Company" dropdown links — existing pages (Legal Documents = company documents). */
export const COMPANY_LINKS: MenuLink[] = [
  { label: "About Us", href: "/company/about-us" },
  { label: "Your Company Team", href: "/company/team" },
  { label: "Legal Documents", href: "/company/legal-documents" },
  { label: "Why Guided Travel?", href: "/company/why-guided-travel" },
  { label: "Responsible Travel", href: "/company/responsible-travel" },
  { label: "Partner with Us", href: "/company/partner-with-us" },
  { label: "Terms and Conditions", href: "/company/terms-and-conditions" },
  { label: "Privacy Policy", href: "/company/privacy-policy" },
];

/** Links in the "•••" dropdown. Travel Guides, Affiliate Program and Web
 *  Stories have no dedicated pages yet, so they point at the closest
 *  existing ones — repoint them when those pages exist. */
export const MORE_LINKS: MenuLink[] = [
  { label: "Travel Guides", href: "/travel-guides" },
  { label: "Affiliate Program", href: "/affiliate-program" },
  { label: "Nepal Travel Web Stories", href: "/travel-web-stories" },
  { label: "Nepal Travel Blog", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

/** The "•••" trigger and its small white dropdown card in the desktop nav. */
export function MoreMenu({
  className,
  label,
  links = MORE_LINKS,
}: {
  className?: string;
  /** Text trigger with a chevron; omitted = the "•••" trigger. */
  label?: string;
  links?: MenuLink[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label ?? "More"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center rounded-sm text-brand-neutral-000 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-sun",
          label ? "gap-1 border-b-2 border-transparent pb-0.5 text-body-l font-medium whitespace-nowrap" : "gap-[3px] px-1 py-2",
        )}
      >
        {label ? (
          <>
            {label}
            <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-180")} />
          </>
        ) : (
          <>
            <span className="size-[5px] rounded-full bg-current" />
            <span className="size-[5px] rounded-full bg-current" />
            <span className="size-[5px] rounded-full bg-current" />
          </>
        )}
      </button>
      {open ? (
        <ul
          id={panelId}
          className="absolute top-full left-0 z-50 mt-3 w-[340px] max-w-[calc(100vw-2rem)] rounded-[8px] bg-[#064a70] px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          {links.map((link) => (
            <li key={link.label} className="border-b border-dashed border-white/20 last:border-b-0">
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-[14px] text-[17px] text-white transition-colors hover:text-logo-sun focus-visible:outline-2 focus-visible:outline-logo-sun"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
