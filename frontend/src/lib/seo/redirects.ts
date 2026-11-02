import type { LegacyRedirect } from "@/config/legacy-routes";

export interface NextRedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/**
 * Maps the app's `LegacyRedirect` model (src/config/legacy-routes.ts) onto
 * the shape Next.js's `redirects()` config expects.
 *
 * Kept as a separate mapping function — rather than using
 * `LegacyRedirect[]` directly in next.config.ts — so the *data* (which
 * will eventually come from a generated artifact or database, per that
 * file's docs) stays decoupled from how it's wired into Next.js. Today
 * the shapes are identical, so this is a pass-through; that's expected to
 * change once redirects need Next-specific options (e.g. `basePath`,
 * `has`/`missing` conditions) that don't belong in the app's own model.
 */
export function toNextRedirects(
  redirects: LegacyRedirect[],
): NextRedirectRule[] {
  return redirects.map(({ source, destination, permanent }) => ({
    source,
    destination,
    permanent,
  }));
}
