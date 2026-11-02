import { z } from 'zod';

// For manual reconciliation by an admin (e.g. confirmed a bank transfer, or
// checked a gateway's dashboard directly) — not a gateway webhook handler.
export const UpdatePaymentStatusDto = z.object({
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED']),
  gatewayReference: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
});

export type UpdatePaymentStatusDtoType = z.infer<typeof UpdatePaymentStatusDto>;
