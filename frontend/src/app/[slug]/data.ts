/**
 * `PackageDetail` — the shape every package-detail section component
 * (`_components/*.tsx`) renders. Originally hand-authored here as
 * placeholder content for one trip ("Ama Dablam Base Camp Trek") shaped
 * the way the real detail response would eventually need to be; that mock
 * is gone now that the backend's package detail response is wired up (see
 * `@/features/trips/api/get-package-by-slug`'s `getPackageBySlug` +
 * `@/features/trips/lib/map-package-detail`'s `mapPackageDetail`) — this
 * file is now just the shared type contract plus thin re-exports, so
 * every component's `import type { PackageDetail } from "../data"` and
 * `page.tsx`'s `getPackageDetail`/`getAllPackageSlugs` calls keep working
 * unchanged.
 */

export interface ItineraryLocation {
  label: string;
  /** `/attractions/<slug>` when `label` matches a real `Place` by name
   *  (see `get-place-slug-map.ts`), `null` otherwise — most location
   *  pills have no matching real `Place` yet, so this is commonly null;
   *  render as plain text rather than a link in that case. */
  href: string | null;
}

export interface ItineraryDayMedia {
  url: string;
  type: "image" | "video";
}

export interface ItineraryDay {
  day: number;
  title: string;
  altitudeM: number;
  durationHours: number;
  description: string;
  /** Place-name pill shown next to the day badge — the day's origin then its destination (either may be absent; deduped when identical). */
  locations: ItineraryLocation[];
  distanceKm?: number;
  transport?: string;
  meals?: string;
  photos?: ItineraryDayMedia[];
  lunchPlace?: string;
  /** This day's overnight stay — real `ItineraryDetail.accommodation` data (2026-09-03; previously this field was a `hotelName` that no mapper ever actually populated, so the "Name of hotel" card slot always silently disappeared). */
  accommodation?: string;
  /** This day's real coordinates (from `ItineraryDetail.destinationCoordinate`/`originCoordinate`) — present whenever real itinerary data exists, absent for a synthesized placeholder day. Used for the route map's markers. */
  lat?: number;
  lng?: number;
}

export interface ItineraryLeg {
  title: string;
  image: string;
  days: ItineraryDay[];
}

export interface CostTier {
  groupSize: string;
  pricePerPerson: number;
}

export interface AddOn {
  label: string;
  price: number;
  unit: string;
  chargeBy: "PERSON" | "ROOM" | "FLAT";
  peoplePerRoom: number;
}

export interface Departure {
  startDate: string;
  endDate: string;
  /**
   * Collapsed to the two states the "Group Departure" table actually
   * renders (design-references screenshot, 2026-08-26): a green
   * "Available" pill or a red "Sold Out" one with a disabled Book Now —
   * not the backend's own finer-grained `departureStatus` ("guaranteed"/
   * "available"/"limited"/"closed", see `map-package-detail.ts`'s
   * `DEPARTURE_STATUS`), which has no distinct visual for a real user
   * booking a trip to react to.
   */
  status: "Available" | "Sold Out";
  price: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** One "What is included/excluded" card. `icon` is a key from the admin's shared category list (see `InclusionsSection`'s icon map). */
export interface CostGroup {
  category: string;
  icon?: string | null;
  /** The category's rich-text list, as authored in admin. */
  html: string;
  /** Plain-text items extracted from `html` — for the PDF brochure, which can't render HTML. */
  items: string[];
}

