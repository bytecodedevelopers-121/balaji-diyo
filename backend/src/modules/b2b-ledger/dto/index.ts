import { z } from 'zod';
import { moneyInput } from '../../b2b-common/b2b-inputs';

const positiveMoney = moneyInput.refine((d) => d.gt(0), 'Amount must be greater than zero');

export const TopUpInitiateDto = z.object({
  amount: positiveMoney.refine((d) => d.lte(1_000_000), 'Maximum single top-up is 1,000,000'),
  currency: z.enum(['USD', 'NPR']).optional(), // gateway charge currency; the wallet is always credited in USD
});
export type TopUpInitiateDtoType = z.infer<typeof TopUpInitiateDto>;

export const LedgerQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  entryType: z.enum(['WALLET_TOPUP', 'BOOKING_DEBIT', 'CREDIT_LINE_DRAW', 'CREDIT_LINE_REPAYMENT', 'REFUND_CREDIT', 'COMMISSION_CREDIT', 'ADJUSTMENT']).optional(),
  account: z.enum(['WALLET', 'CREDIT']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type LedgerQueryDtoType = z.infer<typeof LedgerQueryDto>;

export const LedgerAdjustmentDto = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('ADJUSTMENT'),
    account: z.enum(['WALLET', 'CREDIT']),
    direction: z.enum(['DEBIT', 'CREDIT']),
    amount: positiveMoney,
    description: z.string().trim().min(3).max(500),
  }),
  z.object({
    kind: z.literal('CREDIT_LINE_REPAYMENT'),
    amount: positiveMoney,
    description: z.string().trim().max(500).optional(),
  }),
  z.object({
    kind: z.literal('CREDIT_LIMIT'),
    creditLimit: moneyInput,
    description: z.string().trim().min(3).max(500),
  }),
]);
export type LedgerAdjustmentDtoType = z.infer<typeof LedgerAdjustmentDto>;

export const PartnerIdParamsDto = z.object({ id: z.string().min(1).max(64) });
