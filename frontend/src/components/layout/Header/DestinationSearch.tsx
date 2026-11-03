"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchTrips } from "@/features/trips/api/search-trips";
import type { Trip } from "@/features/trips/types/trip.types";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import { ALL_SAMPLE_TRIPS } from "@/lib/sample-trips";

const DEBOUNCE_MS = 300;

/** Live trips from the API; when it has none (empty database) the sample trips that match the words typed. */
async function findTrips(query: string, signal?: AbortSignal): Promise<Trip[]> {
  const trips = await searchTrips(query, { signal }).catch((error: unknown) => {
    if (signal?.aborted) throw error;
    return [] as Trip[];
  });
  if (trips.length > 0 || !SHOW_SAMPLE_DATA) return trips;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return ALL_SAMPLE_TRIPS.filter((trip) => {
    const haystack = `${trip.title} ${trip.slug} ${trip.badge ?? ""}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  }).slice(0, 6);
}

/**
 * The destination menu's search pill — type to see live trip matches in a
 * list above the field; SEARCH (or Enter) opens the first match.
 */
export function DestinationSearch({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Trip[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      findTrips(trimmed, controller.signal)
        .then((trips) => {
          setResults(trips);
          setSearched(true);
        })
        .catch(() => {
          // Aborted — a newer query replaces these results.
        });
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const hasQuery = query.trim().length > 0;

  async function go(event: React.FormEvent) {
    event.preventDefault();
    if (!hasQuery) return;
    // Don't wait on the debounce: search right now if the list isn't ready, then open the best match.
    const matches = searched && results.length > 0 ? results : await findTrips(query.trim()).catch(() => []);
    setResults(matches);
    setSearched(true);
    const first = matches[0];
    if (!first) return;
    onNavigate();
    router.push(`/${first.slug}`);
  }

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      {hasQuery && searched ? (
        <div className="absolute right-0 bottom-full left-0 mb-2 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-[#0b6a99] p-2 shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
          {results.length > 0 ? (
            <ul>
              {results.map((trip) => (
                <li key={trip.id}>
                  <Link
                    href={`/${trip.slug}`}
                    onClick={onNavigate}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 text-[14px] text-white hover:bg-white/10"
                  >
                    <span className="font-semibold">{trip.title}</span>
                    {trip.priceFrom ? <span className="shrink-0 text-[12px] text-logo-sun">From US${trip.priceFrom}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-[14px] text-white/70">No trips match &ldquo;{query.trim()}&rdquo;.</p>
          )}
        </div>
      ) : null}

      <form
        role="search"
        onSubmit={go}
        className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 py-1.5 pr-1.5 pl-5"
      >
        <Search aria-hidden="true" className="size-4 shrink-0 text-logo-sun" />
        <label htmlFor="destination-menu-search" className="sr-only">
          Search trips
        </label>
        <input
          id="destination-menu-search"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!event.target.value.trim()) setSearched(false);
          }}
          placeholder="Find an adventure — Everest, safari, honeymoon…"
          autoComplete="off"
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/55 focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-logo-sun px-7 text-[13px] font-bold tracking-wide text-logo-navy-dark uppercase transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>
    </div>
  );
}
