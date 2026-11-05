"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Scroll-triggered entrance animations (GSAP + ScrollTrigger), one effect
 * per section so the page doesn't feel repetitive. Everything animates only
 * `opacity`, `transform`, and `clip-path` (cheap, no layout shift), runs
 * once, and is skipped entirely under `prefers-reduced-motion`.
 *
 * Usage: wrap a section and pick a `variant`. With `targets` (a CSS
 * selector scoped to the wrapper) the matching elements animate as a
 * staggered group; without it the wrapper itself animates. `auto` reads a
 * `data-reveal="up|left|right|zoom|clip"` attribute on descendants and
 * animates each on its own trigger. `hero` is the above-the-fold entrance
 * (`data-hero="pill|frame|card"`), played on load instead of on scroll.
 */
export type RevealVariant =
  | "fade-up"
  | "slide-left"
  | "slide-right"
  | "zoom"
  | "stagger-up"
  | "stagger-zoom"
  | "stagger-clip"
  | "stagger-circle"
  | "stagger-flip"
  | "stagger-soft"
  | "stagger-left"
  | "rows"
  | "auto"
  | "hero";

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  /** CSS selector (scoped to this wrapper) for the elements to animate. */
  targets?: string;
  className?: string;
}

const EASE = "power3.out";

const START = "top 82%";

function trigger(el: Element) {
  return { trigger: el, start: START, once: true } as const;
}

export function Reveal({ children, variant = "fade-up", targets, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const items = targets ? gsap.utils.toArray<HTMLElement>(targets, root) : [root];
      if (items.length === 0) return;

      switch (variant) {
        case "hero": {
          const pill = root.querySelector("[data-hero='pill']");
          const frame = root.querySelector("[data-hero='frame']");
          const cards = gsap.utils.toArray("[data-hero='card']", root);
          const tl = gsap.timeline({ defaults: { ease: EASE } });
          if (frame) tl.from(frame, { opacity: 0, scale: 0.94, y: 50, duration: 1.1 }, 0);
          if (pill) tl.from(pill, { opacity: 0, y: -36, duration: 0.8 }, 0.25);
          if (cards.length) tl.from(cards, { opacity: 0, y: 60, duration: 0.8, stagger: 0.15 }, 0.55);
          break;
        }
        case "auto": {
          gsap.utils.toArray<HTMLElement>("[data-reveal]", root).forEach((el) => {
            const kind = el.dataset.reveal;
            const from: gsap.TweenVars =
              kind === "left"
                ? { x: -90 }
                : kind === "right"
                  ? { x: 90 }
                  : kind === "zoom"
                    ? { scale: 0.88 }
                    : kind === "clip"
                      ? { clipPath: "inset(0 0 100% 0)" }
                      : { y: 44 };
            gsap.from(el, {
              ...from,
              opacity: kind === "clip" ? 1 : 0,
              duration: 1,
              ease: EASE,
              clearProps: kind === "clip" ? "clipPath" : "opacity,transform",
              scrollTrigger: trigger(el),
            });
          });
          break;
        }
        case "slide-left":
          gsap.from(items, { x: -100, opacity: 0, duration: 1.1, ease: EASE, clearProps: "opacity,transform", scrollTrigger: trigger(root) });
          break;
        case "slide-right":
          gsap.from(items, { x: 100, opacity: 0, duration: 1.1, ease: EASE, clearProps: "opacity,transform", scrollTrigger: trigger(root) });
          break;
        case "zoom":
          gsap.from(items, { scale: 0.9, opacity: 0, duration: 1, ease: "power2.out", clearProps: "opacity,transform", scrollTrigger: trigger(root) });
          break;
        case "stagger-up":
          gsap.from(items, {
            y: 56,
            opacity: 0,
            duration: 0.85,
            ease: EASE,
            stagger: 0.12,
            clearProps: "opacity,transform",
            scrollTrigger: trigger(root),
          });
          break;
        case "stagger-zoom":
          gsap.from(items, {
            scale: 0.86,
            y: 30,
            opacity: 0,
            duration: 0.85,
            ease: "back.out(1.4)",
            stagger: 0.1,
            scrollTrigger: trigger(root),
          });
          break;
        case "stagger-clip":
          // Explicit end state + clearProps: tweening clip-path *from* a value
          // to the browser default ("none") can leave the items clipped away.
          gsap.fromTo(
            items,
            { clipPath: "inset(100% 0% 0% 0%)", y: 30 },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              duration: 1,
              ease: "power4.out",
              stagger: 0.14,
              clearProps: "clipPath",
              scrollTrigger: trigger(root),
            },
          );
          break;
        case "stagger-circle":
          // Each card opens from a small circle at its centre, with a soft
          // scale-up, one after another. clip-path is cleared afterwards so
          // hover shadows / zoom aren't cropped.
          gsap.from(items, {
            clipPath: "circle(0% at 50% 50%)",
            scale: 0.92,
            opacity: 0,
            duration: 1.1,
            ease: "power3.out",
            stagger: { each: 0.12, from: "start" },
            clearProps: "clipPath",
            scrollTrigger: trigger(root),
          });
          break;
        case "stagger-soft": {
          // Understated card entrance: a short rise with a gentle fade, the
          // photo inside settling from a slight zoom, cards cascading
          // left-to-right. transform is cleared afterwards.
          gsap.from(items, {
            y: 34,
            opacity: 0,
            duration: 0.9,
            ease: "power2.out",
            stagger: 0.09,
            clearProps: "transform",
            scrollTrigger: trigger(root),
          });
          const photos = gsap.utils.toArray<HTMLElement>("img", root);
          if (photos.length) {
            gsap.from(photos, {
              scale: 1.12,
              duration: 1.4,
              ease: "power2.out",
              stagger: 0.09,
              clearProps: "transform",
              scrollTrigger: trigger(root),
            });
          }
          break;
        }
        case "stagger-flip":
          // Book-page flip: each card swings open around its left edge, like
          // turning a page, one after another. transform properties are
          // cleared afterwards so hover effects and the grid are untouched.
          gsap.from(items, {
            rotateY: -105,
            transformOrigin: "left center",
            transformPerspective: 1100,
            opacity: 0,
            duration: 1.15,
            ease: "power3.out",
            stagger: 0.14,
            clearProps: "transform,transformOrigin",
            scrollTrigger: trigger(root),
          });
          break;
        case "stagger-left":
          gsap.from(items, {
            x: -60,
            opacity: 0,
            duration: 0.8,
            ease: EASE,
            stagger: 0.1,
            clearProps: "opacity,transform",
            scrollTrigger: trigger(root),
          });
          break;
        case "rows":
          gsap.from(items, {
            x: -48,
            opacity: 0,
            duration: 0.7,
            ease: EASE,
            stagger: 0.12,
            clearProps: "opacity,transform",
            scrollTrigger: trigger(root),
          });
          break;
        case "fade-up":
        default:
          gsap.from(items, { y: 48, opacity: 0, duration: 1, ease: EASE, clearProps: "opacity,transform", scrollTrigger: trigger(root) });
      }
    },
    { scope: ref, dependencies: [variant, targets] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
