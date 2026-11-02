export interface Media {
  id: string;
  mime: string | null;
  extension: string | null;
  altText: string | null;
  caption: string | null;
  fullName: string;
  fullPath: string;
  thumbName: string | null;
  thumbPath: string | null;
  width: number | null;
  height: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateMediaDto {
  altText?: string;
}
