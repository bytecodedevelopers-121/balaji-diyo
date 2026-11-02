import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';

export const GetPaymentsDto = z.object({
  page: z.string().optional(),
  perPage: z.string().optional(),
  packageId: z.string().optional(),
  gateway: z.enum(['NABIL', 'HBL', 'NICA', 'PACO']).optional(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
  includeTrashed: booleanQueryParam,
});

export type GetPaymentsDtoType = z.infer<typeof GetPaymentsDto>;
