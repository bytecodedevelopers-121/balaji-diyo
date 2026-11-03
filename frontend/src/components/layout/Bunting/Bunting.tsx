"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Festival flags on a string that ripples along the page like a snake.
 * Drawn on a canvas; static (still wavy) when reduced motion is requested.
 */
const FLAGS = [
  { fill: "#2f6db5", stroke: null },
  { fill: "#ffffff", stroke: "#d5d5d5" },
  { fill: "#d64545", stroke: null },
  { fill: "#2f7d5b", stroke: null },
  { fill: "#f5b335", stroke: null },
];
const STEP = 70;
const HEIGHT = 64;
const BASE_Y = 14;
const AMPLITUDE = 6;
const WAVELENGTH = 420;
const SPEED = 1.6; // radians per second
const STRING_COLOR = "#9fc4dc";

export function Bunting({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = (Math.PI * 2) / WAVELENGTH;
    let width = 0;
    let raf = 0;
    const t0 =performance.now();

    const yAt = (x: number, phase: number) => BASE_Y + AMPLITUDE * Math.sin(k * x - phase);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      canvas.width = width * dpr;
      canvas.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const phase = reduced ? 0 : ((now - t0) / 1000) * SPEED;
      ctx.clearRect(0, 0, width, HEIGHT);

      ctx.strokeStyle = STRING_COLOR;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x <= width + 4; x += 4) {
        const y = yAt(x, phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const count = Math.ceil(width / STEP) + 1;
      for (let i = 0; i < count; i++) {
        const x = i * STEP + STEP / 2;
        const flag = FLAGS[i % FLAGS.length];
        const slope = AMPLITUDE * k * Math.cos(k * x - phase);
        // Flags hang straight down but lean slightly with the wave.
        const sway = Math.atan(slope) * 0.6;
        ctx.save();
        ctx.translate(x, yAt(x, phase));
        ctx.rotate(sway);
        ctx.beginPath();
        ctx.moveTo(-18, -1);
        ctx.lineTo(18, -1);
        ctx.lineTo(0, 34);
        ctx.closePath();
        ctx.fillStyle = flag.fill;
        ctx.fill();
        if (flag.stroke) {
          ctx.strokeStyle = flag.stroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const tick = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(tick);
    };

    resize();
    draw(t0);
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    if (!reduced) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none block w-full", className)}
      style={{ height: HEIGHT }}
    />
  );
}
