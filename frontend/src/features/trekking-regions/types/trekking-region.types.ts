import type { Trip } from "@/features/trips/types/trip.types";

export interface CategoryMeta {
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export interface TrekkingRegion {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  parentId: string | null;
  imageUrl: string | null;
  packageCount: number;
  meta?: CategoryMeta | null;
}

export interface TrekkingRegionDetail {
  region: TrekkingRegion;
  trips: Trip[];
  meta: { currentPage: number; totalPages: number };
}
