"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Viewport-relative `top` (px) for a header mega-menu panel that's
 * `position: fixed` and portaled to `document.body` — `Destination` and
 * `About`'s dropdowns (`DestinationDropdown.tsx`/`AboutDropdown.tsx`).
 *
 * FIXED 2026-09-03 (user-reported: "the destination dropdown is not
 * open/show if open from mid or last section of the page") — this used
 * to be a single hardcoded `top-[95px]` Tailwind class, which only put
 * the panel in the right spot when the page was still scrolled to (or
 * very near) the top.
 *
 * REWORKED 2026-09-07 (user-reported: "if I open destination dropdown
 * and if I scroll up that section also scrolled and displayed in
 * different position") — the fix above measured the header's on-screen
 * `bottom` once on open and baked in `window.scrollY` at that instant to
 * get a *document*-relative offset, for a panel positioned `absolute`
 * (see `DestinationDropdown.tsx`'s own doc comment on why that was
 * `absolute` in the first place: closing the panel on every scroll was
 * explicit direct feedback to remove). That only actually works if the
 * header itself scrolls away normally with the page — but `Header.tsx`'s
 * own root element is `fixed`/`sticky` (pinned to the viewport, plus its
 * own scroll-driven show/hide animation), so its true on-screen position
 * never matches "the spot it was in when the panel opened, offset by how
 * far you've since scrolled" — the two drift apart on the very next
 * scroll in either direction, which is exactly the reported bug: the
 * panel visibly detaches from the header and ends up floating over
 * whatever page content happens to be at that document offset.
 *
 * The actual fix is a `position: fixed` panel (so it can never drift —
 * "fixed" is viewport-relative by definition) whose `top` is
 * continuously kept equal to the header's own live `getBoundingClientRect()`
 * bottom edge, via a `requestAnimationFrame` loop while the panel is
 * open — not a one-time measurement, and not a plain `scroll` listener
 * either: the header's own show/hide animation (`Header.tsx`'s `useGSAP`
 * tween on `hidden`) is a GSAP-driven inline-transform tween, not a CSS
 * `transition`, so it doesn't fire `scroll` or `transitionend` events of
 * its own to resync against — polling every frame is what actually keeps
 * up with it, in addition to real scrolling and resizing. This is what
 * makes the panel follow the header smoothly down and out of view on the
 * same gesture that hides the header, instead of floating disconnected
 * once the header's tween outlasts the last `scroll` event.
 *
 * `useLayoutEffect` so the very first measurement lands before the
 * browser paints the newly-portaled panel — no flash at the old/default
 * position first. The rAF loop is torn down the instant the panel closes
 * (or this unmounts) — never running while there's no panel to position.
 *
 * Returns `null` until measured (first open, or no `<header>` found —
 * e.g. this component's own test harness, which doesn't render one);
 * callers fall back to their existing static `panelTopClassName` in that
 * case, so nothing regresses where a real `<header>` isn't present.
 */
export function useHeaderPanelTop(
  isOpen: boolean,
  triggerRef: RefObject<HTMLElement | null>,
): number | null {
  const [top, setTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const header = triggerRef.current?.closest("header");
    if (!header) return;

    let frameId: number;
    let lastBottom: number | null = null;

    function tick() {
      const bottom = header!.getBoundingClientRect().bottom;
      if (bottom !== lastBottom) {
        lastBottom = bottom;
        setTop(bottom);
      }
      frameId = requestAnimationFrame(tick);
    }

    tick();
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, triggerRef]);

  return top;
}
