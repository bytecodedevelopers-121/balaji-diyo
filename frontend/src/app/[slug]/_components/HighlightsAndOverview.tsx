import { Suspense, type ComponentType } from "react";
import { CmsProse } from "@/components/ui/CmsProse";
import type { PackageDetail } from "../data";
import { WeatherForecast } from "./WeatherForecast";
import {
  BusIcon,
  ClockIcon,
  FoodIcon,
  GaugeIcon,
  GlobeIcon,
  HikerIcon,
  HotelIcon,
  MountainIcon,
  MountainSnowIcon,
  SignpostIcon,
  UsersIcon,
  WeatherIcon,
} from "./icons";

const FACT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Destination: GlobeIcon,
  Duration: ClockIcon,
  Difficulty: GaugeIcon,
  Activity: HikerIcon,
  "Max Altitude": MountainIcon,
  "Group Size": UsersIcon,
  Accommodation: HotelIcon,
  Meals: FoodIcon,
  Transport: BusIcon,
  "Start & End Point": SignpostIcon,
  "Best Seasons": WeatherIcon,
  "Walking Hours per Day": HikerIcon,
};

/**
 * The "Overview" tab content: lead intro paragraph, the 12-item
 * icon/label/value quick-facts grid, the "Trip Highlights" list, and the
 * full "<Trip> Overview" copy — matches Figma nodes 1000006463,
 * 1000006471, 1000006478, and 1000006504.
 */
export function HighlightsAndOverview({ trip }: { trip: PackageDetail }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8 text-body-l font-poppins font-medium text-brand-neutral-900">
        {trip.intro}
      </section>

      <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
        {/*
          Figma's mobile frame (node 596:26470) keeps this a 2-up grid
          all the way down, not the 1-up stack `sm:grid-cols-3` implied
          below that breakpoint — smaller icon/gap sizes below `sm` so
          the pair still fits a narrow phone width without the value
          text getting squeezed to a sliver.
        */}
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-8">
          {trip.quickFacts.map((fact) => {
            const Icon = FACT_ICONS[fact.label];
            return (
              <div key={fact.label} className="flex min-w-0 items-center gap-3 sm:gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-100 sm:size-14">
                  {Icon ? <Icon className="size-5 text-primary-500 sm:size-6" /> : null}
                </span>
                <div className="min-w-0">
                  <dt className="text-body-s font-poppins font-medium text-brand-neutral-700">{fact.label}</dt>
                  <dd className="whitespace-pre-line break-words text-body-l font-poppins font-medium text-brand-neutral-1000">
                    {fact.value}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
        <Suspense
          fallback={<div className="mt-7 h-28 animate-pulse rounded-xl border-t border-[#fbc99d] bg-primary-100/40" aria-hidden />}
        >
          <WeatherForecast packageId={trip.id} />
        </Suspense>
      </section>

      {/*
        Not the thick orange-gradient picture-frame this used to be — the
        card itself is a single cream-to-blue gradient with a mountain
        range watermark bleeding off the bottom-right corner, orange
        (not primary blue) icons, plain `border-[#fbc99d]` like every
        other card. The watermark here is a hand-built approximation of
        Figma's actual export (node 596:25349, a many-layer clipped SVG
        illustration) — Figma's MCP tool-call limit was hit before that
        asset could be pulled, so this isn't the exact art, just a
        stand-in silhouette in the same two tones/position.
      */}
      <section className="relative overflow-hidden rounded-2xl border border-[#fbc99d] bg-gradient-to-b from-[#fef2e2] to-[#c3d3e8] p-4 shadow-card-strong sm:p-8">
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio="xMaxYMax slice"
          className="pointer-events-none absolute inset-0 size-full opacity-70"
          aria-hidden="true"
        >
          <path d="M0 300 L60 190 L120 250 L180 150 L230 220 L290 130 L340 210 L400 170 L400 300 Z" fill="#9fb6d6" opacity="0.55" />
          <path d="M40 300 L110 220 L160 260 L220 180 L270 240 L330 160 L400 230 L400 300 Z" fill="#c3d3e8" opacity="0.8" />
        </svg>
        <div className="relative">
          <h2 className="text-raleway-3xl font-poppins font-medium text-brand-neutral-1000">Trip Highlights</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {trip.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-body-l font-poppins font-medium text-brand-neutral-900">
                <MountainSnowIcon className="mt-0.5 size-5 shrink-0 text-secondary-500" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {trip.overview ? (
        <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
          <h2 className="text-raleway-3xl font-poppins font-medium text-brand-neutral-1000">{trip.title} Overview</h2>
          <CmsProse html={trip.overview} className="mt-4" />
        </section>
      ) : null}
    </div>
  );
}
