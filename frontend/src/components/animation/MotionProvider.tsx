"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Site-wide motion layer. Mounted once in the root layout. Everything here
 * is additive — it never changes layout, colours, fonts or content — and
 * animates only `transform` / `opacity`.
 *
 *  1. Lenis smooth scrolling, driven by GSAP's ticker and synced to
 *     ScrollTrigger.
 *  2. Scroll progress bar (top of the viewport).
 *  3. `.reveal` scroll reveal (fade + rise at 85% of the viewport).
 *  4. Parallax for `[data-parallax="<percent>"]` elements (desktop only).
 *  5. Magnetic buttons for `[data-magnetic]` (desktop / fine pointer only).
 *  6. ScrollTrigger.refresh() once images and fonts have loaded.
 *
 * Section-specific entrances (hero, card grids, table rows, ...) live in
 * `Reveal.tsx`.
 *
 * ## Tuning
 *  - Smoothness: `LENIS_LERP` (lower = floatier, 0.08–0.15 is the usual range).
 *  - Reveal speed / distance / easing: `REVEAL` below.
 *  - Reveal trigger point: `REVEAL.start` ("top 85%" = when the element's top
 *    reaches 85% down the viewport).
 *  - Parallax strength: the number in `data-parallax="12"` (percent of the
 *    element's own height; ±12 means it drifts 12% either way).
 *  - Magnetic pull: `MAGNET.strength` (0.3 = follows the cursor 30%).
 *
 * ## No-flash contract
 * `app/layout.tsx` adds `class="js"` to <html> before first paint and
 * `globals.css` hides `.js .reveal:not(.is-revealed)`. This component marks
 * `window.__motionReady` once it has run; a 3s inline fallback in the layout
 * removes `js` if it never does, so content can never stay hidden.
 */
const LENIS_LERP = 0.1;

const REVEAL = { y: 40, duration: 1, ease: "power3.out", start: "top 85%" } as const;

const MAGNET = { strength: 0.32, followDuration: 0.35, resetDuration: 1.1, resetEase: "elastic.out(1, 0.4)" } as const;

/** Elements whose own scrolling must not be hijacked by Lenis. */
const LENIS_PREVENT = '[data-lenis-prevent], .destination-scroll, [role="dialog"], [role="region"]';

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

export function MotionProvider() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Hydration guard: GSAP writes inline styles / classes onto server-rendered
  // markup (`.reveal`, parallax layers, ...). Doing that before React has
  // hydrated those elements causes a hydration mismatch, so the scroll
  // effects wait until the page has fully loaded plus a short settle delay.
  // (Client-side route changes render fresh DOM, so no wait is needed there.)
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const arm = () => {
      timer = window.setTimeout(() => setReady(true), 150);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => {
      window.removeEventListener("load", arm);
      window.clearTimeout(timer);
    };
  }, []);

  // ---- 1. Smooth scrolling (Lenis ↔ ScrollTrigger) ----------------------
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: LENIS_LERP,
      smoothWheel: true,
      anchors: true,
      prevent: (node) => node.closest(LENIS_PREVENT) !== null,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Menus / drawers lock page scroll with `body { overflow: hidden }` —
    // honour that, otherwise the page would keep scrolling behind them.
    const syncLock = () => {
      if (document.body.style.overflow === "hidden") lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Each route starts at the top (the root layout already resets native
  // scroll; this keeps Lenis' own internal position in step).
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  // ---- 2–5. Scroll-driven effects, rebuilt per route --------------------
  useGSAP(
    () => {
      if (!ready) return;
      const mm = gsap.matchMedia();

      // Reduced motion: show everything immediately, animate nothing.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-revealed"));
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Progress bar.
        if (progressRef.current) {
          gsap.fromTo(
            progressRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
            },
          );
        }

        // `.reveal` — scroll reveal.
        gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: REVEAL.duration,
            ease: REVEAL.ease,
            scrollTrigger: { trigger: el, start: REVEAL.start, once: true },
            onComplete: () => {
              // Hand control back to CSS (also removes the hidden state).
              el.classList.add("is-revealed");
              gsap.set(el, { clearProps: "opacity,transform" });
            },
          });
        });

        // Desktop-only extras.
        const desktop = window.matchMedia("(min-width: 769px)").matches;

        // Parallax.
        if (desktop) {
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
            const amount = Number(el.dataset.parallax) || 10;
            const host = el.closest("section") ?? el.parentElement ?? el;
            gsap.fromTo(
              el,
              { yPercent: -amount },
              {
                yPercent: amount,
                ease: "none",
                scrollTrigger: { trigger: host, start: "top bottom", end: "bottom top", scrub: true },
              },
            );
          });
        }

        // Magnetic buttons (fine pointers only).
        const cleanups: Array<() => void> = [];
        if (desktop && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((el) => {
            const toX = gsap.quickTo(el, "x", { duration: MAGNET.followDuration, ease: "power3.out" });
            const toY = gsap.quickTo(el, "y", { duration: MAGNET.followDuration, ease: "power3.out" });

            const onMove = (event: MouseEvent) => {
              const rect = el.getBoundingClientRect();
              toX((event.clientX - (rect.left + rect.width / 2)) * MAGNET.strength);
              toY((event.clientY - (rect.top + rect.height / 2)) * MAGNET.strength);
            };
            const onLeave = () => {
              gsap.to(el, { x: 0, y: 0, duration: MAGNET.resetDuration, ease: MAGNET.resetEase, overwrite: "auto" });
            };

            el.addEventListener("mousemove", onMove);
            el.addEventListener("mouseleave", onLeave);
            cleanups.push(() => {
              el.removeEventListener("mousemove", onMove);
              el.removeEventListener("mouseleave", onLeave);
              gsap.set(el, { clearProps: "x,y" });
            });
          });
        }

        return () => cleanups.forEach((fn) => fn());
      });

      window.__motionReady = true;
      return () => mm.revert();
    },
    { dependencies: [pathname, ready], revertOnUpdate: true },
  );

  // ---- 6. Re-measure once assets have settled ---------------------------
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") refresh();
    else window.addEventListener("load", refresh, { once: true });
    void document.fonts?.ready.then(refresh);
    return () => window.removeEventListener("load", refresh);
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-white/10"
    >
      <div
        ref={progressRef}
        className="h-full origin-left scale-x-0 bg-[linear-gradient(90deg,var(--color-logo-sky),var(--color-logo-green),var(--color-logo-sun))]"
      />
    </div>
  );
}
