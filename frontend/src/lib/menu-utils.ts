import type { Trip } from "@/features/trips/types/trip.types";

/** Photos used when a menu entry has none of its own — picked by name so each gets a stable, different one. */
const FALLBACK_IMAGES = [
  "/images/journey/trek.jpg",
  "/images/trips/featured-annapurna-trek.jpg",
  "/images/journey/climb.jpg",
  "/images/hero/hero-3.jpeg",
  "/images/hero/12.jpeg",
  "/images/hero/hero-4.jpeg",
  "/images/cta/gokyo-lake-yak-wide.jpg",
  "/images/journey/tour.jpg",
  "/images/hero/hero-2.jpeg",
  "/images/journey/heli.jpg",
];

export function fallbackImage(key: string): string {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length];
}

/** "EVEREST REGION" -> "Everest Region" (the menu data is sometimes all-caps). */
export function toTitleCase(text: string): string {
  return text.toLowerCase().replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

/** "14 DAYS · FROM US$1,450" for a menu row. */
export function tripMeta(trip: Trip): string {
  return [
    trip.duration ? `${trip.duration} ${(trip.durationType ?? "Days").toUpperCase()}` : null,
    trip.priceFrom ? `FROM US$${trip.priceFrom.toLocaleString()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
