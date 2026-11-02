export interface PackageMapMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface PackageMap {
  id: string;
  packageId: string;
  mapTitle: string;
  mapAbstract: string | null;
  mapDetails: string | null;
  isActive: boolean;
  slug: string | null;
  meta: PackageMapMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePackageMapDto {
  packageId: string;
  mapTitle: string;
  slug?: string;
  mapAbstract?: string;
  mapDetails?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

export interface UpdatePackageMapDto {
  mapTitle?: string;
  slug?: string;
  mapAbstract?: string;
  mapDetails?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
