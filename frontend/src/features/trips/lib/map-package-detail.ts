import { toNumber } from "@/lib/decimal";
import type {
  PackageDetail,
  ItineraryDay,
  ItineraryLocation,
  CostTier,
  AddOn,
  Departure,
  FaqItem,
  CostGroup,
} from "@/app/[slug]/data";
import type { PlaceSlugMaps } from "@/features/attractions/api/get-place-slug-map";
import { lowestPrice } from "../api/get-trips";
import { decodePolyline } from "./decode-polyline";
import type {
  ItineraryDetailResponse,
  ItineraryPlaceRef,
  PackageResponse,
} from "../types/package-response.types";

/**
 * Raw backend `Package` → the page's `PackageDetail` shape (see
 * `@/app/[slug]/data`, imported unchanged by every one of the ~17 section
 * components — this file's only job is producing that exact shape from
 * real data, never the other way around).
 *
 * Every field-level decision here (what's a direct map, what's derived,
 * what's deliberately left empty because no backend model backs it) is
 * documented in the approved plan (`~/.claude/plans/sharded-toasting-crab.md`)
 * — this is the implementation of that mapping table, grounded against a
 * live query of the real migrated data (see that plan's per-section
 * notes) rather than guessed from the DTO shapes alone.
 */

// ---- text helpers --------------------------------------------------------

/**
 * Named HTML entities this migrated CMS content actually uses — same
 * table `BlogDetailSection`'s `htmlToPlainText` already has for the
 * identical problem there. Real itinerary-day descriptions carry
 * `&rsquo;`/`&nbsp;` routinely (e.g. "Traveler&rsquo;s note:&nbsp;Did
 * you know that&hellip;", from real migrated data) — the old version
 * here only decoded `&nbsp;`/`&amp;`/`&mdash;`/`&ndash;`, so every
 * other entity (apostrophes/quotes especially) leaked through onto the
 * page as literal `&rsquo;` text instead of the character it stands
 * for. Reported directly by the user against a real package's itinerary.
 */
const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  rsquo: "’",
};

/** Strips tags, decodes HTML entities, and collapses whitespace — for slotting real CMS-authored HTML into a plain-text design slot (quick facts, day titles, chart labels, FAQ answers, ...) that was never built to render markup. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-z]+);/gi, (entity, name: string) => NAMED_HTML_ENTITIES[name.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `pkg.highlights` is one HTML blob (`<p>...</p>` or `<li>...</li>`
 * chunks) — split into the plain-text array the "Trip Highlights" list
 * expects. Also exported for `BrochureDocument.tsx`'s PDF export, which
 * needs the same one-paragraph-per-`<Text>` shape `overview` itself used
 * to be built from before it switched to rendering raw HTML directly
 * (see `PackageDetail.overview`'s own doc comment) — react-pdf has no
 * HTML renderer, so the PDF still needs this flattened form, tables and
 * all (same lossy-but-readable output the PDF already had).
 */
export function splitHtmlBlocks(html: string | null | undefined): string[] {
  if (!html) return [];
  const blocks = html.match(/<(p|li)[^>]*>[\s\S]*?<\/\1>/gi);
  const source = blocks && blocks.length > 0 ? blocks : html.split(/\r?\n+/);
  return source.map((block) => stripHtml(block)).filter((text) => text.length > 0);
}

/** Splits by a given heading tag, pairing each heading's text with the raw HTML between it and the next same-level heading (or end of string) — used to parse `extraFaqs`'s `<h3>category</h3><h4>question</h4>answer` blob (see `parseExtraFaqsHtml` below) without a DOM. */
function splitByHeading(html: string, tag: string): { heading: string; bodyHtml: string }[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const matches = [...html.matchAll(re)];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? html.length;
    return { heading: stripHtml(match[1]), bodyHtml: html.slice(start, end) };
  });
}

/**
 * `Package.extraFaqs` — real migrated data stores this as
 * `{ raw: "<h2>FAQs</h2><h3>Category</h3><h4>Question</h4><p>Answer</p>..." }`,
 * not the `{question,answer}[]` array the backend's own TS interface
 * assumes (see `ExtraFaqsResponse`'s comment) — `<h3>` marks a category,
 * `<h4>` a question within it, confirmed against a live `packages` row.
 */
