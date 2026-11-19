export interface PageMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface Page {
  id: string;
  title: string;
  content: string | null;
  pageOrder: number;
  isActive: boolean;
  parentId: string | null;
  linkedPagePath: string | null;
  linkedPageLabel: string | null;
  slug: string | null;
  meta: PageMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PageFormValues {
  title: string;
  slug?: string;
  content?: string;
  pageOrder?: number;
  isActive?: boolean;
  parentId?: string;
  /** null clears the link. */
  linkedPagePath?: string | null;
  linkedPageLabel?: string | null;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
