import { z } from 'zod';

// Matches the legacy webhook body shape exactly (`order_id`, `payment_status`)
// — the only concrete evidence available without official 2c2p docs. See
// payment.service.ts#handlePacoCallback for the "no signature verification"
// note — this is a known gap, not an oversight.
export const PacoCallbackDto = z.object({
  order_id: z.string().min(1),
  payment_status: z.string().min(1),
});

export type PacoCallbackDtoType = z.infer<typeof PacoCallbackDto>;
