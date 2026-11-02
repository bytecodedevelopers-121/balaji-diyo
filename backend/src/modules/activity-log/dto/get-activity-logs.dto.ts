import { z } from 'zod';

export const GetActivityLogsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  loggerType: z.string().optional(),
  loggerId: z.string().optional(),
  actionCategory: z.string().optional(),
});

export type GetActivityLogsDtoType = z.infer<typeof GetActivityLogsDto>;