function parseExtraFaqsHtml(raw: string): { category: string; questions: FaqItem[] }[] {
  return splitByHeading(raw, "h3")
    .map(({ heading, bodyHtml }) => ({
      category: heading,
      questions: splitByHeading(bodyHtml, "h4")
        .map(({ heading: question, bodyHtml: answerHtml }) => ({ question, answer: stripHtml(answerHtml) }))
        .filter((q) => q.question.length > 0 && q.answer.length > 0),
    }))
    .filter((group) => group.category.length > 0 && group.questions.length > 0);
}

function extractExtraFaqsRaw(extraFaqs: PackageResponse["extraFaqs"]): string | undefined {
  if (!extraFaqs || Array.isArray(extraFaqs)) return undefined;
  return extraFaqs.raw;
}

// ---- itinerary-detail parsing ---------------------------------------------

/** `"5 to 6 Hours"` / `"45 Min"` / `"2.5 to 3 Hours"` → hours as a number — first figure in the string, converted from minutes when the unit says so. Real `ItineraryDetail.duration` values, not guessed formats (see live-data check in the approved plan). */
function parseDurationHours(duration: string | null | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/(\d+(\.\d+)?)/);
  if (!match) return 0;
  const value = Number(match[1]);
  return /min/i.test(duration) ? Math.round((value / 60) * 100) / 100 : value;
}

/** `"1,400"` / `"5,364"` (elevation in meters) or literal `"undefined"`/`"null"` junk from the migration → a clean number, or `undefined` when unparseable. */
function parseMeters(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && !/undefined|null/i.test(value) ? n : undefined;
}

const TRAVEL_MODE_LABELS: Record<string, string> = {
  foot: "On foot",
  car: "Private vehicle",
  air: "Flight",
  bus: "Bus",
  jeep: "Jeep",
};

function mapTravelMode(mode: string | null | undefined): string | undefined {
  if (!mode) return undefined;
  return TRAVEL_MODE_LABELS[mode.toLowerCase()] ?? mode;
}

/** `"27.6941138,85.2883183"` → `[27.6941138, 85.2883183]`, or `undefined` when the value isn't a clean `lat,lng` pair. */
function parseCoordinate(value: string | null | undefined): [number, number] | undefined {
  if (!value) return undefined;
  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));
  return lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : undefined;
}

/**
 * Builds the day-by-day list from `Itinerary.details` (`ItineraryDetail[]`).
 * Real data includes extra sub-leg rows sharing the same `itineraryDay` as
 * their parent day (e.g. a Kala Patthar side trip, or a same-day return
 * leg, both stamped "Day 9" on a real 14-day package) — confirmed live,
 * and confirmed producing an 18-row, duplicated-day-number result (2, 9,
 * 9, 10 each appearing twice+) on a real package once checked against the
 * actual rendered page, not just the mapping logic in isolation.
 *
 * This used to be filtered by `itineraryTitle` presence (sub-legs
 * originally had none) — that stopped being reliable once an admin edit
 * added titles to those rows too, which is exactly what produced the
 * duplicated/zigzagging altitude chart a user reported. `sortOrder` is
 * the structural invariant instead: every real package's main entry for
 * each day is authored before any of that day's sub-legs (sortOrder
 * 0..N-1 covers the real days in order, sub-leg rows are appended after),
 * so keeping the first-seen row per unique `itineraryDay` value recovers
 * exactly one row per real day regardless of what any row's title says.
 */
/**
 * One itinerary leg's origin or destination → a location pill, or
 * `undefined` if this endpoint has neither a linked `Place` nor plain
 * text at all. `place` (present whenever an admin explicitly picked a
 * real `Place` via the itinerary form's picker) wins over `plainText`
 * (the legacy free-text field, populated on almost every real row
 * regardless) — see `buildItineraryDays`'s own call site comment for
 * why this order matters. Href is resolved by id when `place` is used
 * (unambiguous), by name-matching `plainText` against real `Place`s
 * otherwise (see `get-place-slug-map.ts`'s own comment on that).
 */
function resolveLocation(
  place: ItineraryPlaceRef | null | undefined,
  plainText: string | null | undefined,
  maps: PlaceSlugMaps,
): ItineraryLocation | undefined {
  if (place) {
    const slug = maps.byId.get(place.id);
    return { label: place.placeName, href: slug ? `/attractions/${slug}` : null };
  }
  if (!plainText) return undefined;
  const slug = maps.byName.get(plainText.toLowerCase());
  return { label: plainText, href: slug ? `/attractions/${slug}` : null };
}

