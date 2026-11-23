import { z } from 'zod';
import { moneyInput } from '../../b2b-common/b2b-inputs';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 366;

const parseBound = (s: string, end: boolean): Date | null => {
  if (Number.isNaN(Date.parse(s))) return null;
  const d = new Date(DAY.test(s) ? `${s}T00:00:00.000Z` : s);
  // A date-only upper bound means "through the end of that day".
  return end && DAY.test(s) ? new Date(d.getTime() + DAY_MS - 1) : d;
};

/** from/to (YYYY-MM-DD or ISO). Defaults to the last 30 days; capped at 366 days. */
export const PeriodDto = z
  .object({ from: z.string().optional(), to: z.string().optional() })
  .transform((v, ctx) => {
    const to = v.to ? parseBound(v.to, true) : new Date();
    const from = v.from ? parseBound(v.from, false) : to ? new Date(to.getTime() - 30 * DAY_MS) : null;
    if (!from || !to) { ctx.addIssue({ code: 'custom', message: 'Invalid date' }); return z.NEVER; }
    if (from.getTime() > to.getTime()) { ctx.addIssue({ code: 'custom', message: 'from must be on or before to' }); return z.NEVER; }
    if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) { ctx.addIssue({ code: 'custom', message: `Range cannot exceed ${MAX_RANGE_DAYS} days` }); return z.NEVER; }
    return { from, to };
  });
export type Period = z.output<typeof PeriodDto>;

export const AdminSettlementsQueryDto = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    partnerId: z.string().min(1).max(64).optional(),
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(15),
  });

const positive = moneyInput.refine((d) => d.gt(0), 'Amount must be greater than zero');
const ref = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/, 'Letters, digits and . _ : - only').optional();

/** `settlementRef` makes a retried request idempotent: the same ref can only ever post once. */
export const RecordSettlementDto = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('CREDIT_LINE_REPAYMENT'), amount: positive, description: z.string().trim().max(500).optional(), settlementRef: ref }),
  z.object({ kind: z.literal('COMMISSION_CREDIT'), amount: positive, description: z.string().trim().min(3).max(500), settlementRef: ref }),
  z.object({
    kind: z.literal('ADJUSTMENT'), account: z.enum(['WALLET', 'CREDIT']), direction: z.enum(['DEBIT', 'CREDIT']),
    amount: positive, description: z.string().trim().min(3).max(500), settlementRef: ref,
  }),
]);
export type RecordSettlementDtoType = z.infer<typeof RecordSettlementDto>;

export const PartnerParamsDto = z.object({ id: z.string().min(1).max(64) });
