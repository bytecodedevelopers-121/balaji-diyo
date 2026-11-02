/**
 * Raw `GET /packages/:slug` response shape — mirrors `packageInclude` in
 * `backend/src/modules/package/package.repository.ts` plus the
 * `imageUrl`/`galleryImages` fields `PackageService.findPublicBySlug`
 * attaches (see that file's own comment — same "raw path in the service,
 * absolute URL in the controller" half-step blog/place/package-map all
 * use).
 *
 * Decimal columns (`price`, `duration`, `discount`, `unitPrice`,
 * `offerUnitPrice`, `departureCost`, `addonPrice`, `reviewRating`, ...)
 * serialize over the API as numeric *strings*, not JS numbers — see
 * `@/lib/decimal`'s own comment. Typed `number | string` here so every
 * read site is forced through `toNumber()`.
 */

export interface PackageCategoryRef {
  id: string;
  title: string;
}

export interface PackageFactResponse {
  factTitle: string;
  factValue: string;
}

export interface PriceGroupResponse {
  packageTier: string;
  minPeople: number;
  maxPeople: number;
  shortDescription?: string | null;
  unitPrice: number | string;
  offerUnitPrice?: number | string | null;
  offerLabel?: string | null;
  offerInformation?: string | null;
  isDefault: boolean;
}

export interface AddOnResponse {
  addonTitle: string;
  addonDescription?: string | null;
  addonPrice: number | string;
  addonUnit?: string | null;
  chargeBy?: "PERSON" | "ROOM" | "FLAT";
  peoplePerRoom?: number;
}

export interface CostDetailResponse {
  detailKey: string;
  detailTitle: string;
  detailDescription?: string | null;
  detailExtra?: string | null;
  detailType: "INCLUDE" | "EXCLUDE";
  sortOrder?: number;
  /** Shared admin-managed group this row belongs to — null for legacy rows with only the free-text `detailKey`. */
  costCategory?: { name: string; icon: string | null; sortOrder: number } | null;
}

/**
 * `Package.tiers` (backend's `tiers: true` include, `package.repository.ts`'s
 * `TierItem`) — the real source of "What's Included/Excluded" content.
 * Confusingly, the package-level `costIncludesText`/`costExcludesText`
 * *look* like the source but are NULL across every migrated package (the
 * dedicated `travel_package_cost_details` table is empty too) — production
 * actually builds this section from the tier's `package_cost_includes` /
 * `package_cost_excludes` columns (confirmed against production's own
 * embedded page state for `/gokyo-valley-trekking`, which named
 * `"package_tier":"Silver"` as the source). Most packages have exactly one
 * tier row.
 */
export interface PackageTierResponse {
  packageTier: string;
  packageTierAlias: string;
  packageTierDescription?: string | null;
  costIncludes?: string | null;
  costExcludes?: string | null;
}

export interface DepartureResponse {
  departureDate: string;
  departureCost: number | string;
  departureNote?: string | null;
  departureStatus: string;
}

/**
 * `originPlace`/`destinationPlace` below — the backend includes the raw
 * Prisma `Place` model verbatim (`package.repository.ts`: `include: {
 * originPlace: true, destinationPlace: true }`), not a `PackageCategoryRef`-
 * shaped DTO. Real field is `placeName`, not `title` — CORRECTED
 * 2026-08-26 (a real admin-linked Place rendered its pill with an empty
 * label, `.title` read against the real `placeName` payload); this
 * relation had always been null in every row checked before that, so
 * the wrong field name never surfaced until a real one existed. Only
 * the two fields `resolveLocation` (map-package-detail.ts) actually
 * uses are declared — the rest of the real `Place` payload (description,
 * elevation, coordinates, ...) is real but unused here.
 */
export interface ItineraryPlaceRef {
  id: string;
  placeName: string;
}

export interface ItineraryDetailMedia {
  url: string;
  type: "image" | "video";
}

