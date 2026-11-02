/**
 * Small framework-agnostic helpers shared across the app. Keep this file
 * free of React/Next imports — anything DOM- or request-specific belongs
 * in its own module (see src/lib/seo, src/lib/api).
 */

/** Joins class names, skipping falsy values. Not a Tailwind-merge — fine until conflicting variant classes need resolving. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Type guard for narrowing `unknown` values (e.g. catch blocks) to Error. */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
