"use client";

import { useEffect, useState } from "react";

const LINE_ONE = "Live the Nepal";
const LINE_TWO = "you’ve only dreamed of.";
const TOTAL = LINE_ONE.length + LINE_TWO.length;

const TYPE_MS = 65;
/** How long the finished headline stays before it starts over. */
const HOLD_MS = 3200;
const RESTART_MS = 500;

/** Takes no width of its own, so it can never push the last word onto a new line. */
function Caret() {
  return (
    <span aria-hidden="true" className="relative inline-block w-0 align-baseline">
      <span className="absolute bottom-[0.05em] left-[0.08em] h-[0.85em] w-[3px] animate-pulse bg-logo-sun" />
    </span>
  );
}

/**
 * The hero headline, typed one letter at a time: "Live the Nepal" first, then the
 * yellow line, and once it is complete it waits a moment and starts over. The
 * full text is laid out invisibly so nothing below it jumps while it types, and
 * is also kept for screen readers. With reduced motion it simply shows the whole
 * headline.
 */
export function HeroHeadline() {
  const [typed, setTyped] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const delay = typed < TOTAL ? (typed === 0 ? RESTART_MS : TYPE_MS) : HOLD_MS;
    const timer = window.setTimeout(() => setTyped(typed < TOTAL ? typed + 1 : 0), delay);
    return () => window.clearTimeout(timer);
  }, [typed, reducedMotion]);

  const shown = reducedMotion ? TOTAL : typed;
  const first = LINE_ONE.slice(0, Math.min(shown, LINE_ONE.length));
  const second = LINE_TWO.slice(0, Math.max(0, shown - LINE_ONE.length));
  const typingFirst = shown < LINE_ONE.length || (shown === LINE_ONE.length && second === "");

  return (
    <h1 className="font-playfair-display mt-8 text-[clamp(44px,8.5vw,92px)] leading-[1.08] font-bold">
      <span className="sr-only">Nepal&apos;s Local Trekking Agency — {LINE_ONE} {LINE_TWO}</span>
      <span aria-hidden="true" className="block">
        <span className="relative inline-block">
          <span className="invisible">{LINE_ONE}</span>
          <span className="absolute inset-0 text-left">
            {first}
            {typingFirst && !reducedMotion ? <Caret /> : null}
          </span>
        </span>
      </span>
      <span aria-hidden="true" className="block text-logo-sun italic">
        <span className="relative inline-block">
          <span className="invisible">{LINE_TWO}</span>
          <span className="absolute inset-0 text-left">
            {second}
            {!typingFirst && shown < TOTAL && !reducedMotion ? <Caret /> : null}
          </span>
        </span>
      </span>
    </h1>
  );
}
