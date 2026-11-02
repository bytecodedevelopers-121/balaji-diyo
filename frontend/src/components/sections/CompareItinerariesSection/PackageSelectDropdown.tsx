"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { searchTrips } from "@/features/trips/api/search-trips";
import type { Trip } from "@/features/trips/types/trip.types";
import { addComparisonSlug, useComparisonSlugs } from "@/features/comparison/comparison-store";
import { FillImage } from "@/components/ui/FillImage";

/** Debounce delay before a query actually fires a request — same value HeaderSearchResults.tsx uses for its own typeahead. */
const DEBOUNCE_MS = 300;

/**
 * "Add a trip to compare" — an inline searchable dropdown on
 * /compare-itineraries itself (2026-09-03, user-requested), so a visitor
 * can build/extend a comparison right here instead of the only previous
 * path: open a trip's own page and click CompareButton.tsx there.
 *
 * Reuses `searchTrips` (`GET /packages?search=`) — the same client-side
 * lookup HeaderSearchResults.tsx already uses for its own typeahead, not
 * a second search implementation — but as a much simpler inline
 * combobox: no GSAP entrance/exit, no viewport-fixed/portaled panel,
 * since this only ever needs to sit directly under its own input rather
 * than overlay the page under the header.
 *
 * Results already in the comparison are filtered out rather than shown
 * disabled — picking a duplicate has no meaningful "compare it again"
 * outcome, so there's nothing useful a disabled row would communicate
 * beyond just not listing it.
 */
export function PackageSelectDropdown() {
  const selectedSlugs = useComparisonSlugs();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [results, setResults] = useState<Trip[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const shouldSearch = isOpen && trimmedQuery.length > 0;

  // Render-phase reset (React's documented pattern for adjusting state
  // when a value changes — same precedent as HeaderSearchResults.tsx's
  // own identical reset), not a `useEffect` branch: avoids a synchronous
  // `setState`-in-effect cascade for what's really just "the query
  // closed/emptied, so drop its stale results".
  const [wasSearching, setWasSearching] = useState(shouldSearch);
  if (shouldSearch !== wasSearching) {
    setWasSearching(shouldSearch);
    if (!shouldSearch) {
      setStatus("idle");
      setResults([]);
    }
  }

  useEffect(() => {
    if (!shouldSearch) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setStatus("loading");
      searchTrips(trimmedQuery, { signal: controller.signal })
        .then((trips) => {
          setResults(trips);
          setStatus("success");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setErrorMessage(
            error instanceof Error ? error.message : "Something went wrong. Please try again.",
          );
          setStatus("error");
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [shouldSearch, trimmedQuery]);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // `trip.slug` is typed as a required `string`, but some real packages
  // have a null slug in practice (backend/frontend/src/features/trips/
  // types/trip.types.ts's own type doesn't reflect this) — clicking one
  // of those used to silently do nothing: `addComparisonSlug` validates
  // against a non-empty-slug regex and drops anything that fails it, so
  // the click had no visible effect and no error either. Filtered out
  // here the same defensive way TrekkingRouteCard.tsx guards its own
  // `route.slug` before rendering a link for it.
  const visibleResults = results.filter((trip) => trip.slug && !selectedSlugs.includes(trip.slug));

  function handleSelect(trip: Trip) {
    addComparisonSlug(trip.slug);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label className="sr-only" htmlFor="compare-package-search">
        Add a trip to compare
      </label>
      <div className="flex h-11 items-center gap-2 rounded-full border border-brand-neutral-400 bg-brand-neutral-000 px-4 focus-within:border-primary-500">
        <Search aria-hidden="true" className="size-4 shrink-0 text-brand-neutral-700" strokeWidth={2} />
        <input
          id="compare-package-search"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Add a trip to compare…"
          className="min-w-0 flex-1 bg-transparent font-poppins text-body-s font-medium text-brand-neutral-1000 placeholder:text-brand-neutral-600 focus:outline-none"
        />
      </div>

      {isOpen && trimmedQuery.length > 0 ? (
        <div
          role="listbox"
          aria-label="Matching trips"
          className="absolute left-0 right-0 top-full z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-brand-neutral-300 bg-brand-neutral-000 p-2 shadow-card-strong"
        >
          {status === "loading" ? (
            <p className="flex items-center gap-2 px-3 py-2 font-poppins text-body-s text-brand-neutral-700">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Searching…
            </p>
          ) : status === "error" ? (
            <p className="px-3 py-2 font-poppins text-body-s text-error-700">{errorMessage}</p>
          ) : visibleResults.length === 0 ? (
            <p className="px-3 py-2 font-poppins text-body-s text-brand-neutral-700">
              {results.length > 0
                ? "No addable trips match — the rest are already selected or unavailable."
                : `No trips found for “${trimmedQuery}”.`}
            </p>
          ) : (
            <ul className="flex flex-col">
              {visibleResults.map((trip) => (
                <li key={trip.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(trip)}
                    role="option"
                    aria-selected={false}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-brand-neutral-100"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-brand-neutral-200">
                      {trip.imageUrl ? (
                        <FillImage
                          src={trip.imageUrl}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 size-full object-cover" sizes="96px" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-poppins text-body-s font-semibold text-brand-neutral-1000">
                        {trip.title}
                      </span>
                      {trip.duration && trip.durationType ? (
                        <span className="block font-poppins text-xs text-brand-neutral-600">
                          {trip.duration} {trip.durationType}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
