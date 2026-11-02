import { z } from 'zod';

export const CreateFaqDto = z.object({
  question: z.string().min(5).max(255),
  answer: z.string().min(5),
  isActive: z.boolean().optional(),
  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreateFaqDtoType = z.infer<typeof CreateFaqDto>;