function buildItineraryDays(
  details: ItineraryDetailResponse[],
  placeSlugMaps: PlaceSlugMaps,
): ItineraryDay[] {
  const sorted = [...details].sort((a, b) => a.sortOrder - b.sortOrder);
  const seenDays = new Set<string>();
  const rows = sorted.filter((detail) => {
    // A blank/missing itineraryDay never collides with another blank one
    // — each gets its own unique fallback key so rows genuinely lacking a
    // day number are kept, not silently merged away.
    const key = detail.itineraryDay || `__row-${detail.sortOrder}`;
    if (seenDays.has(key)) return false;
    seenDays.add(key);
    return true;
  });

  return rows.map((detail, index) => {
    const dayNumber = Number(detail.itineraryDay);
    // A linked `Place` (`originPlace`/`destinationPlace`) wins over the
    // plain-text `origin`/`destination` whenever one's actually set —
    // CORRECTED 2026-08-26 (direct from the user: picked a real
    // "Destination Place" on a day that already had unrelated legacy
    // plain text — "Tribhuvan International Airport" — for that same
    // field; the pick was silently dropped because the old priority
    // order here preferred the plain text first). Resolved by the
    // relation's own id (`resolveLocation`'s own comment), not by
    // matching its name against real `Place` rows — unambiguous, unlike
    // name matching. Plain text is still the *only* signal on most
    // rows (this repo's own migrated data has `originPlace`/
    // `destinationPlace` null far more often than not), so it stays the
    // fallback, not removed.
    // Both origin and destination get a pill (origin first, destination
    // last — the route map relies on destination being last). A day whose
    // origin and destination resolve to the same label shows just one.
    const destinationLocation = resolveLocation(detail.destinationPlace, detail.destination, placeSlugMaps);
    const originLocation = resolveLocation(detail.originPlace, detail.origin, placeSlugMaps);
    const locations = [originLocation, destinationLocation].filter(
      (loc, i, all): loc is NonNullable<typeof loc> =>
        !!loc && all.findIndex((other) => other?.label === loc.label) === i,
    );

    const [lat, lng] = parseCoordinate(detail.destinationCoordinate) ?? parseCoordinate(detail.originCoordinate) ?? [];

    return {
      day: Number.isFinite(dayNumber) && dayNumber > 0 ? dayNumber : index + 1,
      title: detail.itineraryTitle ?? `Day ${index + 1}`,
      altitudeM: parseMeters(detail.destinationElevation) ?? parseMeters(detail.originElevation) ?? 0,
      durationHours: parseDurationHours(detail.duration),
      description: detail.itineraryDescription ? stripHtml(detail.itineraryDescription) : "",
      locations,
      distanceKm: parseMeters(detail.distance),
      transport: mapTravelMode(detail.travelMode),
      meals: detail.meals ?? undefined,
      photos: detail.photos && detail.photos.length > 0 ? detail.photos : undefined,
      lunchPlace: detail.lunchPlace ?? undefined,
      accommodation: detail.accommodation ?? undefined,
      lat,
      lng,
    };
  });
}

/**
 * The full walked/driven route line for the map — built from *every* raw
 * itinerary leg (not the deduped day list `buildItineraryDays` produces),
 * sorted by `sortOrder`, since a side-trip leg (e.g. a Kala Patthar
 * detour filed under the same day as its parent) is part of the real
 * route even though it doesn't get its own day card. Decodes each leg's
 * `encodedPolyline` when present (~73% of real rows); falls back to a
 * straight two-point segment between that leg's own origin/destination
 * coordinates so the line stays continuous across the rest.
 */
function buildRoutePath(details: ItineraryDetailResponse[]): [number, number][] {
  const sorted = [...details].sort((a, b) => a.sortOrder - b.sortOrder);
  const path: [number, number][] = [];

  for (const detail of sorted) {
    if (detail.encodedPolyline) {
      path.push(...decodePolyline(detail.encodedPolyline));
      continue;
    }
    const origin = parseCoordinate(detail.originCoordinate);
    const destination = parseCoordinate(detail.destinationCoordinate);
    if (origin) path.push(origin);
    if (destination) path.push(destination);
  }

  return path;
}

