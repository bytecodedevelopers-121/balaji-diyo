"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { menuNavigation as staticMenuNavigation, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface MobileMenuProps {
  /** Whether Header's solid state is active (scrolled past the "dark"
   *  variant's hero, or "light" always) — see Header.tsx's own doc
   *  comment. Only affects the closed trigger icon's color/filter; the
   *  open panel is opaque white either way, so nothing inside it
   *  changes. */
  solid: boolean;
  /** Only affects which closed-state trigger icon asset is used ("dark"
   *  variant: the white export, inverted via `solid`; "light" variant:
   *  the dedicated "-dark" export, never inverted) — the open panel is
   *  the same white surface either way. See Header's own HeaderProps
   *  comment for what each variant means. Defaults to "dark" to match
   *  Header's own default. */
  variant?: "dark" | "light";
  /** Trigger button + icon size — the mobile row's hamburger (24px,
   *  this prop's default) and the desktop nav's hamburger (20px, the
   *  same slot the old decorative icon occupied — see Header.tsx's own
   *  call site) are visually different sizes in Figma. Tailwind `size-*`
   *  class only. */
  triggerSizeClassName?: string;
  /** How far below the header the full-screen panel starts — the
   *  mobile and desktop headers render at different heights (mobile:
   *  `px-6 py-4` padding + a 24px logo/icon row = 56px; desktop:
   *  `px-16 py-6` + the 47px logo = 95px, matching Figma's own "Frame
   *  10" header node at exactly 95px tall), and this component has no
   *  way to measure that itself. Tailwind `top-*` class only. */
  panelTopClassName?: string;
  /** Fires with the panel's logical open state (not the animated
   *  `mounted` one — see this component's own doc comment on that
   *  split) the instant it changes, i.e. on the same click that opens
   *  or starts closing the panel, not after the tween settles. Lets
   *  Header.tsx force itself solid while this overlay is open — on the
   *  homepage's transparent-over-hero header, the overlay's own white
   *  background otherwise sits behind still-white nav text/icons with
   *  nothing forcing the header solid first, unreadable against
   *  whatever hero photo shows through above the panel. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Real, admin-editable content from `getHeaderNavData()` (see
   *  `features/navigation/lib/build-navigation.ts`) — defaults to
   *  `config/navigation.ts`'s static Figma-sampled 8-link list. */
  items?: NavItem[];
}

/**
 * Header's full-screen menu overlay — an exact reproduction of Figma
 * node 455:6099 ("Homepage - Dropdown - Destination"; the frame name is
 * a leftover from an earlier copy/paste, its actual content is this
 * unrelated 8-link takeover menu): a full-viewport white panel with
 * links stacked above the bottom-anchored mountain artwork (rendered in
 * their own source casing — see the `uppercase`-removal note on the
 * link's own `className` below — not forced all-caps).
 * (A rounded floating "mega-menu card" redesign was tried in between —
 * reverted per explicit follow-up feedback asking for the literal Figma
 * layout back.)
 *
 * Header.tsx mounts two independent instances of this component — one
 * in its mobile-only row, one replacing the desktop nav's old
 * decorative hamburger icon — rather than one instance shared across
 * breakpoints, since each is a differently-sized trigger in a different
 * flex layout (nav_link entrance animation, icon color logic) that CSS
 * alone already keeps mutually exclusive (`hidden` / `min-[1120px]:flex`,
 * same pattern the header's search icon and logo already use). Each
 * instance's own `isOpen` state is independent, which is harmless: only
 * one is ever visible/reachable at a given viewport width.
 *
 * The sampled node has no separate close ("X") button anywhere in its
 * tree — just the 8 links and the background artwork — so this doesn't
 * render one either. The same trigger toggles both states (icon swaps
 * to an "X" while open); Escape and clicking a nav link also close it.
 *
 * No phone number or "Plan with us" CTA is rendered inside the panel —
 * the sampled node genuinely doesn't contain either. Both stay
 * reachable elsewhere: the phone number is in the desktop header bar,
 * and "Plan with us" 's target (`/plan-with-us`) is one tap from the
 * homepage regardless.
 *
 * Entrance/exit animation (GSAP, desktop instance only — the mobile
 * row's own trigger uses `MobileNavPanel.tsx` instead) — requested as
 * a follow-up polish pass, not sampled from Figma: the panel fades and
 * slides down into place while its links stagger in underneath it, and
 * reverses symmetrically on close. `isOpen` (drives focus/scroll-lock/
 * Escape, per this component's existing a11y behavior) and `mounted`
 * (drives whether the portal renders at all) are deliberately two
 * separate pieces of state — closing sets `isOpen` false immediately,
 * but the panel stays mounted and in the DOM until the exit tween's
 * `onComplete` calls `setMounted(false)`, so the close animation is
 * actually visible instead of the panel vanishing instantly while
 * `isOpen` still drives it back to its hidden GSAP state.
 */
