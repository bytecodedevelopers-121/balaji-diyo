export interface PackageCategoryRef {
  id: string;
  title: string;
}

export interface PackagePlaceRef {
  id: string;
  placeName: string;
}

export interface PackageFaqRef {
  id: string;
  question: string;
}

export interface PackageTripInfoRef {
  id: string;
  title: string;
}

export interface PackageRelatedRef {
  id: string;
  title: string;
}

export interface PackageMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

/** `detailType` is set server-side from which array (`costIncludes`/`costExcludes`) the row came from. */
export interface CostDetail {
  id: string;
  detailKey: string;
  detailTitle: string;
  detailDescription: string | null;
  detailExtra: string | null;
  detailType: "INCLUDE" | "EXCLUDE";
  isActive: boolean;
  costCategoryId: string | null;
  sortOrder: number;
}

/** One row sent to the API; the server fills `detailKey` from the category's name. */
export interface CostDetailInput {
  costCategoryId?: string;
  detailKey?: string;
  detailTitle?: string;
  detailDescription?: string;
}

export interface PriceGroup {
  id: string;
  packageTier: string;
  minPeople: number;
  maxPeople: number;
  shortDescription: string | null;
  /** Decimal — serialized as a numeric string over the API. */
  unitPrice: string | number;
  offerUnitPrice: string | number | null;
  offerLabel: string | null;
  offerInformation: string | null;
  isDefault: boolean;
}

export interface PackageFact {
  id: string;
  factTitle: string;
  factValue: string;
}

export interface AddOn {
  id: string;
  addonTitle: string;
  addonDescription: string | null;
  /** Decimal — serialized as a numeric string over the API. */
  addonPrice: string | number;
  addonUnit: string | null;
  chargeBy: "PERSON" | "ROOM" | "FLAT";
  peoplePerRoom: number;
}

export interface PackageTier {
  id: string;
  packageTier: string;
  packageTierAlias: string;
  packageTierDescription: string;
  costIncludes: string | null;
  costExcludes: string | null;
  wetravelUuid: string | null;
}

export interface ExtraFaqItem {
  question: string;
  answer: string;
}

export interface Package {
  id: string;
  title: string;
  abstract: string | null;
  details: string | null;
  tripInfoText: string | null;
  highlights: string | null;
  costIncludesText: string | null;
  costExcludesText: string | null;
  extraFaqs: ExtraFaqItem[] | null;
  packingListIntro: string | null;
  /** Decimal fields — serialized as numeric strings over the API. */
  price: string | number;
  duration: string | number;
  durationType: string;
  groupSize: string | null;
  discount: string | number | null;
  maxAltitude: string | null;
  geoLongitude: string | null;
  geoLatitude: string | null;
  usefulInfo: string | null;
  departureNote: string | null;
  additionalField1: string | null;
  additionalField2: string | null;
  isFeatured: boolean;
  // Independent of `isFeatured`/`sortOrder` — drives the homepage's "Most
  // Popular Journeys" section instead of the Featured carousel/Lineup.
  isPopular: boolean;
  isActive: boolean;
  // Manual display order — drives both the admin Packages list and the
  // public homepage's featured carousel. Read-only here; only changed via
  // the dedicated reorder endpoint (see usePackages.ts's useReorderPackages).
  sortOrder: number;
  // Read-only here too; only changed via useReorderPopularPackages.
  popularSortOrder: number;
  // Admin-editable "Published" date — distinct from `createdAt` below,
  // which never changes. Defaults to createdAt on already-migrated rows.
  publishedAt: string;
  canonical: string | null;

  destinationId: string;
  destination: PackageCategoryRef;
  gradeId: string | null;
  grade: PackageCategoryRef | null;
  styleId: string | null;
  style: PackageCategoryRef | null;
  transportationId: string | null;
  transportation: PackageCategoryRef | null;
  mealsId: string | null;
  meals: PackageCategoryRef | null;
  accommodationId: string | null;
  accommodation: PackageCategoryRef | null;

  categories: PackageCategoryRef[];
  faqCategories: PackageCategoryRef[];
  places: PackagePlaceRef[];
  faqs: PackageFaqRef[];
  groupFaqs: PackageFaqRef[];
  tripInfos: PackageTripInfoRef[];
  customRelated: PackageRelatedRef[];

  costDetails: CostDetail[];
  priceGroups: PriceGroup[];
  facts: PackageFact[];
  addOns: AddOn[];
  tiers: PackageTier[];

  slug: string | null;
  urlTitle: string | null;
  meta: PackageMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PriceGroupInput {
  packageTier: string;
  minPeople: number;
  maxPeople: number;
  shortDescription?: string;
  unitPrice: number;
  offerUnitPrice?: number;
  offerLabel?: string;
  offerInformation?: string;
  isDefault?: boolean;
}

export interface FactInput {
  factTitle: string;
  factValue: string;
}

export interface AddOnInput {
  addonTitle: string;
  addonDescription?: string;
  addonPrice: number;
  addonUnit?: string;
  chargeBy?: "PERSON" | "ROOM" | "FLAT";
  peoplePerRoom?: number;
}

export interface TierInput {
  packageTier: string;
  packageTierAlias: string;
  packageTierDescription: string;
  costIncludes?: string;
  costExcludes?: string;
  wetravelUuid?: string;
}

export interface PackageFormValues {
  title: string;
  slug?: string;
  urlTitle?: string;
  canonical?: string;
  abstract?: string;
  details?: string;
  tripInfoText?: string;
  highlights?: string;
  extraFaqs?: ExtraFaqItem[];
  packingListIntro?: string;

  price: number;
  duration: number;
  durationType: string;
  groupSize?: string;
  discount?: number;
  maxAltitude?: string;
  geoLongitude?: string;
  geoLatitude?: string;
  usefulInfo?: string;
  departureNote?: string;
  additionalField1?: string;
  additionalField2?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  publishedAt?: string;

  destinationId: string;
  gradeId?: string;
  styleId?: string;
  transportationId?: string;
  mealsId?: string;
  accommodationId?: string;

  categoryIds?: string[];
  faqCategoryIds?: string[];
  placeIds?: string[];
  faqIds?: string[];
  groupFaqIds?: string[];
  tripInfoIds?: string[];
  customRelatedIds?: string[];

  priceGroups?: PriceGroupInput[];
  facts?: FactInput[];
  addOns?: AddOnInput[];
  tiers?: TierInput[];
  costIncludes?: CostDetailInput[];
  costExcludes?: CostDetailInput[];

  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