/**
 * Real, per-leg altitude progression for the "Altitude Profile" chart —
 * built the same way `buildRoutePath` is (every raw leg, sortOrder-
 * sorted), not from the deduped one-row-per-day `days` list
 * `buildItineraryDays` produces. A real day can have more than one
 * stop (e.g. fly to Lukla then trek on to Phakding, both real "Day 2"
 * legs) and the real design shows one point per stop, not one per
 * day — using the deduped list here would silently drop that second
 * point. Sorting by `sortOrder` (not by day number or title) is the
 * same fix `buildItineraryDays`'s own comment documents for the real
 * zigzagging-chart bug an admin edit caused; deliberately reused here
 * rather than re-deriving day order a second way.
 *
 * `label` prefers each leg's destination place (where the altitude
 * reading is *for*), falling back to its origin when a leg has no
 * destination place/text at all.
 */
function buildAltitudeProfile(
  details: ItineraryDetailResponse[],
  placeSlugMaps: PlaceSlugMaps,
): { day: number; altitudeM: number; label: string }[] {
  const sorted = [...details].sort((a, b) => a.sortOrder - b.sortOrder);

  return sorted
    .map((detail) => {
      const altitudeM = parseMeters(detail.destinationElevation) ?? parseMeters(detail.originElevation) ?? 0;
      const destination = resolveLocation(detail.destinationPlace, detail.destination, placeSlugMaps);
      const origin = resolveLocation(detail.originPlace, detail.origin, placeSlugMaps);
      const dayNumber = Number(detail.itineraryDay);
      return {
        day: Number.isFinite(dayNumber) && dayNumber > 0 ? dayNumber : 0,
        altitudeM,
        label: destination?.label ?? origin?.label ?? "",
      };
    })
    .filter((point) => point.altitudeM > 0);
}

/** No day-by-day data entered yet for this package — synthesize a placeholder-length itinerary purely so date math (`tripDurationDays`, used throughout the real booking flow) has the right number of days. Not fabricated content: every day gets the same real free-text blurb, not invented per-day copy. */
function synthesizePlaceholderDays(pkg: PackageResponse): ItineraryDay[] {
  const dayCount = Math.max(1, Math.round(toNumber(pkg.duration) ?? 1));
  const blurb = stripHtml(pkg.tripInfoText ?? pkg.departureNote ?? "");
  return Array.from({ length: dayCount }, (_, index) => ({
    day: index + 1,
    title: `Day ${index + 1}`,
    altitudeM: 0,
    durationHours: 0,
    description: blurb,
    locations: [],
  }));
}

// ---- cost / price-group mapping -------------------------------------------

/** `"1 - 1"` → `"1 person"`, `"2 - 8"` → `"2 - 8 people"` — matches `booking-helpers.ts`'s own `parseGroupSizeRange` regex exactly, so the real booking flow's per-person price lookup keeps working against real data. */
function formatGroupSize(minPeople: number, maxPeople: number): string {
  if (minPeople === maxPeople) return `${minPeople} person`;
  return `${minPeople} - ${maxPeople} people`;
}

/** Real `PriceGroup` rows cross a `packageTier` (Silver/Gold/Platinum-style) with people-count ranges (confirmed live) — the "Cost" section only renders one flat group-size table, so this picks the tier marked `isDefault` (falling back to the first tier present) rather than dumping every tier's rows together. */
function buildCostTiers(priceGroups: PackageResponse["priceGroups"]): CostTier[] {
  if (priceGroups.length === 0) return [];
  const defaultTier = priceGroups.find((g) => g.isDefault)?.packageTier ?? priceGroups[0].packageTier;
  return priceGroups
    .filter((g) => g.packageTier === defaultTier)
    .sort((a, b) => a.minPeople - b.minPeople)
    .map((g) => ({
      groupSize: formatGroupSize(g.minPeople, g.maxPeople),
      pricePerPerson: toNumber(g.offerUnitPrice ?? undefined) ?? toNumber(g.unitPrice) ?? 0,
    }));
}

/**
 * `Addon.addonUnit` — real migrated data has actual `null` rows (fine,
 * `?? ""` would already cover those) but also the literal *strings*
 * `"null"`/`"undefined"` for some rows (confirmed: 3 "null" rows in the
 * current `package_addons` table) — a legacy-migration artifact from
 * somewhere upstream stringifying a missing value before it was stored,
 * not a real unit label. Rendered as-is, the Cost section's "Estimate
 * your cost with add on" table showed a literal "+$150 null" for those
 * rows. Blank string for either case, same as a genuinely missing unit.
 */
