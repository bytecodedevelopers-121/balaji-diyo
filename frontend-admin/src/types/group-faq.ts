import type { Category } from "./category";

export interface GroupFaqMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface GroupFaq {
  id: string;
  question: string;
  answer: string;
  faqOrder: number;
  isActive: boolean;
  categories: Category[];
  meta: GroupFaqMeta | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupFaqDto {
  question: string;
  answer: string;
  isActive?: boolean;
  categoryIds: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

export interface UpdateGroupFaqDto {
  question?: string;
  answer?: string;
  isActive?: boolean;
  categoryIds?: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
