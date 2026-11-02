"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface RouteMapStop {
  day: number;
  place: string;
  altitudeM: number;
  lat: number;
  lng: number;
}

interface RouteMapProps {
  path: [number, number][];
  stops: RouteMapStop[];
}

/**
 * The real interactive map — a `"use client"` component so it can be
 * dynamically imported with `ssr: false` from `MapSection.tsx` (Leaflet
 * touches `window`/`document` at import time, so it can never run
 * server-side). OpenStreetMap tiles, no API key/billing — same
 * no-key-map precedent `ContactMapSection` already established for a
 * single pinned location; this one plots a real multi-point route.
 *
 * The pin icon reuses the outline this page's own `PinIcon` (icons.tsx)
 * already draws, as a Leaflet `divIcon` (raw HTML, not JSX — Leaflet's
 * own marker API, not React's) inside a filled circle, matching the old
 * placeholder map's pin styling rather than Leaflet's default marker
 * image (which 404s under most bundlers unless separately patched).
 */
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:var(--color-primary-500);box-shadow:0 1px 4px rgba(0,0,0,0.35);color:#fff"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

/** Fits the map to every plotted point right after mount — more reliable across react-leaflet versions than `MapContainer`'s own `bounds` prop. */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
  }, [map, points]);
  return null;
}

export function RouteMap({ path, stops }: RouteMapProps) {
  const allPoints = path.length > 0 ? path : stops.map((stop): [number, number] => [stop.lat, stop.lng]);
  // Only used for the very first paint before FitBounds runs; MapSection
  // never renders this component at all when there are no points.
  const initialCenter = allPoints[0] ?? [27.7172, 85.324];

  return (
    <MapContainer
      center={initialCenter}
      zoom={9}
      scrollWheelZoom={false}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path.length > 1 ? (
        <Polyline
          positions={path}
          pathOptions={{ color: "var(--color-primary-500)", weight: 3 }}
        />
      ) : null}
      {stops.map((stop) => (
        <Marker
          key={`${stop.day}-${stop.lat}-${stop.lng}`}
          position={[stop.lat, stop.lng]}
          icon={pinIcon}
        >
          <Popup>
            <strong>Day {stop.day}</strong>
            {stop.place ? ` — ${stop.place}` : ""}
            {stop.altitudeM > 0 ? <div>{stop.altitudeM.toLocaleString()} m</div> : null}
          </Popup>
        </Marker>
      ))}
      <FitBounds points={allPoints} />
    </MapContainer>
  );
}
