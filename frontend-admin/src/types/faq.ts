export interface FaqMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  faqOrder: number;
  isActive: boolean;
  meta: FaqMeta | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqDto {
  question: string;
  answer: string;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

export interface UpdateFaqDto {
  question?: string;
  answer?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
