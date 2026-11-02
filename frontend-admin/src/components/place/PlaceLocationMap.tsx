import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { parseCoordinate } from "@/lib/polyline";

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#4f46e5;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.3)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface PlaceLocationMapProps {
  value: string;
  onChange: (value: string) => void;
}

const formatCoordinate = (lat: number, lng: number) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

/** Clickable Leaflet picker backed by the same `lat,lng` string saved for itinerary stops. */
export function PlaceLocationMap({ value, onChange }: PlaceLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initial = parseCoordinate(value);
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(initial ?? [28.3949, 84.124], initial ? 12 : 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const setMarker = (coordinate: [number, number]) => {
      markerRef.current?.remove();
      const marker = L.marker(coordinate, { icon: markerIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const point = marker.getLatLng();
        onChangeRef.current(formatCoordinate(point.lat, point.lng));
      });
      markerRef.current = marker;
    };

    if (initial) setMarker(initial);
    map.on("click", (event: L.LeafletMouseEvent) => {
      const coordinate: [number, number] = [event.latlng.lat, event.latlng.lng];
      setMarker(coordinate);
      onChangeRef.current(formatCoordinate(...coordinate));
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The initial value is deliberately read only when Leaflet is created;
    // the synchronization effect below handles later form edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const coordinate = parseCoordinate(value);
    if (!coordinate) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) markerRef.current.setLatLng(coordinate);
    else {
      const marker = L.marker(coordinate, { icon: markerIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const point = marker.getLatLng();
        onChangeRef.current(formatCoordinate(point.lat, point.lng));
      });
      markerRef.current = marker;
    }
    map.panTo(coordinate);
  }, [value]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-lg border border-gray-200" />
      <p className="text-xs text-gray-500">Click the map to place the marker. Drag the marker for fine adjustment, or edit the coordinates manually above.</p>
    </div>
  );
}
