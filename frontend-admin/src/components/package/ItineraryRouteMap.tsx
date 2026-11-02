import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteLeg } from "@/lib/polyline";

// Leaflet's default marker icons are resolved from the CSS as relative image
// paths, which Vite doesn't bundle — so they 404 and markers render blank.
// A small inline divIcon sidesteps the asset pipeline entirely.
const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#4f46e5;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface ItineraryRouteMapProps {
  legs: RouteLeg[];
}

export function ItineraryRouteMap({ legs }: ItineraryRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Create the map once; StrictMode double-invokes effects, so the cleanup
  // must fully tear the instance down or Leaflet throws "already initialized".
  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([28.3949, 84.124], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Redraw markers/lines whenever the coordinates change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds: [number, number][] = [];

    for (const leg of legs) {
      if (leg.origin) {
        L.marker(leg.origin, { icon: markerIcon }).bindTooltip(`${leg.label} — origin`).addTo(layer);
        bounds.push(leg.origin);
      }
      if (leg.destination) {
        L.marker(leg.destination, { icon: markerIcon }).bindTooltip(`${leg.label} — destination`).addTo(layer);
        bounds.push(leg.destination);
      }

      // Prefer the real encoded route; fall back to a straight origin→destination line.
      if (leg.polyline.length > 1) {
        L.polyline(leg.polyline, { color: "#4f46e5", weight: 3 }).addTo(layer);
        bounds.push(...leg.polyline);
      } else if (leg.origin && leg.destination) {
        L.polyline([leg.origin, leg.destination], { color: "#4f46e5", weight: 2, dashArray: "5,6" }).addTo(layer);
      }
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24], maxZoom: 13 });
    }
  }, [legs]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-lg border border-gray-200" />
      {legs.length === 0 ? (
        <p className="text-xs text-gray-500">
          Add origin/destination coordinates (as <code>lat,lng</code>) to a stop to plot it here.
        </p>
      ) : (
        <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
          {legs.map((leg, i) => (
            <li key={i} className="truncate">
              <span className="font-medium text-gray-800">{leg.label}</span>
              {leg.polyline.length > 1 && <span className="ml-1 text-indigo-600">· route</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
