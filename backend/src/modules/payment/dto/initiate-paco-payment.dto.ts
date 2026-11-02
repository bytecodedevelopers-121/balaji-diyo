import { z } from 'zod';

export const InitiatePacoPaymentDto = z.object({
  packageId: z.string().optional(),
  // The Booking this payment belongs to (/book-now flow only).
  bookingId: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  amount: z.number().min(0.01),
  description: z.string().optional(),
  percentage: z.number().int().min(0).max(100).optional(),
  // Set by the standalone /online-payment page only — a payment with no
  // Booking behind it, so nothing else emails the customer at this point
  // (the /book-now flow already sends its own booking confirmation).
  // Optional per-request override of the default PACO_CHARGE_CURRENCY.
  currency: z.enum(['USD', 'NPR']).optional(),
  standalone: z.boolean().optional(),
});

export type InitiatePacoPaymentDtoType = z.infer<typeof InitiatePacoPaymentDto>;
