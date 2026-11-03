"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Review card resting at a slight angle (`angle`, degrees). It straightens on
 * hover and tilts in 3D toward the pointer, over the wireframe terrain.
 */
export function TiltCard({ children, angle = 0 }: { children: ReactNode; angle?: number }) {
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
      style={{ "--r": `${angle}deg` } as CSSProperties}
      className="rotate-(--r) rounded-[24px] border border-[#efe6da] bg-white p-6 shadow-[0_10px_30px_rgba(6,74,112,0.10)] transition-[transform,rotate,box-shadow] duration-300 ease-out will-change-transform hover:rotate-0 hover:shadow-[0_16px_40px_rgba(6,74,112,0.18)]"
    >
      {children}
    </li>
  );
}
