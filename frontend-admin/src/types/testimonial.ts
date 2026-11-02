export interface TestimonialPackage {
  id: string;
  title: string;
}

export interface TestimonialMember {
  id: string;
  fullName: string;
}

export interface TestimonialMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface Testimonial {
  id: string;
  salutation: string | null;
  fullName: string;
  reviewAbstract: string | null;
  reviewTitle: string | null;
  review: string;
  /** Prisma Decimal — the API serializes this as a numeric string, not a JS number. */
  reviewRating: number | null;
  reviewDate: string | null;
  countryCode: string;
  countryName: string;
  address: string | null;
  affiliateOrganization: string | null;
  organizationAddress: string | null;
  organizationPosition: string | null;
  organizationDescription: string | null;
  organizationLink: string | null;
  isFeatured: boolean;
  isActive: boolean;
  packages: TestimonialPackage[];
  members: TestimonialMember[];
  slug: string | null;
  meta: TestimonialMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TestimonialFormValues {
  slug?: string;
  salutation?: string;
  fullName: string;
  reviewAbstract?: string;
  reviewTitle?: string;
  review: string;
  reviewRating?: number;
  reviewDate?: string;
  countryCode: string;
  countryName: string;
  address?: string;
  affiliateOrganization?: string;
  organizationAddress?: string;
  organizationPosition?: string;
  organizationDescription?: string;
  organizationLink?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  packageIds: string[];
  memberIds?: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
