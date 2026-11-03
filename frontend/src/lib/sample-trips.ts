import type { CardTrip } from "@/components/ui/PackageCard";

/**
 * A sample trip plus where it belongs in the destination menu: the countries
 * it is offered in, and (for Nepal) the trekking regions it falls under.
 */
export type SampleTrip = CardTrip & {
  countries: string[];
  /** Region keys: everest, annapurna, langtang, manaslu, pokhara. */
  regions: string[];
  /** Activity category keys (see `TRIP_CATEGORIES`): trekking, climbing, safari, tours, day, deals. */
  categories?: string[];
};

/**
 * Sample trek cards shown when the API has no popular trips yet (fresh or
 * empty database). Each has its own slug, and `app/[slug]/sample-packages.ts`
 * builds a full detail page for it, so clicking a sample card opens a real
 * page. Controlled by `SHOW_SAMPLE_DATA` (see `lib/sample-data.ts`).
 */
export const SAMPLE_TREKS: SampleTrip[] = [
  { id: "s1", isPopular: true, countries: ["Nepal"], regions: ["everest"], slug: "everest-base-camp-trekking", title: "Everest Base Camp Trek", imageUrl: "/images/journey/trek.jpg", duration: 14, durationType: "Days", priceFrom: 1300, rating: 5, reviewCount: 10, badge: "Best Seller" },
  { id: "s2", isPopular: true, countries: ["Nepal"], regions: ["annapurna"], slug: "annapurna-base-camp-trekking", title: "Annapurna Base Camp Trek", imageUrl: "/images/trips/featured-annapurna-trek.jpg", duration: 14, durationType: "Days", priceFrom: 850, rating: 5, reviewCount: 16, badge: "Most Popular" },
  { id: "s3", isFeatured: true, countries: ["Nepal"], regions: ["langtang"], slug: "langtang-valley-trekking", title: "Langtang Valley Trek", imageUrl: "/images/journey/climb.jpg", duration: 12, durationType: "Days", priceFrom: 700, rating: 5, reviewCount: 2, badge: "Less Crowded" },
  { id: "s4", isFeatured: true, countries: ["Nepal"], regions: ["manaslu"], slug: "manaslu-circuit-trek", title: "Manaslu Circuit Trek", imageUrl: "/images/hero/hero-3.jpeg", duration: 14, durationType: "Days", priceFrom: 1000, rating: 5, reviewCount: 2, badge: "Off Trodden" },
  { id: "s5", countries: ["Nepal"], regions: ["annapurna"], slug: "annapurna-circuit-trekking", title: "Annapurna Circuit Trek", imageUrl: "/images/hero/12.jpeg", duration: 15, durationType: "Days", priceFrom: 1000, rating: 5, reviewCount: 1, badge: "Best Circuit Trek" },
  { id: "s6", countries: ["Nepal"], regions: ["annapurna", "pokhara"], slug: "ghorepani-poon-hill-trekking", title: "Ghorepani Poon Hill Trek", imageUrl: "/images/hero/hero-4.jpeg", duration: 4, durationType: "Days", priceFrom: 350, rating: 5, reviewCount: 7, badge: "Beginner Friendly" },
  { id: "s7", countries: ["Nepal"], regions: ["everest"], slug: "cho-la-pass-with-ebc-trekking", title: "Cho La Pass With EBC Trek", imageUrl: "/images/cta/gokyo-lake-yak-wide.jpg", duration: 19, durationType: "Days", priceFrom: 1500, rating: 5, reviewCount: 2, badge: "Cross Cho La Pass" },
  { id: "s8", countries: ["Nepal"], regions: ["manaslu"], slug: "comfort-manaslu-circuit-trek", title: "Comfort Manaslu Circuit Trek", imageUrl: "/images/journey/tour.jpg", duration: 17, durationType: "Days", priceFrom: 1500, rating: 5, reviewCount: 1, badge: "Manaslu in Luxury" },
];

/**
 * Sample tour cards (the homepage "Featured Trips" section) — also placed in
 * the destination menu by country and, where it fits, region.
 */
