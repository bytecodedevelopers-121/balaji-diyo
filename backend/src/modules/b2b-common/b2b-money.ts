import { Prisma } from '@prisma/client';

/** All money math goes through Decimal — never JS floats. */
export const Dec = Prisma.Decimal;
export type Dec = Prisma.Decimal;

export const ZERO = new Dec(0);
export const round2 = (d: Dec): Dec => d.toDecimalPlaces(2, Dec.ROUND_HALF_UP);

/** Catalog prices carry no currency column; the storefront (and PACO flow) treat them as USD. */
export const BASE_CATALOG_CURRENCY = 'USD';

/** UTC calendar day as YYYY-MM-DD — contract validity / blackout dates are compared on this. */
export const utcDay = (d: Date): string => d.toISOString().slice(0, 10);

export const dayToDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);