export interface ItineraryDetailResponse {
  sortOrder: number;
  itineraryDay: string;
  itineraryTitle?: string | null;
  itineraryDescription?: string | null;
  destinationElevation?: string | null;
  originElevation?: string | null;
  /** Plain-text place names — populated on real data even where `originPlace`/`destinationPlace` (the linked `Place` relation) are null. CORRECTED 2026-08-26: an explicitly-linked `originPlace`/`destinationPlace` should win over these for display when both are present (see `map-package-detail.ts`'s `resolveLocation`) — this field is the fallback, not preferred. */
  origin?: string | null;
  destination?: string | null;
  originCoordinate?: string | null;
  destinationCoordinate?: string | null;
  /** Google-encoded polyline for this leg's route, when authored (~73% of real rows). */
  encodedPolyline?: string | null;
  /** Real per-day media (`Attachment`s under `ownerType: 'itinerary-detail'`/`'itineraryDetail'`, role GALLERY, up to 3 — see AttachmentService's cap) — absolute URLs + type, attached by `PackageService.findPublicBySlug`/resolved in the controller, not a `Prisma.ItineraryDetail` scalar. */
  photos?: ItineraryDetailMedia[];
  destinationPlace?: ItineraryPlaceRef | null;
  originPlace?: ItineraryPlaceRef | null;
  duration?: string | null;
  distance?: string | null;
  travelMode?: string | null;
  meals?: string | null;
  /** Where this day's group stops for lunch — admin-entered, shown as "Name of lunch place" on the public itinerary card. */
  lunchPlace?: string | null;
  /** This day's overnight stay, admin-entered — shown as "Name of hotel" next to `lunchPlace` on the public itinerary card. */
  accommodation?: string | null;
}

export interface ItineraryResponse {
  detailsText?: string | null;
  details: ItineraryDetailResponse[];
}

export interface GroupFaqResponse {
  id: string;
  question: string;
  answer: string;
  categories: PackageCategoryRef[];
}

export interface TestimonialResponse {
  fullName: string;
  reviewTitle?: string | null;
  review: string;
  reviewRating?: number | string | null;
  reviewDate?: string | null;
}

export interface GalleryImageResponse {
  id: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  url: string;
}

/**
 * `extraFaqs` (`Package.extraFaqs`, a `Json?` column) has no confirmed
 * shape server-side ("ad hoc Q&A list, no FK target found in code" per
 * the repository's own comment) — real migrated data stores it as
 * `{ raw: "<h2>...</h2>..." }`, one HTML blob with `<h3>`-per-category /
 * `<h4>`-per-question structure, not the `{question, answer}[]` array the
 * repository's TS interface assumes. Typed loosely; `map-package-detail`
 * handles both shapes defensively.
 */
export type ExtraFaqsResponse = { raw?: string } | { question: string; answer: string }[] | null;

export interface PackageResponse {
  id: string;
  slug: string | null;
  title: string;
  abstract?: string | null;
  details?: string | null;
  tripInfoText?: string | null;
  highlights?: string | null;
  costIncludesText?: string | null;
  costExcludesText?: string | null;
  extraFaqs?: ExtraFaqsResponse;
  packingListIntro?: string | null;
  price: number | string;
  duration: number | string;
  durationType: string;
  groupSize?: string | null;
  discount?: number | string | null;
  maxAltitude?: string | null;
  usefulInfo?: string | null;
  departureNote?: string | null;

  destination: PackageCategoryRef;
  grade?: PackageCategoryRef | null;
  style?: PackageCategoryRef | null;
  transportation?: PackageCategoryRef | null;
  meals?: PackageCategoryRef | null;
  accommodation?: PackageCategoryRef | null;

  faqCategories: PackageCategoryRef[];
  faqs: { question: string; answer: string }[];
  groupFaqs: GroupFaqResponse[];
  customRelated: { id: string; title: string }[];

  costDetails: CostDetailResponse[];
  tiers: PackageTierResponse[];
  priceGroups: PriceGroupResponse[];
  facts: PackageFactResponse[];
  addOns: AddOnResponse[];
  departures: DepartureResponse[];
  itinerary?: ItineraryResponse | null;
  testimonials: TestimonialResponse[];

  imageUrl: string | null;
  galleryImages: GalleryImageResponse[];
}
