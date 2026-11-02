import type { PackageDetail } from "../data";
import { MapIcon } from "./icons";
import { RouteMapLoader } from "./RouteMapLoader";
import type { RouteMapStop } from "./RouteMap";

/**
 * "Trip Route Map" — a real interactive Leaflet/OpenStreetMap route (see
 * `RouteMap.tsx`, dynamically imported here with `ssr: false` since
 * Leaflet needs `window`) plotting the package's real per-day
 * coordinates and decoded route polyline (`trip.routePath` /
 * `ItineraryDay.lat`/`lng`, both from real `ItineraryDetail` columns —
 * see `map-package-detail.ts`), replacing the previous stylized fake
 * dotted-line placeholder that only ever sampled a hardcoded 5 days.
 * The waypoint strip below now lists every real day with a coordinate,
 * not a fixed sample — the existing grid already wraps to more rows.
 */
export function MapSection({ trip }: { trip: PackageDetail }) {
  const days = trip.detailedItinerary.flatMap((leg) => leg.days);
  const stops: RouteMapStop[] = days
    .filter((day): day is typeof day & { lat: number; lng: number } => day.lat !== undefined && day.lng !== undefined)
    .map((day) => ({
      day: day.day,
      place: day.locations[day.locations.length - 1]?.label ?? day.title,
      altitudeM: day.altitudeM,
      lat: day.lat,
      lng: day.lng,
    }));

  if (trip.routePath.length === 0 && stops.length === 0) {
    return null;
  }

  // No API key needed — same pattern ContactMapSection already uses to
  // open a real location in the actual Google Maps app, just with every
  // real waypoint chained into a multi-stop directions URL instead of
  // one search query.
  const directionsUrl =
    stops.length > 0
      ? `https://www.google.com/maps/dir/${stops.map((stop) => `${stop.lat},${stop.lng}`).join("/")}`
      : undefined;

  return (
    <section className="rounded-2xl border border-[#fbc99c] bg-white">
      {/*
        `isolate` matters here, not just `relative` — Leaflet's own panes
        and controls carry internal z-indexes up to 1000 (its zoom
        control/attribution), and `position: relative` alone doesn't open
        a new stacking context. Without `isolate`, those z-indexes were
        comparing directly against TabNav's sticky `z-10` in the *page's*
        stacking context and winning, so the map's controls floated above
        the sticky tab bar while scrolling past it. `isolate` seals this
        div's descendants into their own stacking context so nothing
        inside can escape and overlap siblings elsewhere on the page.
      */}
      <div className="relative isolate aspect-16/9 overflow-hidden rounded-t-2xl bg-primary-100">
        <RouteMapLoader
          path={trip.routePath}
          stops={stops}
        />
        {directionsUrl ? (
          // top-right, not the Figma-original bottom-right — Leaflet's
          // own attribution control defaults to the bottom-right corner
          // (required by OSM's tile usage policy, can't be removed), and
          // its zoom control sits top-left, so top-right is the one
          // corner clear of both.
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute top-6 right-6 z-[500] flex items-center gap-2 rounded-pill bg-primary-500 px-4 py-2.5 font-poppins text-body-m font-medium text-white shadow-card-soft transition-opacity hover:opacity-90"
          >
            <MapIcon className="size-5" />
            View Map
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-brand-neutral-200 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
        {stops.map((stop, index) => (
          <div
            key={`${stop.day}-${index}`}
            className="flex flex-col gap-0.5 p-4"
          >
            <span className="font-raleway text-[10px] font-bold text-primary-500">
              {index === 0 ? "START" : `DAY ${stop.day}`}
            </span>
            <span className="font-poppins text-body-l font-medium text-brand-neutral-900">{stop.place}</span>
            <span className="font-poppins text-body-s font-medium text-brand-neutral-700">{stop.altitudeM.toLocaleString()}m</span>
          </div>
        ))}
      </div>
    </section>
  );
}