export const SAMPLE_TOURS: SampleTrip[] = [
  { id: "t1", isPopular: true, countries: ["Nepal"], regions: [], slug: "spirit-of-nepal-tour", title: "Spirit of Nepal Tour", imageUrl: "/images/journey/tour.jpg", duration: 10, durationType: "Days", priceFrom: 600, rating: 5, reviewCount: 10, badge: "Nepal Highlights" },
  { id: "t2", isFeatured: true, countries: ["Nepal", "Bhutan", "Multi Country"], regions: [], slug: "nepal-and-bhutan-highlights", title: "Nepal and Bhutan Highlights", imageUrl: "/images/hero/hero-2.jpeg", duration: 12, durationType: "Days", priceFrom: 2200, rating: 5, reviewCount: 4, badge: "Two Countries" },
  { id: "t3", isFeatured: true, countries: ["Nepal"], regions: ["everest"], slug: "everest-helicopter-landing-tour", title: "Everest Base Camp Helicopter Tour with Landing", imageUrl: "/images/journey/heli.jpg", duration: 5, durationType: "Hours", priceFrom: 1400, badge: "Best Heli Tour" },
  { id: "t4", countries: ["Nepal"], regions: [], slug: "kathmandu-day-tour", title: "Kathmandu Day Tour - 1 Full Day", imageUrl: "/images/hero/hero-3.jpeg", duration: 1, durationType: "Day", priceFrom: 32, rating: 5, reviewCount: 6, badge: "Best of Kathmandu" },
  { id: "t5", countries: ["Nepal"], regions: [], slug: "nepal-premium-adventure", title: "Nepal Premium Adventure", imageUrl: "/images/hero/hero-4.jpeg", duration: 12, durationType: "Days", priceFrom: 1200 },
  { id: "t6", countries: ["Nepal"], regions: ["pokhara"], slug: "chitwan-jungle-safari", title: "Chitwan Jungle Safari", imageUrl: "/images/hero/hero-1.png", duration: 3, durationType: "Days", priceFrom: 200, rating: 5, reviewCount: 3, badge: "Jungle Adventure" },
  { id: "t7", isFeatured: true, countries: ["Bhutan"], regions: [], slug: "bhutan-highlights-tour", title: "Bhutan Highlights Tour", imageUrl: "/images/hero/12.jpeg", duration: 5, durationType: "Days", priceFrom: 1570, badge: "Bhutan Highlights" },
  { id: "t8", countries: ["Nepal"], regions: ["everest"], slug: "everest-heli-tour-with-stay", title: "Everest Heli Tour with Stay at Everest View Hotel", imageUrl: "/images/trips/featured-heli-tour.jpg", duration: 2, durationType: "Days", priceFrom: 3000, badge: "Himalayan Luxury Tour" },
  { id: "t9", countries: ["Bhutan"], regions: [], slug: "short-bhutan-tour", title: "Short Bhutan Tour", imageUrl: "/images/cta/plan-your-trip.jpg", duration: 4, durationType: "Days", priceFrom: 1190, badge: "Short Escape" },
  { id: "t10", isPopular: true, countries: ["Tibet"], regions: [], slug: "mount-kailash-tour", title: "Mount Kailash Tour", imageUrl: "/images/cta/gokyo-lake-yak.jpg", duration: 14, durationType: "Days", priceFrom: 2400, rating: 5, reviewCount: 3, badge: "Sacred Journey" },
  { id: "t11", countries: ["Tibet"], regions: [], slug: "lhasa-cultural-tour", title: "Lhasa Cultural Tour", imageUrl: "/images/hero/hero-2.jpeg", duration: 7, durationType: "Days", priceFrom: 1650, badge: "Culture" },
  { id: "t12", isFeatured: true, countries: ["Multi Country"], regions: [], slug: "nepal-tibet-bhutan-tour", title: "Nepal Tibet Bhutan Tour", imageUrl: "/images/journey/tour.jpg", duration: 21, durationType: "Days", priceFrom: 4200, badge: "Three Kingdoms" },
];

