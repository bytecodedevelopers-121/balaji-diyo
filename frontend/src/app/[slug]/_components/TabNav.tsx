"use client";

import { useEffect, useRef, useState } from "react";


const ALL_TABS = [
  { id: "trip-facts", label: "Trip Facts" },
  { id: "overview", label: "Overview" },
  { id: "map", label: "Route Map" },
  { id: "includes", label: "Service Details & Add-Ons" },
  { id: "departures", label: "Departures" },
  { id: "media-gallery", label: "Media Gallery" },
  { id: "itinerary", label: "Itinerary" },
  { id: "gear", label: "Equipments" },
  { id: "know-before-you-go", label: "Practical Info" },
  { id: "faqs", label: "FAQs" },
  { id: "reviews", label: "Reviews" },
  { id: "video-reviews", label: "Video Reviews" },
];

/**
 * Sticky in-page section nav — matches the Figma tab bar (Frame
 * 1000006584): white bar, active tab gets a primary-colored bottom
 * border + label, inactive tabs are neutral-700. Scrollspy-highlights
 * the section currently in view.
 */
export function TabNav() {
  // Every tab always shows: sections without content render a placeholder.
  const TABS = ALL_TABS;
  const [active, setActive] = useState(ALL_TABS[0].id);
  const [stickyTop, setStickyTop] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = TABS.map((tab) => document.getElementById(tab.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [TABS]);

  // The scrollspy above *is* updating `active` correctly on mobile — the
  // actual bug reported was that nothing visibly changes: on mobile this
  // nav drops to one `overflow-x-auto` row (see the comment on the <nav>
  // below) where only 3–4 of the ten tabs fit at once, so once scrolling
  // the page advances `active` to a tab further along the strip, its
  // underline is simply off-screen to the right — there was nothing here
  // scrolling the strip itself to follow. Bring the active tab into view
  // within the nav (not the page) whenever it changes.
  useEffect(() => {
    const nav = navRef.current;
    const activeTab = nav?.querySelector<HTMLElement>(
      `[data-tab-id="${active}"]`,
    );
    activeTab?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  // The site header is also `sticky top-0` and slides back into view on
  // any upward scroll (see Header.tsx). Anchoring this nav to the same
  // `top: 0` made the two fight over the same spot — whichever painted
  // on top (the header, by DOM order + z-index) hid the other. Instead,
  // track the header's actual bottom edge and stick right below it, so
  // the two slide together instead of overlapping.
  //
  // Previously synced via `scroll`/`resize`/`transitionend` listeners —
  // but the header's slide is a GSAP tween (`gsap.to(..., { yPercent,
  // duration: 0.3 })`), not a CSS transition, so `transitionend` never
  // actually fires for it. `scroll` was the only real sync left, and a
  // GSAP tween keeps animating for its own 0.3s after the user's scroll
  // gesture stops producing scroll events — leaving this nav's
  // `stickyTop` momentarily stale (visibly overlapping the still-
  // mid-slide header/content underneath) until the *next* scroll event
  // corrected it, exactly the "fixes itself once you scroll a little
  // more" symptom reported 2026-08-27. A `requestAnimationFrame` loop
  // re-measures every frame instead, so it tracks the header's real
  // position continuously regardless of what's animating it (GSAP
  // tween, CSS transition, or anything else in the future) rather than
  // waiting for a scroll/resize/transitionend event that may not fire
  // during the animation's tail.
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;

    let frame: number;
    let lastBottom = -1;

    function syncStickyTop() {
      const bottom = Math.max(0, header!.getBoundingClientRect().bottom);
      if (bottom !== lastBottom) {
        lastBottom = bottom;
        setStickyTop(bottom);
      }
      frame = requestAnimationFrame(syncStickyTop);
    }

    frame = requestAnimationFrame(syncStickyTop);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Plain `href="#id"` anchors let the browser do its native anchor jump,
  // which aligns the target section's top edge to viewport y:0 — but it
  // has no idea this page also has a sticky header *and* this sticky nav
  // stacked on top of that, so the section lands partly hidden behind
  // them (and by a drifting amount, since the header's height changes as
  // it slides in/out). Intercept the click and scroll manually, offsetting
  // by the header's live bottom edge plus this nav's own height, so the
  // section's heading always lands just below both sticky bars instead of
  // underneath them.
  function computeTargetTop(target: HTMLElement) {
    const nav = navRef.current;
    const navHeight = nav?.getBoundingClientRect().height ?? 0;
    const header = document.getElementById("site-header");
    const liveStickyTop = Math.max(
      0,
      header?.getBoundingClientRect().bottom ?? stickyTop,
    );
    const desired =
      target.getBoundingClientRect().top +
      window.scrollY -
      liveStickyTop -
      navHeight -
      16;

    // The cosmetic "- 16" breathing room above is harmless for a target
    // far down the page — this nav has long since crossed its own
    // `position: sticky` threshold by then regardless. But for a target
    // sitting right behind this nav in the flow (TripTitleBar/"overview",
    // now this nav's very next sibling), that same -16 can undershoot
    // the point where *this nav itself* actually engages sticky, landing
    // with nav still unstuck at its normal-flow position — exposing
    // whatever's behind it (a sliver of the hero photo) in the gap
    // between the header and nav's not-yet-stuck top edge. Never land
    // short of that: nav's own stick threshold is a hard floor.
    //
    // Reading `nav.getBoundingClientRect().top` for that threshold is a
    // trap, though: once this nav is *already* stuck (true for most of
    // the page — anyone reading Reviews or FAQs already has it pinned),
    // that rect reports its current *pinned* viewport position, not its
    // natural-flow one — collapsing the "threshold" to just
    // `window.scrollY`, the position we're already at. `Math.max` then
    // always "won" with "stay exactly where you are": clicking Overview
    // from anywhere below the fold updated the URL but never actually
    // scrolled — the bug this replaced. `TripHeader`'s own root element
    // (`id="trip-hero"`, the photo section right before this nav, never
    // itself sticky) always reports its *true* position regardless of
    // what's stuck elsewhere on the page — its bottom edge is exactly
    // where this nav's own natural-flow top sits, with zero gap between
    // them.
    if (!nav) return desired;
    const hero = document.getElementById("trip-hero");
    if (!hero) return desired;
    const navThreshold =
      hero.getBoundingClientRect().bottom + window.scrollY - liveStickyTop;
    return Math.max(desired, navThreshold);
  }

  // A single "compute once, scroll once" destination (the shape this used
  // to be) went stale on any tab far enough down the page: the header's
  // own GSAP hide/show tween (see the stickyTop-sync effect above) keeps
  // sliding it for up to ~0.3s after this click, independent of and
  // overlapping with the browser's own smooth-scroll animation, so by the
  // time both settle the header has collapsed (or not) by a different
  // amount than what the destination was computed against. Short hops
  // (Overview, right below the fold) barely gave the header room to
  // react and landed fine; long hops (Reviews, FAQs) gave it the full
  // 0.3s to collapse mid-flight and landed short/long by the difference —
  // exactly the "doesn't land in the same relative spot for every tab"
  // symptom reported. Once scrollY actually stops moving (both the
  // browser's smooth-scroll *and* the header tween are done, not just
  // one of them), snap once more to a freshly recomputed target using the
  // header's now-settled height, correcting any drift from that overlap.
  function handleTabClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    // A fresh `const` (rather than referencing `target` itself) so its
    // narrowed, non-null type holds inside `settle` below — a nested
    // `function` declaration that only runs later, via `requestAnimationFrame`,
    // so TS can't carry the `if (!target) return` narrowing into it.
    const section = target;

    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: computeTargetTop(section), behavior: "smooth" });

    // Frame-counted, not wall-clock-timed (no `Date.now()`/`performance.now()`
    // — those are impure calls React's compiler-purity lint rejects here) —
    // 120 frames is ~2s at 60fps, comfortably outlasting both the browser's
    // smooth-scroll and the header's own 0.3s tween on any realistic screen.
    let lastY = window.scrollY;
    let stableFrames = 0;
    let framesElapsed = 0;

    function settle() {
      framesElapsed += 1;
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 0.5) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }
      lastY = y;

      if (stableFrames >= 4) {
        window.scrollTo({ top: computeTargetTop(section), behavior: "auto" });
        return;
      }
      if (framesElapsed < 120) requestAnimationFrame(settle);
    }
    requestAnimationFrame(settle);
  }

  return (
    // `flex-wrap` used to break this onto several lines below the width
    // all ten tabs need — Figma's mobile frame keeps it one row and
    // scrolls horizontally instead (same pattern as FaqCategoriesSection's
    // own tab strip further down this page). The browser's own default
    // horizontal scrollbar was rendering directly under the active tab's
    // `border-b` underline, reading as two stacked lines — hidden here
    // (cross-browser: `scrollbar-width` for Firefox, `::-webkit-scrollbar`
    // for Chrome/Safari) since the row already scrolls on drag/swipe
    // without needing a visible scrollbar to say so.
    <nav
      ref={navRef}
      id="trip-tab-nav"
      style={{ top: stickyTop }}
      className="sticky z-10 flex gap-x-2 overflow-x-auto bg-[#064a70] shadow-[0_0_0_100vmax_#064a70] [-ms-overflow-style:none] [clip-path:inset(0_-100vmax)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => (
        <a
          key={tab.id}
          data-tab-id={tab.id}
          href={`#${tab.id}`}
          onClick={(event) => handleTabClick(event, tab.id)}
          className={`shrink-0 border-b-2 px-3 py-4 text-[15px] font-medium whitespace-nowrap text-white transition-opacity ${
            active === tab.id ? "border-white" : "border-transparent opacity-80 hover:opacity-100"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
