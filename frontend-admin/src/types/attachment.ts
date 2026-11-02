import type { Media } from "@/types/media";

export type AttachmentRole = "AVATAR" | "BANNER" | "SINGLE_BANNER" | "CAROUSEL" | "FEATURED" | "REEL" | "GALLERY" | "MAP";

export interface Attachment {
  id: string;
  mediaId: string;
  media: Media;
  role: AttachmentRole;
  ownerType: string;
  ownerId: string;
  sortOrder: number;
  reelUrl: string | null;
  shortDescription: string | null;
  contentUrl: string | null;
  isFeatured: boolean | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttachmentDto {
  mediaId: string;
  ownerType: string;
  ownerId: string;
  role: AttachmentRole;
  reelUrl?: string;
  shortDescription?: string;
  contentUrl?: string;
  isFeatured?: boolean;
}
