"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  heading: string;
}

interface TableOfContentsNavProps {
  items: TocItem[];
  /**
   * When false, the desktop nav renders as a plain block — no
   * `sticky`/`max-h`/`overflow-y-auto` — so it scrolls away normally
   * with the rest of the page instead of staying pinned. Defaults to
   * true and both current callers (BookingTermsSection,
   * BlogDetailSection) use that default.
   *
   * Kept as an opt-out, not deleted: a `position: sticky` element only
   * releases once its own containing block's edge is reached, not once
   * it would start covering a later sibling, so a sticky nav directly
   * followed by a plain (non-sticky) sibling in the same column ends up
   * sliding over it (confirmed by measuring both elements' actual
   * bounding boxes at several scroll depths, not assumed). This is only
   * safe to keep on when either nothing sits below the nav in its
   * column, or that something is independently positioned to track the
   * nav's own real height (see `navId` below, and BlogDetailSection's
   * "Ask Question" card for the one caller that needs it).
   */
  sticky?: boolean;
  /**
   * `id` for the desktop (`lg:`) nav element only — lets a caller with
   * something stacked below this nav in the same sticky sidebar column
   * (BlogDetailSection's "Ask Question" card) measure this nav's real
   * rendered bottom edge via `getBoundingClientRect()` and position
   * itself to sit right below it, the same "measure the previous sticky
   * element's actual position" technique the package detail page's
   * `TabNav`/`BookingSidebar` already use for the same kind of
   * stacked-sticky-siblings problem.
   */
  navId?: string;
}

/**
 * Scroll-spy table of contents — a Client Component island the same way
 * MobileMenu/TeamGrid are, since it's typically the only interactive
 * piece of an otherwise server-rendered page. Originally built for
 * BookingTermsSection; moved here (2026-08-20) once BlogDetailSection
 * needed the exact same scroll-spy-sidebar-plus-tabs behavior for a
 * blog post's own `<h2>` sections (via splitCmsSections, same utility
 * both callers share).
 *
 * Renders once, twice: a sticky vertical sidebar at `lg:` and up, a
 * horizontal scrollable tab row below it — matching
 * design-references/"Booking Terms and Conditions.png" (desktop) and
 * booking-terms-mobile.png (mobile) exactly, which use genuinely
 * different layouts rather than one reflowing into the other. Both
 * markups share the same `activeId` state/IntersectionObserver so they
 * never disagree about which section is current.
 *
 * Nav labels are the real section headings verbatim (e.g. "2. Deposit
 * requirement of Booking Terms and Conditions"), not the design's
 * shorter placeholder labels ("How to pay your deposit") — this is real
 * CMS content, not the mockup's, so inventing shorter paraphrases would
 * misrepresent it. Longer labels wrap in the sidebar; that's an accepted
 * fidelity trade-off for using the actual content.
 *
 * Sticky by default (`sticky-with-internal-scroll-cap`) — see the
 * `sticky`/`navId` props above for the caveats around stacking
 * something else below it in the same column.
 */
export function TableOfContentsNav({ items, sticky = true, navId }: TableOfContentsNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const mobileListRef = useRef<HTMLUListElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  // Set when a ToC link is clicked so the smooth/jump scroll that follows
  // doesn't flicker the highlight through every section it passes.
  const lockedUntil = useRef(0);

  // Callers rebuild `items` every render; key the effect on the ids so it
  // only re-subscribes when the sections genuinely change.
  const idsKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split("|");
    // A heading counts as "reached" once it crosses this line from the top.
    const OFFSET = 120;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (performance.now() < lockedUntil.current) return;

      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - OFFSET <= 0) current = id;
        else break;
      }
      // Short final sections can never reach the line; at the very bottom
      // of the page the last section is the one being read.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = ids[ids.length - 1];

      setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [idsKey]);

  // Keep the active item visible inside the desktop nav's own scroll area
  // (long ToCs overflow it). Scrolls only the nav, never the page.
  useEffect(() => {
    const nav = desktopNavRef.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!nav || !link || nav.scrollHeight <= nav.clientHeight) return;
    const navTop = nav.getBoundingClientRect().top;
    const linkTop = link.getBoundingClientRect().top - navTop + nav.scrollTop;
    nav.scrollTo({ top: linkTop - (nav.clientHeight - link.clientHeight) / 2, behavior: "smooth" });
  }, [activeId]);

  // Keep the active tab visible in the horizontally scrolling mobile row.
  useEffect(() => {
    const list = mobileListRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !tab) return;
    const target = tab.offsetLeft - (list.clientWidth - tab.clientWidth) / 2;
    list.scrollTo({ left: target, behavior: "smooth" });
  }, [activeId]);

  const handleClick = (id: string, timeStamp: number) => {
    setActiveId(id);
    lockedUntil.current = timeStamp + 800;
  };

  if (items.length === 0) return null;

  return (
    <>
      <nav
        ref={desktopNavRef}
        id={navId}
        aria-label="Table of contents"
        className={cn(
          "hidden lg:block lg:w-[280px]",
          sticky
            ? "shrink-0 lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
            : // Inside a shared sticky column: cap the list itself and scroll internally, so the column keeps its full real height.
              "shrink-0 lg:max-h-[50vh] lg:overflow-y-auto",
        )}
      >
        <ul className="flex flex-col gap-1 rounded-card border border-brand-neutral-300 bg-brand-neutral-000 p-2 shadow-card-soft">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => handleClick(item.id, event.timeStamp)}
                aria-current={activeId === item.id ? "true" : undefined}
                className={cn(
                  "block rounded-md px-4 py-3 text-body-m font-medium transition-colors",
                  activeId === item.id
                    ? "bg-primary-500 text-brand-neutral-000"
                    : "text-brand-neutral-800 hover:bg-brand-neutral-100",
                )}
              >
                {item.heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Table of contents" className="lg:hidden">
        <ul ref={mobileListRef} className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => (
            <li key={item.id} className="shrink-0">
              <a
                href={`#${item.id}`}
                onClick={(event) => handleClick(item.id, event.timeStamp)}
                aria-current={activeId === item.id ? "true" : undefined}
                className={cn(
                  "block rounded-pill px-4 py-2 text-body-s font-medium whitespace-nowrap transition-colors",
                  activeId === item.id
                    ? "bg-primary-500 text-brand-neutral-000"
                    : "text-brand-neutral-700 hover:bg-brand-neutral-100",
                )}
              >
                {item.heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