/** Extra samples that only appear in the destination menu (climbing, safari and day-tour categories). */
const MENU_ONLY_TRIPS: SampleTrip[] = [
  { id: "m1", countries: ["Nepal"], regions: ["everest"], slug: "lobuche-peak-climbing", title: "Lobuche Peak Climbing", imageUrl: "/images/journey/climb.jpg", duration: 18, durationType: "Days", priceFrom: 2900, badge: "Peak Climbing" },
  { id: "m2", countries: ["Nepal"], regions: ["everest"], slug: "mera-peak-climbing", title: "Mera Peak Climbing", imageUrl: "/images/hero/hero-3.jpeg", duration: 19, durationType: "Days", priceFrom: 2700, badge: "Peak Climbing" },
  { id: "m3", countries: ["Nepal"], regions: ["pokhara"], slug: "bardia-jungle-safari", title: "Bardia Jungle Safari", imageUrl: "/images/hero/hero-1.png", duration: 4, durationType: "Days", priceFrom: 480, badge: "Wildlife" },
  { id: "m4", countries: ["Nepal"], regions: [], slug: "bhaktapur-and-patan-day-tour", title: "Bhaktapur and Patan Day Tour", imageUrl: "/images/hero/hero-4.jpeg", duration: 1, durationType: "Day", priceFrom: 45, badge: "Day Tour" },
];

const CATEGORIES_BY_ID: Record<string, string[]> = {
  s1: ["trekking"], s2: ["trekking"], s3: ["trekking"], s4: ["trekking"], s5: ["trekking"], s6: ["trekking", "deals"], s7: ["trekking"], s8: ["trekking"],
  t1: ["tours"], t2: ["tours"], t3: ["tours"], t4: ["day", "deals"], t5: ["tours"], t6: ["safari"], t7: ["tours"], t8: ["tours"],
  t9: ["tours"], t10: ["tours"], t11: ["tours"], t12: ["tours"],
  m1: ["climbing"], m2: ["climbing"], m3: ["safari"], m4: ["day"],
};

/** Which homepage group each sample trip belongs to: Best Seller, Featured Trip, or (everything else) Inspiration Trip. */
const BEST_SELLER_IDS = new Set(["s1", "s2", "s6", "t1", "t6", "t10"]);
const FEATURED_IDS = new Set(["s3", "s4", "t2", "t3", "t7", "t8", "t12"]);

/** Every sample trip, for the destination menu and the sample detail pages. */
export const ALL_SAMPLE_TRIPS: SampleTrip[] = [...SAMPLE_TREKS, ...SAMPLE_TOURS, ...MENU_ONLY_TRIPS].map((trip) => ({
  ...trip,
  isPopular: BEST_SELLER_IDS.has(trip.id),
  isFeatured: FEATURED_IDS.has(trip.id),
  categories: CATEGORIES_BY_ID[trip.id] ?? [],
}));

/** The three homepage groups, each package in exactly one. */
export const SAMPLE_BEST_SELLERS: SampleTrip[] = ALL_SAMPLE_TRIPS.filter((trip) => trip.isPopular);
export const SAMPLE_FEATURED: SampleTrip[] = ALL_SAMPLE_TRIPS.filter((trip) => !trip.isPopular && trip.isFeatured);
export const SAMPLE_INSPIRATION: SampleTrip[] = ALL_SAMPLE_TRIPS.filter((trip) => !trip.isPopular && !trip.isFeatured);

const REGION_KEYS = ["everest", "annapurna", "langtang", "manaslu", "pokhara"];

/** The sample trips offered in a country ("Nepal", "Bhutan", "Tibet", "Multi Country"). */
export function sampleTripsForCountry(country: string): SampleTrip[] {
  const name = country.toLowerCase();
  return ALL_SAMPLE_TRIPS.filter((trip) => trip.countries.some((entry) => entry.toLowerCase() === name));
}

/** The sample trips that belong to a region, matched by the region name ("Everest Region", "Treks From Pokhara"). */
export function sampleTripsForRegion(regionTitle: string): SampleTrip[] {
  const name = regionTitle.toLowerCase();
  const key = REGION_KEYS.find((word) => name.includes(word));
  if (!key) return [];
  return ALL_SAMPLE_TRIPS.filter((trip) => trip.regions.includes(key));
}
