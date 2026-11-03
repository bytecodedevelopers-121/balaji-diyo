import { Suspense, type ComponentType } from "react";
import { FileText, Mountain } from "lucide-react";
import { CmsProse } from "@/components/ui/CmsProse";
import type { PackageDetail } from "../data";
import { SectionRow, STAR_BULLETS } from "./SectionRow";
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
 * The nine headline facts, in display order, with their display labels:
 * [source label in `quickFacts`, shown label]. "Start & End Point" feeds both
 * "Starts" and "Ends" (split on a separator when it holds two places).
 */
const HEADLINE_FACTS: [string, string][] = [
  ["Duration", "Duration"],
  ["Difficulty", "Trip Grade"],
  ["Destination", "Country"],
  ["Max Altitude", "Maximum Altitude"],
  ["Group Size", "Group Size"],
  ["Start & End Point", "Starts"],
  ["Start & End Point", "Ends"],
  ["Activity", "Activities"],
  ["Best Seasons", "Best Time"],
];

function headlineFacts(facts: PackageDetail["quickFacts"]) {
  const result: { label: string; value: string; icon: string }[] = [];
  for (const [source, label] of HEADLINE_FACTS) {
    const fact = facts.find((f) => f.label === source);
    if (!fact) continue;
    let value = fact.value;
    if (source === "Start & End Point") {
      const parts = value.split(/\s+(?:-|–|—|to|&)\s+/i);
      if (parts.length >= 2) value = label === "Starts" ? parts[0] : parts[parts.length - 1];
    }
    result.push({ label, value, icon: source });
  }
  return result;
}


/**
 * The top of the page body: "Trip Facts" (bordered grid of icon/label/value
 * pairs plus the weather forecast), the trip highlights, and the full
 * "Overview" copy — each in the label-left `SectionRow` layout. The lead
 * intro paragraph now lives under the title (see `TripTitleBar`).
 */
export function HighlightsAndOverview({ trip }: { trip: PackageDetail }) {
  return (
    <div className="flex flex-col">
      <SectionRow id="trip-facts" label="Trip Facts" icon={<FileText aria-hidden="true" className="size-14" strokeWidth={1} />}>
        <div className="rounded-md border border-[#4f98bf] bg-white p-6 sm:p-8">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-8">
            {headlineFacts(trip.quickFacts).map((fact) => {
              const Icon = FACT_ICONS[fact.icon];
              return (
                <div key={fact.label} className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#4f98bf] sm:size-12">
                    {Icon ? <Icon className="size-5 text-white sm:size-6" /> : null}
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[14px] text-brand-neutral-700">{fact.label}</dt>
                    <dd className="text-[19px] leading-snug font-bold break-words whitespace-pre-line text-brand-neutral-900">
                      {fact.value}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
          <Suspense
            fallback={<div className="mt-7 h-28 animate-pulse rounded-xl border-t border-[#e7dfd2] bg-primary-100/40" aria-hidden />}
          >
            <WeatherForecast packageId={trip.id} />
          </Suspense>
        </div>
      </SectionRow>

      {trip.highlights.length > 0 ? (
        <SectionRow label="Highlights" icon={<Mountain aria-hidden="true" className="size-14" strokeWidth={1} />}>
          <ul className={`flex flex-col gap-3 text-[17px] text-brand-neutral-900 ${STAR_BULLETS}`}>
            {trip.highlights.map((highlight) => (
              <li key={highlight} className="leading-relaxed">
                {highlight}
              </li>
            ))}
          </ul>
        </SectionRow>
      ) : null}

      {trip.overview ? (
        <SectionRow id="overview" label="Overview" icon={<Mountain aria-hidden="true" className="size-14" strokeWidth={1} />}>
          <h3 className="mb-4 text-[26px] leading-tight font-medium text-brand-neutral-900">{trip.title} Overview</h3>
          <CmsProse
            html={trip.overview}
            className={`${STAR_BULLETS} [&_h2]:font-display! [&_h2]:text-[26px]! [&_h2]:font-semibold! [&_h3]:font-display! [&_h3]:text-[26px]! [&_h3]:font-semibold!`}
          />
        </SectionRow>
      ) : (
        <div id="overview" />
      )}
    </div>
  );
}
