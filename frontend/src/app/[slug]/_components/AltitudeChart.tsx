"use client";

import { useState } from "react";
import type { PackageDetail } from "../data";
import { TrendingUpIcon, DownloadIcon } from "./icons";

type Unit = "m" | "ft";

const METERS_TO_FEET = 3.28084;

const POINT_WIDTH = 120;
const CHART_HEIGHT = 220;
const LABEL_AREA = 56;
const AXIS_PADDING = 12;
const SIDE_PADDING = 40;

function formatAltitude(meters: number, unit: Unit): string {
  const value = unit === "ft" ? Math.round(meters * METERS_TO_FEET) : Math.round(meters);
  return `${value.toLocaleString()}${unit}`;
}

/**
 * "Altitude Profile" chart — rebuilt 2026-08-27 from a real design
 * reference (replacing the old plain min/max-line "Altitude Chart"
 * card): a labeled icon header, a Meter/Feet unit toggle, and one
 * point *per real itinerary leg* (not one per day — see
 * `buildAltitudeProfile` in `map-package-detail.ts` for why a day
 * with two stops, e.g. fly to Lukla then trek on to Phakding, needs
 * two points here) with the destination place name + altitude
 * labeled directly above each point, matching the reference exactly
 * — day numbers below the axis can and do repeat when consecutive
 * points share a day, same as the reference shows ("Day 2, Day 2").
 *
 * Real pixel-width points (not a squashed 0–100 viewBox) so labels
 * have room to breathe; the chart scrolls horizontally past a modest
 * point count rather than cramming everything into the container
 * width. The horizontal scrollbar is real (native, just restyled),
 * not a decorative fake progress bar.
 *
 * The label color is `brand-neutral-800` — the reference's labels
 * read as a muted brown/olive in the screenshot, but that's not a
 * real token in this theme, and guessing an arbitrary hex off a
 * screenshot isn't a real design decision. Flagged for a real design
 * review rather than invented.
 */
export function AltitudeChart({ trip, bare = false }: { trip: PackageDetail; bare?: boolean }) {
  const [unit, setUnit] = useState<Unit>("m");
  const points = trip.altitudeProfile;

  if (points.length === 0) return null;

  const altitudes = points.map((point) => point.altitudeM);
  const min = Math.min(...altitudes);
  const max = Math.max(...altitudes);
  const range = max - min || 1;

  const chartWidth = SIDE_PADDING * 2 + POINT_WIDTH * Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => {
    const x = SIDE_PADDING + index * POINT_WIDTH;
    const y =
      LABEL_AREA +
      AXIS_PADDING +
      (CHART_HEIGHT - LABEL_AREA - AXIS_PADDING * 2) -
      ((point.altitudeM - min) / range) * (CHART_HEIGHT - LABEL_AREA - AXIS_PADDING * 2);
    return { x, y };
  });

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPoints = `${SIDE_PADDING},${CHART_HEIGHT} ${linePoints} ${chartWidth - SIDE_PADDING},${CHART_HEIGHT}`;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      {bare ? null : (
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-500">
          <TrendingUpIcon className="size-6" />
        </span>
        <h2 className="font-poppins text-heading-2xl font-bold tracking-wide text-primary-900 uppercase">
          Altitude Profile
        </h2>
        <button
          type="button"
          className="ml-auto flex items-center gap-3 rounded-pill border border-primary-500 px-5 py-2.5 font-poppins text-body-m font-medium text-primary-500"
        >
          <DownloadIcon className="size-[18px]" />
          Download Chart
        </button>
      </div>
      )}

      <div className="min-w-0 rounded-2xl border border-brand-neutral-300 bg-white p-6">
        <div className="font-poppins text-body-m text-brand-neutral-600">
          Altitude in:{" "}
          <button
            type="button"
            onClick={() => setUnit("m")}
            className={
              unit === "m"
                ? "font-bold text-brand-neutral-1000 underline"
                : "text-brand-neutral-500 hover:text-brand-neutral-800"
            }
          >
            Meter
          </button>{" "}
          |{" "}
          <button
            type="button"
            onClick={() => setUnit("ft")}
            className={
              unit === "ft"
                ? "font-bold text-brand-neutral-1000 underline"
                : "text-brand-neutral-500 hover:text-brand-neutral-800"
            }
          >
            Feet
          </button>
        </div>

        <div className="mt-3 overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary-300 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-brand-neutral-200 [&::-webkit-scrollbar]:h-1.5">
          <svg
            viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
            width={chartWidth}
            height={CHART_HEIGHT}
            className="block"
            role="img"
            aria-label="Altitude profile across the trek, in meters, by stop"
          >
            <polygon points={areaPoints} fill="var(--color-primary-100)" opacity="0.7" />
            <polyline
              points={linePoints}
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="2"
            />
            {coords.map((c, index) => {
              const point = points[index];
              return (
                <g key={index}>
                  <circle cx={c.x} cy={c.y} r="3.5" fill="var(--color-primary-500)" stroke="white" strokeWidth="1.5" />
                  {point.label ? (
                    <text
                      x={c.x}
                      y={c.y - 28}
                      textAnchor="middle"
                      className="font-poppins text-[11px] font-medium"
                      fill="var(--color-brand-neutral-800)"
                    >
                      {point.label}
                    </text>
                  ) : null}
                  <text
                    x={c.x}
                    y={c.y - 14}
                    textAnchor="middle"
                    className="font-poppins text-[11px] font-medium"
                    fill="var(--color-brand-neutral-800)"
                  >
                    {formatAltitude(point.altitudeM, unit)}
                  </text>
                </g>
              );
            })}
          </svg>

          <div
            className="relative mt-2 h-5 font-poppins text-body-s font-medium text-brand-neutral-700"
            style={{ width: chartWidth }}
          >
            {points.map((point, index) => (
              <span
                key={index}
                className="absolute -translate-x-1/2 text-center whitespace-nowrap"
                style={{ left: coords[index].x }}
              >
                Day {point.day || "–"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
