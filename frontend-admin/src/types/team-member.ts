import type { Category } from "./category";

export interface TeamMemberMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface TeamMember {
  id: string;
  position: string;
  positionOrder: number;
  salutation: string | null;
  fullName: string;
  photoUrl: string | null;
  countryCode: string;
  countryName: string;
  memberAddress: string;
  memberPhone: string | null;
  memberEmail: string | null;
  memberFacebook: string | null;
  memberTwitter: string | null;
  memberInstagram: string | null;
  memberWebsite: string | null;
  quoteAbstract: string | null;
  quote: string | null;
  description: string | null;
  isFeatured: boolean;
  isActive: boolean;
  categories: Category[];
  slug: string | null;
  meta: TeamMemberMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TeamMemberFormValues {
  position: string;
  positionOrder?: number;
  slug?: string;
  salutation?: string;
  fullName: string;
  photoUrl?: string;
  countryCode: string;
  countryName: string;
  memberAddress: string;
  memberPhone?: string;
  memberEmail?: string;
  memberFacebook?: string;
  memberTwitter?: string;
  memberInstagram?: string;
  memberWebsite?: string;
  quoteAbstract?: string;
  quote?: string;
  description?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  categoryIds: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
