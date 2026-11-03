"use client";

import { tripHref } from "@/lib/trip-href";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  removeComparisonSlug,
  useComparisonSlugs,
} from "@/features/comparison/comparison-store";
import type {
  ComparisonField,
  ComparisonPackagesResponse,
  ComparisonTrip,
} from "@/features/comparison/comparison.types";
import { PackageSelectDropdown } from "./PackageSelectDropdown";

const rows: Array<{ key: ComparisonField; label: string }> = [
  { key: "difficulty", label: "Difficulty level" },
  { key: "duration", label: "Duration" },
  { key: "altitude", label: "Max altitude" },
  { key: "season", label: "Best season" },
  { key: "price", label: "Price" },
  { key: "walkingHours", label: "Daily walking hours" },
  { key: "accommodation", label: "Accommodation type" },
  { key: "highlights", label: "Highlights" },
];

export function CompareItinerariesSection() {
  const selectedSlugs = useComparisonSlugs();
  const selectionKey = selectedSlugs.join(",");
  const [result, setResult] = useState<{
    key: string;
    trips: ComparisonTrip[];
    missingSlugs: string[];
    error: string | null;
  }>({ key: "", trips: [], missingSlugs: [], error: null });

  useEffect(() => {
    if (selectionKey.length === 0) return;

    const controller = new AbortController();

    fetch(`/api/compare-packages?slugs=${encodeURIComponent(selectionKey)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        return (await response.json()) as ComparisonPackagesResponse;
      })
      .then((data) => {
        setResult({
          key: selectionKey,
          trips: data.items,
          missingSlugs: data.missing,
          error: null,
        });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setResult({
          key: selectionKey,
          trips: [],
          missingSlugs: [],
          error: "We couldn’t load the selected trips. Please try again.",
        });
      });

    return () => controller.abort();
  }, [selectionKey]);

  const isCurrentResult = result.key === selectionKey;
  const isLoading = selectionKey.length > 0 && !isCurrentResult;
  const missingSlugs = isCurrentResult ? result.missingSlugs : [];
  const error = isCurrentResult ? result.error : null;
  const visibleTrips = useMemo(
    () =>
      isCurrentResult
        ? result.trips.filter((trip) => selectedSlugs.includes(trip.slug))
        : [],
    [isCurrentResult, result.trips, selectedSlugs],
  );
  const gridTemplateColumns = `clamp(120px, 13.4vw, 192px) repeat(${visibleTrips.length}, minmax(clamp(280px, 24vw, 340px), 1fr))`;
  const showInitialLoading = isLoading && visibleTrips.length === 0;

  return (
    <section className="bg-brand-neutral-000 pb-12 pt-10 md:pb-14 md:pt-12">
      <div className="mx-auto max-w-[1440px] px-6 md:px-16">
        <Breadcrumbs
          tone="dark"
          items={[{ label: "Home", href: "/" }, { label: "Compare Itineraries" }]}
          className="[&_ol]:justify-start"
        />
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-poppins text-[32px] leading-[1.35] font-bold text-brand-neutral-1000 sm:text-[36px]">
              Compare Itineraries
            </h1>
            {selectedSlugs.length > 0 ? (
              <p className="mt-2 font-poppins text-sm text-brand-neutral-700">
                {selectedSlugs.length} {selectedSlugs.length === 1 ? "trip" : "trips"} selected
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <PackageSelectDropdown />
            {isLoading && visibleTrips.length > 0 ? (
              <span className="flex items-center gap-2 text-sm text-brand-neutral-700" role="status">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Updating comparison…
              </span>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
            {error}
          </div>
        ) : null}
        {missingSlugs.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
            <span>
              {missingSlugs.length === 1 ? "One selected trip is" : `${missingSlugs.length} selected trips are`} no longer available and cannot be compared.
            </span>
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => missingSlugs.forEach(removeComparisonSlug)}
            >
              Remove unavailable
            </button>
          </div>
        ) : null}
      </div>

      <div className="w-full px-6">
        {showInitialLoading ? (
          <div className="mt-10 flex min-h-52 items-center justify-center" role="status">
            <LoaderCircle className="size-7 animate-spin text-primary-500" aria-hidden="true" />
            <span className="sr-only">Loading selected trips</span>
          </div>
        ) : visibleTrips.length > 0 ? (
          <div
            className="mt-10 hidden overflow-x-auto pb-4 md:block [scrollbar-color:#050505_#e0e0e0] [scrollbar-width:thin]"
            aria-label="Trip itinerary comparison"
          >
            <div className="grid w-full min-w-[960px]" style={{ gridTemplateColumns }}>
              <div aria-hidden="true" className="sticky left-0 z-30 bg-brand-neutral-000" />
              {visibleTrips.map((trip) => (
                <article key={trip.slug} className="relative border-l border-brand-neutral-300 px-3 pb-3">
                  <div className="relative h-[248px] overflow-hidden rounded-xl bg-brand-neutral-200">
                    {trip.image ? (
                      <Image src={trip.image} alt={trip.imageAlt} fill sizes="380px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center font-poppins text-sm text-brand-neutral-700">
                        No image available
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeComparisonSlug(trip.slug)}
                      aria-label={`Remove ${trip.title} from comparison`}
                      className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-md bg-white text-brand-neutral-1000 shadow-sm transition-colors hover:bg-brand-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                    >
                      <X aria-hidden="true" className="size-7" strokeWidth={1.8} />
                    </button>
                  </div>
                  <h2 className="px-6 pb-1 pt-6 font-poppins text-[18px] leading-[1.6] font-bold text-primary-700">
                    <Link href={tripHref(trip.slug)} className="hover:underline">{trip.title}</Link>
                  </h2>
                </article>
              ))}

              {rows.flatMap((row) => [
                <div
                  key={`${row.key}-label`}
                  className="sticky left-0 z-20 flex min-h-[48px] items-center border-t border-brand-neutral-300 bg-brand-neutral-000 py-3 pr-5 font-poppins text-[16px] leading-[1.55] font-medium text-brand-neutral-900"
                >
                  {row.label}
                </div>,
                ...visibleTrips.map((trip) => (
                  <div
                    key={`${row.key}-${trip.slug}`}
                    className="flex min-h-[48px] items-center border-l border-t border-brand-neutral-300 px-8 py-3 font-poppins text-[16px] leading-[1.55] font-medium text-brand-neutral-900"
                  >
                    {trip.details[row.key]}
                  </div>
                )),
              ])}
            </div>
          </div>
        ) : null}
        {!showInitialLoading && visibleTrips.length > 0 ? (
          <div className="mt-8 flex flex-col gap-6 md:hidden" aria-label="Trip itinerary comparison">
            {visibleTrips.map((trip) => (
              <article key={trip.slug} className="overflow-hidden rounded-xl border border-brand-neutral-300 bg-brand-neutral-000">
                <div className="relative h-52 bg-brand-neutral-200">
                  {trip.image ? (
                    <Image src={trip.image} alt={trip.imageAlt} fill sizes="100vw" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center font-poppins text-sm text-brand-neutral-700">
                      No image available
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeComparisonSlug(trip.slug)}
                    aria-label={`Remove ${trip.title} from comparison`}
                    className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-md bg-white text-brand-neutral-1000 shadow-sm transition-colors hover:bg-brand-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                  >
                    <X aria-hidden="true" className="size-6" strokeWidth={1.8} />
                  </button>
                </div>
                <h2 className="px-4 pb-2 pt-4 font-poppins text-[18px] leading-[1.5] font-bold text-primary-700">
                  <Link href={tripHref(trip.slug)} className="hover:underline">{trip.title}</Link>
                </h2>
                <dl className="px-4 pb-2">
                  {rows.map((row) => (
                    <div key={row.key} className="border-t border-brand-neutral-300 py-3 font-poppins">
                      <dt className="text-xs font-medium uppercase tracking-wide text-brand-neutral-700">{row.label}</dt>
                      <dd className="mt-1 text-[15px] leading-[1.55] font-medium text-brand-neutral-900">{trip.details[row.key]}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        ) : null}
        {!showInitialLoading && visibleTrips.length === 0 ? (
          <div className="mt-10 rounded-xl border border-brand-neutral-300 px-6 py-14 text-center">
            <p className="font-poppins text-lg text-brand-neutral-800">No trips are selected for comparison.</p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-brand-neutral-700">
              Use the dropdown above to add a trip directly, or open one and choose Compare — your
              selections will stay available as you browse.
            </p>
            <Link href="/" className="mt-5 inline-flex rounded-full bg-primary-500 px-6 py-3 font-poppins font-semibold text-white hover:bg-primary-600">
              Explore trips
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
