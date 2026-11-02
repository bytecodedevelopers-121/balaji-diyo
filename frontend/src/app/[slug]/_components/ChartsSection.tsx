import type { PackageDetail } from "../data";
import { ChevronDownIcon } from "./icons";
import { AltitudeChart } from "./AltitudeChart";

const CHART_WIDTH = 100;
const CHART_HEIGHT = 40;
const PADDING_Y = 4;

function buildPoints(values: number[], min: number, max: number): string {
  const stepX = CHART_WIDTH / (values.length - 1);
  const range = max - min || 1;
  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = CHART_HEIGHT - PADDING_Y - ((value - min) / range) * (CHART_HEIGHT - PADDING_Y * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

/**
 * "Altitude Profile" (see `AltitudeChart` — rebuilt 2026-08-27 from a
 * real design reference, its own component now) and "Temperature
 * Chart" (max/min lines, day vs. °C) — the latter still a plain SVG
 * polyline computed from `trip.temperatureProfile`, no charting
 * library. Figma (node 1000006637) shows this as a static exported
 * chart image; card chrome (colors, toggle pills) is matched exactly,
 * the chart itself stays real/data-driven.
 */
export function ChartsSection({ trip }: { trip: PackageDetail }) {
  const hasTemperatureData = trip.temperatureProfile.length > 0;

  const maxTemps = trip.temperatureProfile.map((point) => point.maxC);
  const minTemps = trip.temperatureProfile.map((point) => point.minC);
  const tempMin = Math.min(...minTemps);
  const tempMax = Math.max(...maxTemps);
  const maxTempPoints = buildPoints(maxTemps, tempMin, tempMax);
  const minTempPoints = buildPoints(minTemps, tempMin, tempMax);

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <AltitudeChart trip={trip} />

      {hasTemperatureData ? (
      <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
        <h2 className="font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">Temperature Chart</h2>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-pill border border-brand-neutral-200 bg-brand-neutral-100 p-1">
            <span className="rounded-pill bg-primary-200 px-4 py-1.5 font-poppins text-body-m font-medium text-primary-900">
              Daily Temperature Variation
            </span>
            <span className="px-4 py-1.5 font-poppins text-body-m font-medium text-brand-neutral-900">
              Average Temperature (Month to Month)
            </span>
          </div>
          <span className="flex items-center gap-2 rounded-pill border border-brand-neutral-300 px-4 py-2 font-poppins text-body-m font-medium text-brand-neutral-900">
            January
            <ChevronDownIcon className="size-4" />
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4 font-poppins text-body-s font-medium text-brand-neutral-700">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-secondary-500" aria-hidden="true" /> Max °C
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary-500" aria-hidden="true" /> Min °C
          </span>
        </div>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="mt-3 h-56 w-full"
          role="img"
          aria-label="Daily max and min temperatures across the trek, in celsius, by day"
        >
          <polyline points={maxTempPoints} fill="none" stroke="var(--color-secondary-500)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          <polyline points={minTempPoints} fill="none" stroke="var(--color-primary-500)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-2 flex justify-between font-poppins text-body-s font-medium text-brand-neutral-700">
          <span>Day 1</span>
          <span>Day {trip.temperatureProfile.length}</span>
        </div>
      </section>
      ) : null}
    </div>
  );
}
