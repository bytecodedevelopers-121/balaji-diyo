export interface AttractionMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface AttractionCategory {
  id: string;
  title: string;
}

export interface AttractionRegionRelation {
  categoryId: string;
  sortOrder: number;
  isPrimary: boolean;
  category: AttractionCategory;
}

export interface AttractionFact {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface AttractionGalleryImage {
  id: string;
  url: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
}

export interface AttractionSummary {
  id: string;
  placeName: string;
  placeAbstract: string | null;
  placeElevation: string | null;
  attractionOrder: number;
  isFeatured: boolean;
  slug: string | null;
  imageUrl: string | null;
  placeType: AttractionCategory | null;
  regions: AttractionRegionRelation[];
}

export interface AttractionGroup {
  id: string;
  title: string;
  categoryOrder: number;
  places: AttractionSummary[];
}

export interface AttractionIndex {
  featuredPlaces: AttractionSummary[];
  regions: AttractionGroup[];
}

export interface AttractionRelatedPackage {
  id: string;
  title: string;
  abstract: string | null;
  price: string;
  duration: string;
  durationType: string;
  slug: string | null;
}

export interface AttractionRelatedBlog {
  id: string;
  title: string;
  abstract: string | null;
  blogDate: string;
  slug: string | null;
}

export interface AttractionRouteMap {
  id: string;
  mapTitle: string;
  /** Slug of the trekking route page (`/map/[slug]`) this attraction's map opens. */
  slug: string;
}

export interface AttractionDetail extends AttractionSummary {
  placeDescription: string | null;
  placeCoordinates: string | null;
  placeMap: string | null;
  placeExtra: string | null;
  /** Null when no trekking route map is linked (or the linked one is hidden/trashed). */
  routeMap: AttractionRouteMap | null;
  facts: AttractionFact[];
  galleryImages?: AttractionGalleryImage[];
  meta: AttractionMeta | null;
  packages: AttractionRelatedPackage[];
  blogs: AttractionRelatedBlog[];
}
