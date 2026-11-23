import { z } from 'zod';
import { Dec } from './b2b-money';
import type { ContractData, DateRange } from '../b2b-pricing/pricing.types';
import type { Prisma } from '@prisma/client';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD that is a real calendar date. */
export const dayString = z
  .string()
  .regex(DAY, 'Use YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), 'Invalid calendar date');

/** Date input: YYYY-MM-DD (UTC midnight) or a full ISO timestamp. */
export const dateInput = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date')
  .transform((s) => new Date(DAY.test(s) ? `${s}T00:00:00.000Z` : s));

/** Money as number or string, max 2 decimals, never negative; becomes an exact Decimal. */
export const moneyInput = z
  .union([z.number(), z.string()])
  .transform((v) => String(v).trim())
  .refine((s) => /^\d{1,10}(\.\d{1,2})?$/.test(s), 'Must be a non-negative amount with at most 2 decimals')
  .transform((s) => new Dec(s));

export const percentInput = z
  .union([z.number(), z.string()])
  .transform((v) => String(v).trim())
  .refine((s) => /^\d{1,3}(\.\d{1,2})?$/.test(s) && Number(s) <= 100, 'Must be between 0 and 100 with at most 2 decimals')
  .transform((s) => new Dec(s));

export const blackoutSchema = z
  .array(z.object({ start: dayString, end: dayString }).refine((r) => r.start <= r.end, 'start must be on or before end'))
  .max(100);

export const toContractData = (c: {
  id: string; rateType: ContractData['rateType']; netUnitPrice: Dec | null; commissionPct: Dec | null;
  validFrom: Date; validTo: Date; blackoutDates: Prisma.JsonValue | null; minPax: number | null; maxPax: number | null; cutoffHours: number;
}): ContractData => {
  const parsed = blackoutSchema.safeParse(c.blackoutDates ?? []);
  const blackoutDates: DateRange[] = parsed.success ? parsed.data : [];
  return {
    id: c.id, rateType: c.rateType, netUnitPrice: c.netUnitPrice, commissionPct: c.commissionPct,
    validFrom: c.validFrom, validTo: c.validTo, blackoutDates, minPax: c.minPax, maxPax: c.maxPax, cutoffHours: c.cutoffHours,
  };
};
