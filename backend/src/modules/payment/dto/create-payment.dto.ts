import { z } from 'zod';

export const CreatePaymentDto = z.object({
  gateway: z.enum(['NABIL', 'HBL', 'NICA', 'PACO']),
  packageId: z.string().optional(),
  customTitle: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  description: z.string().optional(),
  percentage: z.number().int().min(0).max(100).optional(),
  totalAmount: z.number().min(0),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']).optional(),
  gatewayReference: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
});

export type CreatePaymentDtoType = z.infer<typeof CreatePaymentDto>;
