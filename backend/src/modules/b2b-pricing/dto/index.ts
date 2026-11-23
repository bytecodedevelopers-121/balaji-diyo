import { z } from 'zod';
import { dateInput, moneyInput } from '../../b2b-common/b2b-inputs';

export const QuoteDto = z.object({
  packageId: z.string().min(1).max(64),
  departureId: z.string().min(1).max(64).optional(),
  // Optional when a departure is given (its date is authoritative); if both are sent they must agree.
  travelDate: dateInput.optional(),
  paxCount: z.number().int().min(1).max(500),
  agentMarkup: moneyInput.optional(),
  agentMarkupMode: z.enum(['PER_PAX', 'TOTAL']).default('TOTAL'),
});
export type QuoteDtoType = z.infer<typeof QuoteDto>;
