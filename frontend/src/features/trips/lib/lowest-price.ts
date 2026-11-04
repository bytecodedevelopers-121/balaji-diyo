import { toNumber } from "@/lib/decimal";
import type { RawPackagePriceGroup } from "../types/trip.types";

/** The lowest real per-person price across a package's price groups (offer price preferred over list price). */
export function lowestPrice(priceGroups: RawPackagePriceGroup[] | undefined): number | undefined {
  if (!priceGroups || priceGroups.length === 0) return undefined;
  const prices = priceGroups
    .map((group) => toNumber(group.offerUnitPrice) ?? toNumber(group.unitPrice))
    .filter((price): price is number => price !== undefined);
  return prices.length > 0 ? Math.min(...prices) : undefined;
}