function normalizeAddOnUnit(unit: string | null | undefined): string {
  if (!unit) return "";
  return ["null", "undefined"].includes(unit.trim().toLowerCase()) ? "" : unit;
}

// ---- departures -------------------------------------------------------

// "guaranteed"/"available"/"limited" all still take bookings — real
// data confirms this isn't a rare edge case (82/12/6 rows respectively
// in the current migrated set) — so all three collapse to the same
// green "Available" pill; only "closed" (40 rows — a real, sizeable
// chunk, not noise) becomes the disabled red "Sold Out" state. See
// `Departure["status"]`'s own doc comment in `app/[slug]/data.ts`.
const DEPARTURE_STATUS: Record<string, Departure["status"]> = {
  guaranteed: "Available",
  available: "Available",
  limited: "Available",
  closed: "Sold Out",
};

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * `"closed"` departures are now kept (mapped to `"Sold Out"` above), not
 * dropped — the design shows them, disabled, rather than hiding sold-out
 * dates entirely (unlike `features/departures/api/get-upcoming-departures.ts`'s
 * own server-side exclusion of closed rows, a different feature — the
 * homepage's "upcoming departures" widget only ever wants bookable ones).
 * Only a genuinely unrecognized `departureStatus` (not one of the 4 real
 * values currently in the migrated data) still gets dropped here, rather
 * than guessing a badge for it.
 */
function buildDepartures(pkg: PackageResponse): Departure[] {
  const durationDays = Math.max(1, Math.round(toNumber(pkg.duration) ?? 1));
  return pkg.departures
    .map((d): Departure | null => {
      const status = DEPARTURE_STATUS[d.departureStatus?.toLowerCase()];
      if (!status) return null;
      const startDate = d.departureDate.slice(0, 10);
      return {
        startDate,
        endDate: addDays(startDate, durationDays - 1),
        status,
        price: toNumber(d.departureCost) ?? 0,
      };
    })
    .filter((d): d is Departure => d !== null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// ---- includes / excludes ------------------------------------------------

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * `fallbackTexts` is checked in order, using the first one that actually
 * yields items — `pkg.costIncludesText`/`costExcludesText` first (empty
 * for every migrated package so far, but a legitimate source if the admin
 * CMS ever populates it directly on the package), then the first tier's
 * `costIncludes`/`costExcludes` (see `PackageTierResponse`'s comment —
 * this is where production's real content actually lives).
 */
function buildCostList(
  costDetails: PackageResponse["costDetails"],
  type: "INCLUDE" | "EXCLUDE",
  fallbackTexts: (string | null | undefined)[],
): CostGroup[] {
  const rows = costDetails.filter((d) => d.detailType === type);
  if (rows.length > 0) {
    // One group per category (usually one row each — the category's rich-text
    // list in `detailDescription`); categories ordered by their admin-set
    // `sortOrder`. A row with only a title (older item-style data) becomes a
    // list item.
    const groups = new Map<string, { category: string; icon: string | null; order: number; parts: string[] }>();
    for (const row of rows) {
      const name = row.costCategory?.name ?? row.detailKey;
      const group = groups.get(name) ?? { category: name, icon: row.costCategory?.icon ?? null, order: row.costCategory?.sortOrder ?? 0, parts: [] };
      group.parts.push(row.detailDescription?.trim() ? row.detailDescription : `<ul><li>${escapeHtml(row.detailTitle)}</li></ul>`);
      groups.set(name, group);
    }
    return [...groups.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ category, icon, parts }) => {
        const html = parts.join("\n");
        return { category, icon, html, items: splitHtmlBlocks(html) };
      })
      .filter((group) => group.items.length > 0);
  }
  for (const text of fallbackTexts) {
    const items = splitHtmlBlocks(text);
    if (items.length > 0) {
      return [{ category: type === "INCLUDE" ? "What's Included" : "What's Excluded", html: text ?? "", items }];
    }
  }
  return [];
}


// ---- quick facts ----------------------------------------------------------

function buildQuickFacts(pkg: PackageResponse): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [
    { label: "Destination", value: pkg.destination.title },
    { label: "Duration", value: `${toNumber(pkg.duration) ?? pkg.duration} ${pkg.durationType}` },
  ];
  if (pkg.grade) facts.push({ label: "Difficulty", value: pkg.grade.title });
  if (pkg.style) facts.push({ label: "Activity", value: pkg.style.title });
  if (pkg.maxAltitude) facts.push({ label: "Max Altitude", value: pkg.maxAltitude });
  if (pkg.groupSize) facts.push({ label: "Group Size", value: pkg.groupSize });
  if (pkg.accommodation) facts.push({ label: "Accommodation", value: pkg.accommodation.title });
  if (pkg.meals) facts.push({ label: "Meals", value: pkg.meals.title });
  if (pkg.transportation) facts.push({ label: "Transport", value: pkg.transportation.title });

  const existingLabels = new Set(facts.map((f) => f.label));
  for (const fact of pkg.facts) {
    // "video" (a YouTube id) is real data but not a display-worthy fact —
    // confirmed live on a real package alongside genuine facts like
    // "Start & End Point" / "Best Seasons".
    if (fact.factTitle.toLowerCase() === "video") continue;
    if (existingLabels.has(fact.factTitle)) continue;
    facts.push({ label: fact.factTitle, value: fact.factValue });
    existingLabels.add(fact.factTitle);
  }
  return facts;
}

// ---- reviews ----------------------------------------------------------

function buildReviews(testimonials: PackageResponse["testimonials"]) {
  return testimonials.map((t) => {
    const date = t.reviewDate ? new Date(t.reviewDate) : null;
    return {
      title: t.reviewTitle ?? t.fullName,
      body: stripHtml(t.review),
      name: t.fullName,
      date: date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "",
      rating: Math.min(5, Math.max(1, Math.round(toNumber(t.reviewRating) ?? 5))),
    };
  });
}

function buildReviewBreakdown(testimonials: PackageResponse["testimonials"]): { stars: number; percent: number }[] {
  const ratings = testimonials.map((t) => Math.round(toNumber(t.reviewRating) ?? 0)).filter((r) => r >= 1 && r <= 5);
  if (ratings.length === 0) return [];
  const counts = [5, 4, 3, 2, 1].map((stars) => ratings.filter((r) => r === stars).length);
  return [5, 4, 3, 2, 1].map((stars, index) => ({
    stars,
    percent: Math.round((counts[index] / ratings.length) * 100),
  }));
}

// ---- know before you go ------------------------------------------------

/**
 * The real "Know Before You Go" accordion (see production's
 * `/gokyo-valley-trekking#useful-info` — 6 entries: "Lodging at Gokyo
 * Valley Trek", "Gokyo Valley hiking information.", "Day-to-Day Elevation
 * During Gokyo Valley", ...) is built from `package_trip_info`
 * (`pkg.tripInfoText`), split on its top-level `<h2>` headings — *not*
 * `pkg.usefulInfo` (`package_useful_info`), whose confusingly similar
 * name suggests it's the source but is actually NULL for most packages,
 * this one included (confirmed against the raw SQL dump: for Gokyo Valley,
 * `package_useful_info` is NULL while `package_trip_info` holds this
 * exact 6-section HTML blob — production's real headings match its `<h2>`s
 * one-for-one). `<h3>`s inside a section stay nested in that section's
 * body, matching production; `body` is kept as HTML (not stripped) so
 * `PackingAndKnowBefore` can render it with `CmsProse`, preserving those
 * sub-headings and paragraph breaks instead of flattening them to text.
 *
 * `pkg.departureNote` used to be folded in here as a "Departure Notes"
 * entry, but production never actually renders it inside this section
 * (confirmed: the text only shows up as page-state JSON, never inside a
 * visible DOM node) — dropped to match.
 */
function buildKnowBeforeYouGo(pkg: PackageResponse): { heading: string; body: string }[] {
  const entries = splitByHeading(pkg.tripInfoText ?? "", "h2")
    .map(({ heading, bodyHtml }) => ({ heading, body: bodyHtml.trim() }))
    .filter((entry) => entry.heading.length > 0 && entry.body.length > 0);

  if (pkg.usefulInfo && stripHtml(pkg.usefulInfo).length > 0) {
    entries.push({ heading: "Useful Information", body: pkg.usefulInfo });
  }
  return entries;
}

// ---- faqs / faq categories ------------------------------------------------

function buildFaqCategories(pkg: PackageResponse): { category: string; questions: FaqItem[] }[] {
  const groups = pkg.faqCategories
    .map((category) => ({
      category: category.title,
      questions: pkg.groupFaqs
        .filter((g) => g.categories.some((c) => c.id === category.id))
        .map((g) => ({ question: g.question, answer: stripHtml(g.answer) })),
    }))
    .filter((group) => group.questions.length > 0);

  if (groups.length > 0) return groups;

  const raw = extractExtraFaqsRaw(pkg.extraFaqs);
  return raw ? parseExtraFaqsHtml(raw) : [];
}

// ---- top-level mapper -------------------------------------------------

export function mapPackageDetail(
  pkg: PackageResponse,
  placeSlugMaps: PlaceSlugMaps = { byId: new Map(), byName: new Map() },
): PackageDetail {
  const heroImages = [pkg.imageUrl, ...pkg.galleryImages.map((g) => g.url)].filter(
    (src, index, arr): src is string => Boolean(src) && arr.indexOf(src) === index,
  );

  const rawDetails = pkg.itinerary?.details ?? [];
  const days =
    rawDetails.length > 0 ? buildItineraryDays(rawDetails, placeSlugMaps) : synthesizePlaceholderDays(pkg);
  // Kept as HTML (not stripped) — real content is several `<p>` paragraphs
  // with a `<strong>` phone number in one of them (see production/Figma:
  // "Detailed Itinerary" renders as separate paragraph blocks, not one
  // run-on line), which `stripHtml` was flattening away. Rendered via
  // `CmsProse` in `ItinerarySection` for the same reason every other
  // rich-text block on this page is.
  const detailedItineraryIntro = pkg.itinerary?.detailsText || pkg.tripInfoText || "";

  const ratings = pkg.testimonials.map((t) => toNumber(t.reviewRating)).filter((r): r is number => r !== undefined);
  const rating = ratings.length > 0 ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10 : 0;

  const faqCategories = buildFaqCategories(pkg);
  const priceFrom = lowestPrice(pkg.priceGroups) ?? toNumber(pkg.price) ?? 0;

  const slug = pkg.slug ?? "";

  return {
    id: pkg.id,
    slug,
    title: pkg.title,
    region: pkg.destination.title,
    breadcrumb: ["Home", pkg.destination.title, pkg.title],
    heroImages,
    rating,
    reviewCount: pkg.testimonials.length,
    quickFacts: buildQuickFacts(pkg),
    priceFrom,
    intro: pkg.abstract ? stripHtml(pkg.abstract) : "",
    highlights: splitHtmlBlocks(pkg.highlights),
    // Raw HTML straight through — see `PackageDetail.overview`'s own doc
    // comment on why this stopped going through `splitHtmlBlocks`.
    overview: pkg.details || pkg.abstract || "",
    shortItinerary: days.map((d) => ({ day: d.day, title: d.title, altitudeM: d.altitudeM, durationHours: d.durationHours })),
    detailedItineraryIntro,
    detailedItinerary: [{ title: pkg.title, image: pkg.imageUrl ?? "", days }],
    includes: buildCostList(pkg.costDetails, "INCLUDE", [pkg.costIncludesText, pkg.tiers[0]?.costIncludes]),
    excludes: buildCostList(pkg.costDetails, "EXCLUDE", [pkg.costExcludesText, pkg.tiers[0]?.costExcludes]),
    costTiers: buildCostTiers(pkg.priceGroups),
    addOns: pkg.addOns.map(
      (a): AddOn => ({ label: a.addonTitle, price: toNumber(a.addonPrice) ?? 0, unit: normalizeAddOnUnit(a.addonUnit), chargeBy: a.chargeBy ?? "PERSON", peoplePerRoom: a.peoplePerRoom ?? 2 }),
    ),
    departures: buildDepartures(pkg),
    altitudeProfile: buildAltitudeProfile(rawDetails, placeSlugMaps),
    routePath: buildRoutePath(rawDetails),
    // No backend source for daily temperature data — left empty on
    // purpose (see the approved plan); ChartsSection hides this chart
    // when the array is empty.
    temperatureProfile: [],
    packingListIntro: pkg.packingListIntro ?? "",
    knowBeforeYouGo: buildKnowBeforeYouGo(pkg),
    faqCategories,
    reviewBreakdown: buildReviewBreakdown(pkg.testimonials),
    reviews: buildReviews(pkg.testimonials),
    // No Story ↔ Package relation exists on the backend — left empty on
    // purpose; StoriesAndSimilar hides this block when empty.
    stories: [],
    // `customRelated` only carries {id, title} today — not enough for
    // this card's image/duration/rating/price; left empty rather than
    // rendering cards with fabricated stats. See the approved plan's
    // "similarPackages" row for the follow-up to enrich it.
    similarPackages: [],
  };
}