export interface PackageDetail {
  /** Real backend package id (cuid) — needed so the booking flow can send `packageId` with `POST /bookings`. */
  id: string;
  slug: string;
  title: string;
  region: string;
  /** Home → ... → trip name, as shown directly under the site header. */
  breadcrumb: string[];
  heroImages: string[];
  /**
   * Optional override for the read-aloud script played inline next to
   * the rating in the title bar via the shared `TextToSpeechPlayer`
   * (browser-native speech synthesis — no audio file involved). When
   * omitted, `buildNarrationScript()` below composes one from
   * `intro`/`highlights`/`overview` so every trip gets narration for
   * free without hand-authoring a script.
   */
  narrationScript?: string;
  rating: number;
  reviewCount: number;
  quickFacts: { label: string; value: string }[];
  priceFrom: number;
  /** Short lead paragraph shown in its own card above the quick-facts grid. */
  intro: string;
  highlights: string[];
  /**
   * Raw, trusted CMS HTML (`Package.details`) — rendered via `CmsProse`,
   * not split into a plain-text array. It used to be flattened to
   * `string[]` (one `<p>`/`<li>` block stripped to text per array item),
   * which silently threw away every `<table>`, `<h2>`/`<h3>` subheading,
   * `<ul>` list, and `<figure>` image the CMS content actually has (real
   * migrated packages carry all of these) — reported directly as "list
   * table displayed as plain text" against mt-kailash-tour's cost
   * breakdown table.
   */
  overview: string;
  shortItinerary: { day: number; title: string; altitudeM: number; durationHours: number }[];
  /** Lead-in copy for the "Detailed Itinerary" card, above the day-by-day cards. Real HTML (multiple `<p>`s, a `<strong>` phone number) — rendered via `CmsProse`, not plain text. */
  detailedItineraryIntro: string;
  detailedItinerary: ItineraryLeg[];
  includes: CostGroup[];
  excludes: CostGroup[];
  costTiers: CostTier[];
  addOns: AddOn[];
  departures: Departure[];
  altitudeProfile: { day: number; altitudeM: number; label: string }[];
  temperatureProfile: { day: number; maxC: number; minC: number }[];
  /** Real `[lat, lng]` points for the "Map" section's route line — decoded from `ItineraryDetail.encodedPolyline` where authored, straight-line origin→destination segments elsewhere. Empty when the package has no itinerary coordinates at all. */
  routePath: [number, number][];
  /**
   * The whole "Gear" tab's content — a single rich-text (TipTap) HTML
   * blob authored in admin, not a structured checklist (2026-09-03,
   * direct request: "let's just have a tiptap editor section for this
   * instead of separating into diff categories" — superseding an
   * earlier same-day pass that split this into `category`/`itemLabel`/
   * `imageUrl` rows). Rendered via `CmsProse`, same as
   * `knowBeforeYouGo`'s own entries below.
   */
  packingListIntro: string;
  knowBeforeYouGo: { heading: string; body: string }[];
  /**
   * The dedicated "FAQs For <Trip>" page section (Figma node 1000006523):
   * a sticky category rail down the left, grouped Q&A cards on the
   * right — one group per category. Used to also feed a shorter
   * "Essential Questions" accordion in the Overview tab, but that
   * duplicated this section's own questions verbatim, so it was removed.
   */
  faqCategories: { category: string; questions: FaqItem[] }[];
  reviewBreakdown: { stars: number; percent: number }[];
  reviews: {
    title: string;
    body: string;
    name: string;
    date: string;
    rating: number;
  }[];
  stories: { image: string; title: string; date: string; author: string }[];
  similarPackages: {
    image: string;
    title: string;
    duration: string;
    rating: string;
    priceFrom: string;
    slug: string;
  }[];
}

export { getPackageBySlug as getPackageDetail } from "@/features/trips/api/get-package-by-slug";
export { getAllPackageSlugs } from "@/features/trips/api/get-package-slugs";

/**
 * `trip.overview` as plain text, for the handful of consumers that need
 * a plain-text slot rather than rendered markup — narration script, meta
 * description, JSON-LD `description` — now that it holds raw CMS HTML
 * (see `PackageDetail.overview`'s own doc comment). `maxLength` truncates
 * for slots like a meta description that shouldn't get the whole body.
 */
export function overviewText(trip: PackageDetail, maxLength?: number): string {
  const text = trip.overview.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return maxLength ? text.slice(0, maxLength) : text;
}

/**
 * Composes the read-aloud script for a trip's "overall content" —
 * title, intro, highlights, and overview — for the `TextToSpeechPlayer`
 * in `TripHeader`. Trips can hand-author their own via
 * `narrationScript` instead; this is just the free default so every
 * trip gets narration without one.
 */
export function buildNarrationScript(trip: PackageDetail): string {
  if (trip.narrationScript) return trip.narrationScript;

  const parts = [
    trip.title,
    trip.intro,
    trip.highlights.length > 0 ? `Highlights: ${trip.highlights.join(". ")}.` : null,
    overviewText(trip),
  ];

  return parts.filter(Boolean).join(" ");
}
