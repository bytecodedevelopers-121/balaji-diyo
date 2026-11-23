import { z } from 'zod';
import { dateInput } from '../../b2b-common/b2b-inputs';
import { WEBHOOK_EVENTS } from '../webhook.events';

const id = z.string().min(1).max(64);

export const CreateApiKeyDto = z.object({
  name: z.string().trim().min(1).max(80),
  rateLimitRpm: z.number().int().min(1).max(600).default(60),
  expiresAt: dateInput.refine((d) => d.getTime() > Date.now(), 'expiresAt must be in the future').optional(),
});
export type CreateApiKeyDtoType = z.infer<typeof CreateApiKeyDto>;

const events = z.array(z.enum(WEBHOOK_EVENTS)).min(1).max(WEBHOOK_EVENTS.length).transform((e) => [...new Set(e)]);

export const CreateWebhookDto = z.object({
  url: z.string().trim().url().max(500),
  events,
  isActive: z.boolean().default(true),
});
export type CreateWebhookDtoType = z.infer<typeof CreateWebhookDto>;

export const UpdateWebhookDto = z
  .object({ url: z.string().trim().url().max(500), events, isActive: z.boolean() })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Provide at least one field to change' });
export type UpdateWebhookDtoType = z.infer<typeof UpdateWebhookDto>;

export const IdParamsDto = z.object({ id });

export const DeliveriesQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'DELIVERED', 'FAILED']).optional(),
});
export type DeliveriesQueryDtoType = z.infer<typeof DeliveriesQueryDto>;
