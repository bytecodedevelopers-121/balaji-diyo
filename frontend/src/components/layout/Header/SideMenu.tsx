"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { SocialIcon } from "@/components/ui/ContactIcons";
import { socialLinks } from "@/config/social-links";
import { cn } from "@/lib/utils";

/** "Travel Styles" shortcuts — all existing category pages. */
const TRAVEL_STYLES = [
  { label: "Trekking and Hiking", href: "/trekking-routes-in-nepal" },
  { label: "Climbing and Expedition", href: "/nepal-peak-climbing" },
  { label: "Jungle and Wildlife Safari", href: "/nepal-tour-packages" },
  { label: "Nepal Tours and Holidays", href: "/nepal-tour-packages" },
  { label: "Day Tours and Activities", href: "/nepal-day-tours" },
];

interface SideMenuProps {
  /** Tailwind size classes for the hamburger trigger. */
  triggerSizeClassName?: string;
  /** Fires with the drawer's open state the moment it changes. */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Desktop hamburger menu: a white drawer sliding in from the right with
 * a "Travel Styles" intro, shortcut list, an EXPLORE MORE button and the
 * social icons. Portaled to `document.body` (the trigger sits inside a
 * GSAP-transformed `.nav_link`, which would otherwise become the fixed
 * panel's containing block). Esc, the backdrop and the X all close it,
 * and page scroll is locked while it is open.
 */
export function SideMenu({ triggerSizeClassName = "size-5", onOpenChange }: SideMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  function open() {
    setMounted(true);
    setIsOpen(true);
    onOpenChange?.(true);
  }

  function close() {
    setIsOpen(false);
    setShown(false);
    onOpenChange?.(false);
    triggerRef.current?.focus();
  }

  // Slide in on the frame after mount; unmount once the slide-out ends.
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        setShown(false);
        onOpenChange?.(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onOpenChange]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label="Menu"
        onClick={() => (isOpen ? close() : open())}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-logo-sun",
          triggerSizeClassName,
        )}
      >
        <Image
          src="/icons/navigation/menu.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className={triggerSizeClassName}
        />
      </button>

      {mounted
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <div
                aria-hidden="true"
                onClick={close}
                className={cn(
                  "absolute inset-0 bg-logo-navy-dark/50 transition-opacity duration-300",
                  shown ? "opacity-100" : "opacity-0",
                )}
              />
              <aside
                id={panelId}
                role="dialog"
                aria-modal="true"
                aria-label="Travel styles menu"
                onTransitionEnd={(event) => {
                  if (event.target === event.currentTarget && !isOpen) setMounted(false);
                }}
                className={cn(
                  "absolute inset-y-0 right-0 flex w-[min(380px,100%)] flex-col overflow-y-auto bg-brand-neutral-000 px-12 pt-16 pb-10 shadow-[-8px_0_30px_rgba(6,74,112,0.25)] transition-transform duration-300 ease-out",
                  shown ? "translate-x-0" : "translate-x-full",
                )}
              >
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="absolute top-5 right-5 rounded-sm p-1 text-brand-neutral-1000 focus-visible:outline-2 focus-visible:outline-logo-navy"
                >
                  <X aria-hidden="true" className="size-8" strokeWidth={1.5} />
                </button>

                <h2 className="text-[22px] font-semibold text-logo-navy-dark">Travel Styles</h2>
                <p className="mt-3 text-[17px] leading-snug text-brand-neutral-800">
                  Choose from more than 100 travel experiences, carefully designed by local experts, led by locals, and
                  crafted for you.
                </p>

                <ul className="mt-6 flex flex-col gap-4">
                  {TRAVEL_STYLES.map((style) => (
                    <li key={style.label}>
                      <Link
                        href={style.href}
                        onClick={close}
                        className="flex items-center gap-3 text-[16px] text-brand-neutral-800 transition-colors hover:text-logo-navy focus-visible:outline-2 focus-visible:outline-logo-navy"
                      >
                        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-logo-sun" />
                        {style.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/nepal-tour-packages"
                  onClick={close}
                  className="mt-8 block rounded-[4px] bg-logo-sun py-4 text-center text-[17px] font-bold tracking-wide text-logo-navy-dark uppercase transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
                >
                  Explore More
                </Link>

                <p className="mt-8 text-[18px] text-brand-neutral-800">Connect with Us</p>
                <ul className="mt-3 flex flex-nowrap gap-1.5">
                  {socialLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={link.label}
                        className="flex transition-opacity hover:opacity-80"
                      >
                        <SocialIcon platform={link.label} className="size-8" />
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
