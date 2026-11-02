import { z } from 'zod';
import {
  isValidRedirectDestination,
  isValidRedirectSource,
  normalizeRedirectSource,
} from '../redirect-manager.utils';

const RedirectSource = z
  .string()
  .min(1)
  .max(255)
  .refine(isValidRedirectSource, {
    message: 'Source must be an absolute path without a query string or fragment',
  })
  .transform(normalizeRedirectSource);

const RedirectDestination = z
  .string()
  .min(1)
  .max(255)
  .refine(isValidRedirectDestination, {
    message: 'Destination must be an absolute path or an HTTP(S) URL without credentials',
  })
  .transform((value) => value.trim());

export const CreateRedirectDto = z.object({
  source: RedirectSource,
  destination: RedirectDestination,
  isPermanent: z.boolean().optional(),
  redirectCode: z.string().max(15).optional(),
  redirectMessage: z.string().max(1500).optional(),
  redirectStatus: z.boolean().optional(),
});

export type CreateRedirectDtoType = z.infer<typeof CreateRedirectDto>;

export const CreateRedirectsBulkDto = z.object({
  redirects: z.array(CreateRedirectDto).min(1).max(200),
});

export type CreateRedirectsBulkDtoType = z.infer<typeof CreateRedirectsBulkDto>;
