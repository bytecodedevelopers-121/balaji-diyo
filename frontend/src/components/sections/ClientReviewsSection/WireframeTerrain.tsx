"use client";

import { useEffect, useRef } from "react";

/**
 * Decorative rotating 3D wireframe mountain terrain, drawn on a 2D canvas
 * (no WebGL dependency). Sits behind the reviews panel; pauses off-screen
 * and renders a single static frame when reduced motion is requested.
 */
const GRID = 28;
const SIZE = 2.4;

function height(x: number, z: number) {
  const r = Math.hypot(x, z);
  const peaks =
    Math.exp(-((x - 0.5) ** 2 + (z + 0.2) ** 2) * 2.2) * 1.0 +
    Math.exp(-((x + 0.6) ** 2 + (z - 0.4) ** 2) * 3) * 0.75 +
    Math.exp(-((x + 0.1) ** 2 + (z + 0.8) ** 2) * 4) * 0.5;
  const ridges = (Math.sin(x * 5) * Math.cos(z * 4) + 1) * 0.04;
  return (peaks + ridges) * Math.max(0, 1 - r / 1.6);
}

export function WireframeTerrain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height_ = 0;
    let raf = 0;
    let visible = true;
    let angle = 0.6;

    const verts: number[][] = [];
    for (let i = 0; i <= GRID; i++) {
      for (let j = 0; j <= GRID; j++) {
        const x = (i / GRID - 0.5) * SIZE;
        const z = (j / GRID - 0.5) * SIZE;
        verts.push([x, height(x, z), z]);
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height_ = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height_ * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height_);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tilt = 0.55;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const scale = Math.min(width * 0.32, height_ * 0.9);
      const cx = width * 0.5;
      const cy = height_ * 0.62;

      const pts = verts.map(([x, y, z]) => {
        const rx = x * cos - z * sin;
        const rz = x * sin + z * cos;
        const ry = y * ct - rz * st;
        const rz2 = y * st + rz * ct + 3;
        const p = 3 / rz2;
        return [cx + rx * scale * p, cy - ry * scale * p, rz2];
      });

      ctx.lineWidth = 1;
      const n = GRID + 1;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const a = pts[i * n + j];
          const alpha = 0.1 + Math.min(0.28, verts[i * n + j][1] * 0.3);
          ctx.strokeStyle = `rgba(6, 74, 112, ${alpha})`;
          ctx.beginPath();
          if (i < GRID) {
            const b = pts[(i + 1) * n + j];
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
          }
          if (j < GRID) {
            const c = pts[i * n + j + 1];
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(c[0], c[1]);
          }
          ctx.stroke();
        }
      }
    };

    const tick = () => {
      if (visible) {
        angle += 0.0025;
        draw();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    draw();
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    if (!reduced) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}
