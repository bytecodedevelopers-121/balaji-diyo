import { z } from 'zod';

export const CreateTestimonialDto = z.object({
  slug: z.string().min(1).optional(),
  salutation: z.string().max(15).optional(),
  fullName: z.string().min(1).max(255),
  reviewAbstract: z.string().max(255).optional(),
  reviewTitle: z.string().max(255).optional(),
  review: z.string().min(1),
  reviewRating: z.number().min(0).max(10).optional(),
  reviewDate: z.coerce.date().optional(),
  countryCode: z.string().min(1).max(5),
  countryName: z.string().min(1).max(255),
  address: z.string().max(500).optional(),
  affiliateOrganization: z.string().max(255).optional(),
  organizationAddress: z.string().max(255).optional(),
  organizationPosition: z.string().max(255).optional(),
  organizationDescription: z.string().max(1500).optional(),
  organizationLink: z.string().max(255).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),

  packageIds: z.array(z.string()).min(1),
  memberIds: z.array(z.string()).optional(),

  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateTestimonialDtoType = z.infer<typeof CreateTestimonialDto>;
