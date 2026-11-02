import { z } from 'zod';

export const CreateTeamMemberDto = z.object({
  slug: z.string().min(1).optional(),
  position: z.string().min(1).max(255),
  positionOrder: z.number().min(0).optional(),
  salutation: z.string().max(10).optional(),
  fullName: z.string().min(1).max(255),
  photoUrl: z.string().max(2000).optional(),
  countryCode: z.string().min(1).max(5),
  countryName: z.string().min(1).max(255),
  memberAddress: z.string().min(1).max(500),
  memberPhone: z.string().max(255).optional(),
  memberEmail: z.string().email().max(255).optional(),
  memberFacebook: z.string().max(255).optional(),
  memberTwitter: z.string().max(255).optional(),
  memberInstagram: z.string().max(255).optional(),
  memberWebsite: z.string().max(255).optional(),
  quoteAbstract: z.string().max(255).optional(),
  quote: z.string().max(255).optional(),
  description: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),

  categoryIds: z.array(z.string()).min(1).max(5),

  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateTeamMemberDtoType = z.infer<typeof CreateTeamMemberDto>;
