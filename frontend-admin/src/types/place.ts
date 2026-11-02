export interface PlaceMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface Place {
  id: string;
  placeName: string;
  placeAbstract: string | null;
  placeDescription: string | null;
  placeElevation: string | null;
  placeCoordinates: string | null;
  placeMap: string | null;
  placeExtra: string | null;
  attractionOrder: number;
  placeTypeId: string | null;
  placeType: { id: string; title: string } | null;
  routeMapId: string | null;
  routeMap: { id: string; mapTitle: string; isActive: boolean; deletedAt: string | null } | null;
  regions: Array<{
    categoryId: string;
    sortOrder: number;
    isPrimary: boolean;
    category: { id: string; title: string };
  }>;
  facts: Array<{ id: string; label: string; value: string; sortOrder: number }>;
  isFeatured: boolean;
  isActive: boolean;
  slug: string | null;
  meta: PlaceMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PlaceFormValues {
  placeName: string;
  slug?: string;
  placeAbstract?: string;
  placeDescription?: string;
  placeElevation?: string;
  placeCoordinates?: string;
  placeMap?: string;
  placeExtra?: string;
  attractionOrder?: number;
  regionIds?: string[];
  primaryRegionId?: string;
  placeTypeId?: string | null;
  routeMapId?: string | null;
  facts?: Array<{ label: string; value: string }>;
  isFeatured?: boolean;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
