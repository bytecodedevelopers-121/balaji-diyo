export interface ItineraryMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface ItineraryFact {
  id: string;
  factTitle: string;
  factValue: string;
}

export interface ItineraryPlaceRef {
  id: string;
  placeName: string;
}

export interface ItineraryDetail {
  id: string;
  /** Global display position; the API returns rows already sorted by it. */
  sortOrder: number;
  itineraryDay: string;
  itineraryTitle: string | null;
  itineraryShortDescription: string | null;
  itineraryDescription: string | null;
  /** Decimal — serialized as a numeric string over the API. */
  itineraryStop: string | number | null;
  accommodation: string | null;
  lunchPlace: string | null;
  meals: string | null;
  origin: string | null;
  originCoordinate: string | null;
  originElevation: string | null;
  originPlaceId: string | null;
  originPlace: ItineraryPlaceRef | null;
  destination: string | null;
  destinationCoordinate: string | null;
  destinationElevation: string | null;
  destinationPlaceId: string | null;
  destinationPlace: ItineraryPlaceRef | null;
  travelMode: string | null;
  distance: string | null;
  duration: string | null;
  encodedPolyline: string | null;
  footnote: string | null;
  isActive: boolean;
  facts: ItineraryFact[];
}

export interface Itinerary {
  id: string;
  title: string;
  packageId: string;
  detailsText: string | null;
  mapData: string | null;
  details: ItineraryDetail[];
  slug: string | null;
  meta: ItineraryMeta | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryFactInput {
  factTitle: string;
  factValue: string;
}

export interface ItineraryDetailInput {
  /** The existing row's own id — round-tripped from ItineraryDetail.id so
   *  the backend can update this row in place instead of replacing it,
   *  which would orphan its Attachment-based photo/video gallery (see
   *  itinerary.repository.ts's `reconcileDetails`). Omitted for a stop
   *  added in this same edit that hasn't been saved yet. */
  id?: string;
  itineraryDay: string;
  itineraryTitle?: string;
  itineraryShortDescription?: string;
  itineraryDescription?: string;
  itineraryStop?: number;
  accommodation?: string;
  lunchPlace?: string;
  meals?: string;
  origin?: string;
  originCoordinate?: string;
  originElevation?: string;
  originPlaceId?: string;
  destination?: string;
  destinationCoordinate?: string;
  destinationElevation?: string;
  destinationPlaceId?: string;
  travelMode?: string;
  distance?: string;
  duration?: string;
  encodedPolyline?: string;
  footnote?: string;
  isActive?: boolean;
  facts?: ItineraryFactInput[];
}

export interface ItineraryFormValues {
  packageId: string;
  title: string;
  slug?: string;
  detailsText?: string;
  mapData?: string;
  details?: ItineraryDetailInput[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
