export interface GalleryAlbumMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  destinationId: string;
  destination: { id: string; title: string };
  slug: string | null;
  meta: GalleryAlbumMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface GalleryAlbumFormValues {
  title: string;
  slug?: string;
  description?: string;
  destinationId: string;
  displayOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
