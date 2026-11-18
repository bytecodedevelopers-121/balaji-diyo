import { z } from 'zod';

const slug = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens');

export const DestinationCardDto = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  image: z.string().min(1),
  categoryKey: z.string().optional(),
});

export const CreateDestinationDto = z.object({
  slug,
  name: z.string().min(1).max(160),
  countryLabel: z.string().min(1).max(160),
  heroImage: z.string().min(1),
  intro: z.string().min(1),
  cards: z.array(DestinationCardDto),
  contentHtml: z.string(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const UpdateDestinationDto = CreateDestinationDto.partial();

export const GuideSectionDto = z.object({
  heading: z.string().optional(),
  body: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  bullets: z.array(z.string()).optional(),
  note: z.string().optional(),
});

export const GuideTopicDto = z.object({
  slug,
  title: z.string().min(1).max(255),
  image: z.string().min(1),
  summary: z.string().min(1),
  intro: z.array(z.string()).optional(),
  sections: z.array(GuideSectionDto),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const UpdateGuideTopicDto = GuideTopicDto.partial();

export const CreateTravelGuideDto = z.object({
  slug,
  country: z.string().min(1).max(160),
  title: z.string().min(1).max(255),
  image: z.string().min(1),
  summary: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const UpdateTravelGuideDto = CreateTravelGuideDto.partial();

export const WebStorySlideDto = z
  .object({ image: z.string().default(""), video: z.string().optional(), caption: z.string().default("") })
  .refine((s) => s.image.length > 0 || (s.video ?? "").length > 0, { message: "Each slide needs an image or a video" });

export const CreateWebStoryDto = z.object({
  slug,
  title: z.string().min(1).max(255),
  cover: z.string().min(1),
  slides: z.array(WebStorySlideDto).min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export const UpdateWebStoryDto = CreateWebStoryDto.partial();

export type CreateDestinationDtoType = z.infer<typeof CreateDestinationDto>;
export type UpdateDestinationDtoType = z.infer<typeof UpdateDestinationDto>;
export type CreateTravelGuideDtoType = z.infer<typeof CreateTravelGuideDto>;
export type UpdateTravelGuideDtoType = z.infer<typeof UpdateTravelGuideDto>;
export type GuideTopicDtoType = z.infer<typeof GuideTopicDto>;
export type UpdateGuideTopicDtoType = z.infer<typeof UpdateGuideTopicDto>;
export type CreateWebStoryDtoType = z.infer<typeof CreateWebStoryDto>;
export type UpdateWebStoryDtoType = z.infer<typeof UpdateWebStoryDto>;
