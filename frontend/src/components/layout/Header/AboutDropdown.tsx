"use client";

import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { aboutDropdown as staticAboutDropdown, type AboutDropdownData } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useHeaderPanelTop } from "./useHeaderPanelTop";

gsap.registerPlugin(useGSAP);

interface AboutDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  /** The "About" nav trigger — used to exclude it from the
   *  outside-click check below (clicking the trigger itself toggles
   *  the panel via its own handler, it shouldn't also count as an
   *  "outside" click that closes what that same click just opened). */
  triggerRef: RefObject<HTMLElement | null>;
  panelId: string;
  /** How far below the header the panel starts. Same pattern/reasoning
   *  as `DestinationDropdown`'s own `panelTopClassName` prop: this
   *  component has no way to measure the caller's rendered header
   *  height itself. Tailwind `top-*` class only. */
  panelTopClassName: string;
  /** Real, admin-editable content from `getHeaderNavData()` (see
   *  `features/navigation/lib/build-navigation.ts`) — defaults to
   *  `config/navigation.ts`'s static Figma-sampled content. */
  data?: AboutDropdownData;
}

/**
 * "About" header dropdown — an exact reproduction of Figma node
 * 455:4949 ("Homepage - Dropdown - Destination" — the frame name is a
 * leftover from copy/paste, its real content is the About panel; see
 * `headerNavigation`'s own doc comment in navigation.ts): a full-width
 * white panel with two link columns, "Our Company" and "Useful Links",
 * sourced from `aboutDropdown` in `@/config/navigation.ts`.
 *
 * Structurally the plainer sibling of `DestinationDropdown.tsx` — same
 * full-bleed white panel anchored under the header, same portal/GSAP/
 * close mechanics, but flat content (two static columns, no hover-
 * revealed taxonomy) since that's genuinely all the sampled node
 * contains, and every link in it already has a confirmed real page.
 *
 * Portaled to `document.body` for the same reason as
 * `DestinationDropdown.tsx`/`MobileMenu.tsx`: the trigger sits inside a
 * `.nav_link` element that GSAP's entrance animation gives a
 * `transform` on mount, which would otherwise redefine the containing
 * block for this panel's `fixed` positioning.
 *
 * Deliberately NOT a modal dialog (no `aria-modal`, no scroll lock, no
 * stolen initial focus) — a disclosure widget sitting below the header,
 * not a takeover, scrolling included (see DestinationDropdown.tsx's own
 * comment — same panel, same history). Closes on Escape, on an outside
 * click, and whenever a link inside is activated (a real navigation, so
 * keeping the panel open past that point would just be stale).
 *
 * Mounted only while `isOpen` (no fade/slide-out on close) rather than
 * staying in the portal permanently: `createPortal`'s target
 * (`document.body`) is evaluated at render time, and this component
 * still gets a server render for its initial HTML despite being a
 * Client Component (Next.js renders "use client" components on the
 * server too) — `document` doesn't exist there. Gating the whole
 * return on `mounted`, which starts `false` and can only become `true`
 * from a client-side click, means `document.body` is never reached
 * during that server render — see the `mounted` state's own comment
 * for how its entrance/exit tween need drives that split, same
 * `mounted`/`isOpen` split as `DestinationDropdown.tsx`'s own identical
 * problem.
 */
export function AboutDropdown({
  isOpen,
  onClose,
  triggerRef,
  panelId,
  panelTopClassName,
  data = staticAboutDropdown,
}: AboutDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(isOpen);
  // Same off-screen-when-opened-mid-page fix as DestinationDropdown.tsx
  // — see useHeaderPanelTop's own doc comment.
  const measuredTop = useHeaderPanelTop(isOpen, triggerRef);

  // Render-phase sync (React's documented pattern for resetting state
  // when a prop changes, rather than a `useEffect` that would trigger a
  // cascading extra render): mounts immediately when `isOpen` flips
  // true, so the first paint after the click already has the panel in
  // the DOM at its GSAP-driven hidden starting state below.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setMounted(true);
  }

  useGSAP(
    () => {
      if (!panelRef.current) return;

      const panel = panelRef.current;
      const groups = gsap.utils.toArray<HTMLElement>(
        ".about-dropdown-group",
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
      aria-label="About menu"
      className={cn(
        // `fixed`, not `absolute` — see DestinationDropdown.tsx's own
        // comment (and useHeaderPanelTop.ts's) for the full history:
        // `absolute` drifted out of sync with the header (itself
        // viewport-pinned) on scroll; `fixed` + a continuously-synced
        // `top` fixes that without reintroducing the earlier
        // close-on-scroll behavior.
        "fixed inset-x-0 z-40 w-full bg-brand-neutral-000",
        panelTopClassName,
      )}
      style={measuredTop != null ? { top: measuredTop } : undefined}
    >
      <div className="flex w-full items-stretch gap-8 p-8">
        {data.columns.map((column, index) => (
          <Fragment key={column.heading}>
            {index > 0 ? (
              <div className="about-dropdown-group w-px shrink-0 self-stretch bg-brand-neutral-400" />
            ) : null}
            <div className="about-dropdown-group flex flex-1 flex-col gap-3">
              <span className="border-b border-brand-neutral-300 pb-3 font-poppins text-body-l font-medium text-primary-500">
                {column.heading}
              </span>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="font-poppins text-body-m text-brand-neutral-800 transition-opacity hover:text-primary-500 hover:opacity-80"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </div>,
    document.body,
  );
}
