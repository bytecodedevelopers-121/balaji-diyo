/**
 * Decodes a Google-encoded polyline string into `[lat, lng]` pairs — the
 * standard algorithm (https://developers.google.com/maps/documentation/utilities/polylinealgorithm),
 * hand-rolled rather than pulled in as a dependency since it's ~20 lines
 * and this codebase already prefers that for small, well-known utilities
 * (see e.g. `lib/decimal.ts`'s own comment). Used for
 * `ItineraryDetail.encodedPolyline`, real per-leg route data confirmed
 * live on ~73% of a real package's itinerary rows.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}
