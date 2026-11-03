"use client";

import { useRef, type ReactNode } from "react";

/** Review card that tilts in 3D toward the pointer, over the wireframe terrain. */
export function TiltCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);

  const onMove = (e: React.PointerEvent<HTMLLIElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateZ(0)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <li
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="rounded-[4px] border border-white/70 bg-white/60 p-4 shadow-[0_2px_10px_rgba(6,74,112,0.12)] backdrop-blur-md transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:shadow-[0_10px_28px_rgba(6,74,112,0.22)]"
    >
      {children}
    </li>
  );
}
