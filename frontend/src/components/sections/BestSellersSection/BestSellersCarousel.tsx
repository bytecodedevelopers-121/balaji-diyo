"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PackageCard, type CardTrip } from "@/components/ui/PackageCard";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const AUTOPLAY_MS = 4800;

/**
 * Coverflow-style "Best Sellers" stage: a fan of white trip cards where the
 * centre card is sharp and full-size, and its neighbours tilt away, shrink,
 * fade and blur (up to two either side). The active card changes via the
 * arrows, the dots, clicking a side card, or autoplay (paused on hover /
 * focus; off under `prefers-reduced-motion`).
 *
 * Motion is GSAP: every card is positioned from its signed offset to the
 * active one (`layout()`); on first view the cards fan out from the centre.
 * Blur is a CSS `filter` (design requirement) — fine for ≤5 cards.
 */
export function BestSellersCarousel({ items }: { items: CardTrip[] }) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const introDone = useRef(false);
  const drag = useRef({ active: false, startX: 0, dx: 0, moved: false });
  const lastWheel = useRef(0);
  const reduced = useRef(false);

  /** Signed circular distance of card `i` from the active card. */
  function offsetOf(i: number, current: number) {
    const half = Math.floor(count / 2);
    return ((((i - current + half) % count) + count) % count) - half;
  }

  const spacingOf = () => Math.min((stageRef.current?.clientWidth ?? 0) * 0.26, 340);

  function layout(current: number, animate: boolean, dragX = 0) {
    const stage = stageRef.current;
    if (!stage) return;
    const spacing = Math.min(stage.clientWidth * 0.26, 340);

    items.forEach((_, i) => {
      const el = cardRefs.current[i];
      if (!el) return;
      const o = offsetOf(i, current);
      const abs = Math.abs(o);
      const visible = abs <= 2;
      gsap.to(el, {
        x: o * spacing + dragX,
        y: abs === 0 ? 0 : 26 + (abs - 1) * 18,
        rotation: o * 9,
        scale: abs === 0 ? 1 : 0.88 - (abs - 1) * 0.07,
        opacity: visible ? (abs === 0 ? 1 : 0.9 - (abs - 1) * 0.25) : 0,
        filter: abs === 0 ? "blur(0px)" : `blur(${abs === 1 ? 3 : 5}px)`,
        zIndex: 10 - abs,
        duration: animate && !reduced.current ? (dragX === 0 ? 0.9 : 0.5) : 0,
        ease: "power3.inOut",
        overwrite: "auto",
        pointerEvents: visible ? "auto" : "none",
      });
    });
  }

  // Intro: collapse every card onto the centre, then fan out on first view.
  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;
      reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced.current) {
        introDone.current = true;
        layout(active, false);
        return;
      }
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      gsap.set(cards, { x: 0, y: 40, rotation: 0, scale: 0.7, opacity: 0, filter: "blur(6px)" });
      ScrollTrigger.create({
        trigger: stage,
        start: "top 80%",
        once: true,
        onEnter: () => {
          introDone.current = true;
          layout(active, true);
        },
      });
    },
    { scope: stageRef },
  );

  // Re-layout on active change and on resize.
  useEffect(() => {
    if (introDone.current) layout(active, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const onResize = () => introDone.current && layout(active, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Autoplay.
  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  const go = (delta: number) => setActive((current) => (current + delta + count) % count);

  // ---- Drag / swipe (mouse + touch) -------------------------------------
  // The cards follow the pointer, then snap to the nearest card on release.
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    drag.current = { active: true, startX: event.clientX, dx: 0, moved: false };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state.active) return;
    state.dx = event.clientX - state.startX;
    if (!state.moved && Math.abs(state.dx) > 6) {
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setPaused(true);
    }
    if (state.moved) layout(active, false, state.dx);
  }

  function endDrag() {
    const state = drag.current;
    if (!state.active) return;
    state.active = false;
    if (!state.moved) return;
    const spacing = spacingOf() || 1;
    let steps = Math.round(-state.dx / spacing);
    if (steps === 0 && Math.abs(state.dx) > 40) steps = state.dx < 0 ? 1 : -1;
    if (steps === 0) layout(active, true, 0);
    else setActive((current) => (((current + steps) % count) + count) % count);
    setPaused(false);
  }

  // Horizontal trackpad / shift-wheel gestures step through the cards.
  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 24;
    const now = Date.now();
    if (!horizontal || now - lastWheel.current < 600) return;
    lastWheel.current = now;
    go(event.deltaX > 0 ? 1 : -1);
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        className="relative mx-auto h-[520px] w-full max-w-[1280px] cursor-grab touch-pan-y select-none active:cursor-grabbing [&_a]:[-webkit-user-drag:none] [&_img]:[-webkit-user-drag:none]"
      >
        <ul className="absolute inset-0">
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <li
                key={item.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                // Side cards select instead of navigating; only the centre card is a real link.
                onClickCapture={(event) => {
                  // A drag that ends over a card must not count as a click.
                  if (drag.current.moved) {
                    event.preventDefault();
                    event.stopPropagation();
                    drag.current.moved = false;
                    return;
                  }
                  if (!isActive) {
                    event.preventDefault();
                    event.stopPropagation();
                    setActive(i);
                  }
                }}
                aria-hidden={isActive ? undefined : true}
                className={cn("absolute top-4 left-1/2 -ml-[165px] w-[330px]", !isActive && "cursor-pointer")}
                style={{ willChange: "transform, opacity, filter" }}
              >
                <div inert={!isActive ? true : undefined}>
                  <PackageCard trip={item} />
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous best seller"
          className="absolute top-1/2 left-0 z-20 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-neutral-1000 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-logo-sun"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next best seller"
          className="absolute top-1/2 right-0 z-20 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-neutral-1000 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-logo-sun"
        >
          <ChevronRight aria-hidden="true" className="size-6" />
        </button>
      </div>

      <div className="mt-2 flex justify-center gap-2" role="tablist" aria-label="Choose best seller">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={item.title}
            onClick={() => setActive(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === active ? "w-7 bg-logo-sun" : "w-2 bg-white/40 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </div>
  );
}
