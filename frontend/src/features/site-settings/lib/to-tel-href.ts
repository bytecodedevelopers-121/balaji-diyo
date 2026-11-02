/**
 * "+977 9845000000" -> "tel:+9779845000000" — strips everything but a
 * leading "+" and digits. Matches `config/site.ts`'s old hardcoded
 * `phoneHref` exactly for the same `mobile` number, just derived from
 * the live setting instead of a second hand-kept literal.
 */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
