/**
 * Decodes a Google-encoded polyline into [lat, lng] pairs.
 *
 * Inlined rather than pulling in a dependency — this is the standard
 * algorithm and is ~25 lines. Legacy itinerary rows store their route legs
 * in this format (`encodedPolyline`), so the map has to read it.
 * Returns [] for empty/malformed input rather than throwing.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    for (const isLat of [true, false]) {
      let result = 0;
      let shift = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        if (Number.isNaN(byte)) return points;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index < encoded.length);

      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (isLat) lat += delta;
      else lng += delta;
    }

    // Malformed input decodes to nonsense coordinates; dropping out-of-range
    // points keeps a bad paste from dragging the map's bounds off to (0,0).
    const [dLat, dLng] = [lat / 1e5, lng / 1e5];
    if (dLat >= -90 && dLat <= 90 && dLng >= -180 && dLng <= 180) {
      points.push([dLat, dLng]);
    }
  }

  return points;
}

export interface RouteLeg {
  label: string;
  origin: [number, number] | null;
  destination: [number, number] | null;
  polyline: [number, number][];
}

/** Builds the map's route legs from the itinerary's stop rows. */
export function buildRouteLegs(
  stops: {
    itineraryTitle?: string;
    itineraryDay?: string;
    originCoordinate?: string;
    destinationCoordinate?: string;
    encodedPolyline?: string;
  }[],
): RouteLeg[] {
  return stops
    .map((stop) => ({
      label: stop.itineraryTitle || stop.itineraryDay || "Stop",
      origin: parseCoordinate(stop.originCoordinate),
      destination: parseCoordinate(stop.destinationCoordinate),
      polyline: stop.encodedPolyline ? decodePolyline(stop.encodedPolyline) : [],
    }))
    .filter((leg) => leg.origin || leg.destination || leg.polyline.length > 0);
}

/** Parses a "lat,lng" coordinate string. Returns null if unusable. */
export function parseCoordinate(value: string | null | undefined): [number, number] | null {
  if (!value) return null;
  const parts = value.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}
