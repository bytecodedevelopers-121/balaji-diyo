import type { PackageDetail } from "../data";

/**
 * Shared math/formatting for the booking flow (BookingConfirmModal +
 * the /book-now checkout page) — kept in one place so both steps
 * compute the same trip length, per-pax price, and date labels instead
 * of quietly drifting apart.
 */

/** Total trip length in days, inclusive of both the arrival and departure day. */
export function tripDurationDays(trip: PackageDetail): number {
  return trip.shortItinerary.length || 1;
}

/** `startDateIso` + (duration - 1) days, as a `YYYY-MM-DD` string. */
export function computeEndDate(startDateIso: string, durationDays: number): string {
  const start = new Date(`${startDateIso}T00:00:00`);
  if (Number.isNaN(start.getTime())) return startDateIso;
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, durationDays - 1));
  return end.toISOString().slice(0, 10);
}

/** e.g. "31 Aug, 2026" / weekday e.g. "MONDAY" — matches the Figma date-pair style. */
export function formatDayLabel(iso: string): { weekday: string; date: string } {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { weekday: "—", date: iso };
  }
  return {
    weekday: parsed.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
    date: parsed.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }),
  };
}

/**
 * Parses a `costTiers` group-size label ("1 person", "2 - 4 people",
 * "9+ people") into an inclusive `[min, max]` range. `max` is `Infinity`
 * for an open-ended "N+" tier.
 */
function parseGroupSizeRange(groupSize: string): [number, number] {
  const openEnded = groupSize.match(/(\d+)\s*\+/);
  if (openEnded) return [Number(openEnded[1]), Infinity];

  const range = groupSize.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return [Number(range[1]), Number(range[2])];

  const single = groupSize.match(/(\d+)/);
  const n = single ? Number(single[1]) : 1;
  return [n, n];
}

/** Per-person price for a given traveler count, from `trip.costTiers`. Falls back to the last tier for a count past every defined range. */
export function pricePerPersonForAdults(trip: PackageDetail, adults: number): number {
  const tier = trip.costTiers.find((t) => {
    const [min, max] = parseGroupSizeRange(t.groupSize);
    return adults >= min && adults <= max;
  });
  return tier?.pricePerPerson ?? trip.costTiers.at(-1)?.pricePerPerson ?? trip.priceFrom;
}

/**
 * Splits a single free-typed "Contact Number" field (e.g. "+977 555 000
 * 0000") into the `countryCode`/`mobileNumber` pair the backend still
 * requires as two separate columns (`Booking.countryCode` is a required,
 * non-nullable DB column — not something to change for a form-only
 * request). The checkout form no longer asks for the dialing code in its
 * own input; this recovers it from a leading "+<digits>" instead.
 *
 * Falls back to putting the whole string in `mobileNumber` with a
 * placeholder `countryCode` when no leading "+<digits>" is present (the
 * placeholder-hinted "+977 555 000 0000" format is skipped) — keeps the
 * booking submittable rather than failing on a required field the user
 * no longer sees.
 */
export function splitContactNumber(raw: string): { countryCode: string; mobileNumber: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match && match[2]) {
    return { countryCode: match[1], mobileNumber: match[2] };
  }
  return { countryCode: "-", mobileNumber: trimmed };
}

export type PaymentOption = "deposit" | "full";

export const DEPOSIT_PERCENTAGE = 20;

export function depositAmount(total: number): number {
  return Math.round((total * DEPOSIT_PERCENTAGE) / 100);
}
