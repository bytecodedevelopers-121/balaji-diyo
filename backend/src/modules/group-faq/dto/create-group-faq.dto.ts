import { z } from 'zod';

export const CreateGroupFaqDto = z.object({
  question: z.string().min(5).max(255),
  answer: z.string().min(5),
  isActive: z.boolean().optional(),
  categoryIds: z.array(z.string()).min(1).max(5),
  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateGroupFaqDtoType = z.infer<typeof CreateGroupFaqDto>;
