export interface TripInfoMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface TripInfo {
  id: string;
  title: string;
  description: string;
  infoOrder: number;
  isActive: boolean;
  slug: string | null;
  meta: TripInfoMeta | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInfoDto {
  title: string;
  slug?: string;
  description: string;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

export interface UpdateTripInfoDto {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
