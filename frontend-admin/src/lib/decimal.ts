// Prisma `Decimal` fields serialize over the API as numeric strings, not JS
// numbers (confirmed on Testimonial.reviewRating, Package.price/duration,
// PriceGroup.unitPrice, Departure.departureCost, etc.) — coerce at read time
// rather than mistyping these fields as `number` and hoping.
export function toNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? undefined : n;
}
