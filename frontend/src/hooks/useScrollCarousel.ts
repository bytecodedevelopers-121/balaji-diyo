"use client";

import { useEffect, useRef, useState, type DependencyList } from "react";

/**
 * Shared horizontal-scroll-carousel state: a ref for the scrolling
 * element, whether there's more content to page to in each direction,
 * and a "scroll by one viewport" handler for prev/next buttons.
 *
 * Pulled out of `PopularTripsSection`'s `TripsCarousel` (the first
 * place this pattern existed) once `TripsLineupSection` needed the
 * exact same ref/scroll-state logic — now shared by every horizontal
 * card carousel on the site (Trips, Trips Lineup, Blog, Testimonials)
 * instead of a fourth copy-paste.
 *
 * `deps` re-runs the scroll-state check (and re-attaches listeners)
 * when the underlying item list changes — e.g. a different page of
 * trips/testimonials swaps in scrollWidth changes, so `canScrollRight`
 * needs recomputing.
 */
export function useScrollCarousel<T extends HTMLElement>(deps: DependencyList = []) {
  const scrollerRef = useRef<T>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    function updateScrollState() {
      const el = scroller!;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  function scrollByPage(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction * scroller.clientWidth, behavior: "smooth" });
  }

  return { scrollerRef, canScrollLeft, canScrollRight, scrollByPage };
}
