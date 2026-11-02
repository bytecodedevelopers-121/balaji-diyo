import { z } from 'zod';

const linkSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value.startsWith('/') || /^https?:\/\//i.test(value), {
    message: 'Must be an absolute http(s) URL or a site-relative path',
  });

export const CreateServiceDto = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(10000),
  secondaryDescription: z.string().trim().max(10000).nullable().optional(),
  imageUrl: linkSchema,
  ctaLabel: z.string().trim().min(1).max(80).optional(),
  ctaUrl: linkSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateServiceDtoType = z.infer<typeof CreateServiceDto>;