export function MobileMenu({
  solid,
  variant = "dark",
  triggerSizeClassName = "size-6",
  panelTopClassName = "top-14",
  onOpenChange,
  items = staticMenuNavigation,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  function open() {
    setMounted(true);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  // Its own effect rather than a call inline in `open`/`close` above:
  // those two stay "pure" (only refs/setState) that way, which is what
  // lets the focus-trap effect further down omit them from its own
  // dependency array (see that effect's own comment) — folding
  // `onOpenChange`, a prop, into either handler would break the
  // lint rule's ability to prove that.
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useGSAP(
    () => {
      if (!panelRef.current) return;

      const panel = panelRef.current;
      const links = gsap.utils.toArray<HTMLElement>(
        ".menu-overlay-link",
        panel,
      );
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (isOpen) {
        if (prefersReducedMotion) {
          gsap.set(panel, { autoAlpha: 1, yPercent: 0 });
          gsap.set(links, { autoAlpha: 1, y: 0 });
          return;
        }

        gsap.set(panel, { autoAlpha: 0, yPercent: -6, scale: 0.98 });
        gsap.set(links, { autoAlpha: 0, y: 24 });
        gsap
          .timeline()
          .to(panel, {
            autoAlpha: 1,
            yPercent: 0,
            scale: 1,
            duration: 0.45,
            ease: "power3.out",
          })
          .to(
            links,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "power3.out",
            },
            "-=0.25",
          );
      } else {
        // Closing — only reachable once the panel has actually mounted
        // (see the `mounted` state's own comment above); `onComplete`
        // is what actually removes it from the DOM afterward.
        if (prefersReducedMotion) {
          setMounted(false);
          return;
        }

        gsap
          .timeline({ onComplete: () => setMounted(false) })
          .to(links, {
            autoAlpha: 0,
            y: -16,
            duration: 0.2,
            stagger: 0.03,
            ease: "power2.in",
          })
          .to(
            panel,
            {
              autoAlpha: 0,
              yPercent: -6,
              scale: 0.98,
              duration: 0.25,
              ease: "power2.in",
            },
            "-=0.1",
          );
      }
    },
    { dependencies: [isOpen], scope: panelRef },
  );

  useEffect(() => {
    if (!isOpen) return;

    // Lock background scroll while the panel is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel — there's no dedicated close button to
    // land on (see this component's own doc comment), so the first nav
    // link is the natural first stop.
    firstLinkRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      // Minimal focus trap: wrap Tab/Shift+Tab within the panel.
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // `close` isn't listed as a dep: it only reads refs/setState, which
    // are stable across renders, and the linter agrees (no warning here).
  }, [isOpen]);

  const triggerColorClass =
    variant === "light"
      ? "text-brand-neutral-900"
      : solid
        ? "text-brand-neutral-1000"
        : "text-brand-neutral-000";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        // Static label — open/closed state is conveyed by aria-expanded,
        // not by rewriting this label.
        aria-label="Menu"
        onClick={() => (isOpen ? close() : open())}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4",
          triggerSizeClassName,
          variant === "light"
            ? "focus-visible:outline-brand-neutral-900"
            : solid
              ? "focus-visible:outline-brand-neutral-1000"
              : "focus-visible:outline-brand-neutral-000",
        )}
      >
        {isOpen ? (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={cn(triggerSizeClassName, triggerColorClass)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <Image
            src={
              variant === "light"
                ? "/icons/navigation/menu-dark.svg"
                : "/icons/navigation/menu.svg"
            }
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            // Only the "dark" variant's icon is a fixed white export that
            // needs inverting once solid — "light" already points at
            // the dedicated "-dark" asset above.
            className={cn(
              triggerSizeClassName,
              variant === "dark" && solid && "invert",
            )}
          />
        )}
      </button>

      {mounted
        ? createPortal(
            // Portaled straight to `document.body` rather than rendered
            // in place: the trigger above lives inside a `.nav_link`
            // element (see Header.tsx) that GSAP's entrance animation
            // gives a `transform` on mount — and a `transform` on *any*
            // ancestor redefines the containing block for
            // `position: fixed` descendants (a CSS spec quirk, not a
            // bug), so this panel would end up positioned relative to
            // that small animated wrapper instead of the viewport,
            // rendering squashed into it and invisible. Escaping to
            // `document.body` — outside that ancestor entirely — is
            // what actually keeps `fixed` meaning "relative to the
            // viewport" here.
            <div
              id={panelId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              // `panelTopClassName` (see this component's own props
              // doc) — the caller's own rendered header height.
              // `bottom-0` + `overflow-y-auto` rather than a fixed
              // height so the panel still scrolls gracefully on short
              // viewports instead of clipping links.
              className={cn(
                "fixed inset-x-0 -bottom-20 z-40 overflow-y-hidden bg-brand-neutral-000",
                panelTopClassName,
              )}
            >
              {/* Background artwork (Figma's "landscape-mountains-banners"
                  layer, imageRef 2c908457e511d1cc3056f84313df472644aad462 —
                  user-provided export, public/images/header/menu-mountains.png)
                  bottom-anchored across the full panel width, matching the
                  sampled node's own bottom-anchored placement and its
                  1440:702 placed aspect ratio. `fill` is required here —
                  Next.js `Image` throws at runtime without it or explicit
                  width/height, since this box's size comes from the
                  `aspect-[1440/702]` wrapper, not from the image's own
                  intrinsic dimensions. Purely decorative — behind the nav
                  links, `aria-hidden`. */}
              <div className="pointer-events-none absolute inset-x-0 -bottom-30 overflow-hidden aspect-1440/702 w-full">
                <Image
                  src="/images/header/menu-mountains.png"
                  height={702}
                  width={1440}
                  objectPosition="bottom"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-cover object-bottom opacity-24"
                />
              </div>

              {/* p-8 (32px) / gap-6 (24px): the sampled node's own
                  padding and vertical item spacing. */}
              <nav
                aria-label="Primary"
                className="relative flex flex-col gap-6 p-8"
              >
                {items.map((item, index) => (
                  <Link
                    key={item.href}
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    onClick={close}
                    // `menu-overlay-link`: GSAP's own hook into these
                    // (the entrance/exit stagger — see this component's
                    // doc comment), not a style. text-raleway-3xl
                    // (26px/41.6px) + font-medium: the sampled node's own
                    // text style (26/41.6/0, weight 500) — `uppercase`
                    // dropped 2026-09-04 (explicit user direction): labels
                    // now render in their own source casing (e.g. "Compare
                    // Itineraries", "Trekking Routes Map") instead of being
                    // forced all-caps.
                    className="menu-overlay-link text-raleway-xl font-medium text-brand-neutral-1000"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
