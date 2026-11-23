import type { TravellerInput } from "@/types/b2b";

export const emptyTraveller = (isLead = false): TravellerInput => ({ fullName: "", email: "", gender: "", nationality: "", countryCode: "", mobileNumber: "", passportNo: "", isLead });

/** Grows/shrinks the list to `count`, keeping what was already typed and a single lead. */
export function resizeTravellers(list: TravellerInput[], count: number): TravellerInput[] {
  const next = list.slice(0, count);
  while (next.length < count) next.push(emptyTraveller(next.length === 0));
  if (!next.some((t) => t.isLead) && next[0]) next[0] = { ...next[0], isLead: true };
  return next;
}

export function validateTravellers(list: TravellerInput[], { genderRequired = false }: { genderRequired?: boolean } = {}): string | null {
  for (const [i, t] of list.entries()) {
    const label = `Traveller ${i + 1}`;
    if (!t.fullName.trim()) return `${label}: full name is required.`;
    if (!/^\S+@\S+\.\S+$/.test(t.email.trim())) return `${label}: a valid email is required.`;
    if (!t.nationality.trim()) return `${label}: nationality is required.`;
    if (!t.countryCode.trim()) return `${label}: country code is required.`;
    if (genderRequired && !t.gender?.trim()) return `${label}: gender is required.`;
  }
  return null;
}

/** Drops blank optional fields so the API's validation doesn't see "" as a value. */
export const cleanTravellers = (list: TravellerInput[]): TravellerInput[] =>
  list.map((t) => ({
    fullName: t.fullName.trim(), email: t.email.trim(), nationality: t.nationality.trim(), countryCode: t.countryCode.trim(), isLead: !!t.isLead,
    ...(t.gender?.trim() ? { gender: t.gender.trim() } : {}),
    ...(t.mobileNumber?.trim() ? { mobileNumber: t.mobileNumber.trim() } : {}),
    ...(t.passportNo?.trim() ? { passportNo: t.passportNo.trim() } : {}),
  }));
