import { publicEnv } from "@/lib/env";

/**
 * Absolute URL for `path` under this deploy's own origin
 * (`NEXT_PUBLIC_SITE_URL`). Normalizes to exactly one slash between origin
 * and path, and strips a trailing slash (except for the root).
 */
export function absoluteUrl(path: string = "/"): string {
  const origin = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath =
    withLeadingSlash.length > 1
      ? withLeadingSlash.replace(/\/+$/, "")
      : withLeadingSlash;
  return `${origin}${normalizedPath}`;
}

/** True only on the production deployment tier — see NEXT_PUBLIC_APP_ENV in src/lib/env.ts. */
export function isProduction(): boolean {
  return publicEnv.NEXT_PUBLIC_APP_ENV === "production";
}

/**
 * Canonical URL for `path`, or `undefined` outside production.
 *
 * Preview/staging/development deploys don't have a "real" public origin —
 * `NEXT_PUBLIC_SITE_URL` there points at the staging/preview host itself —
 * so emitting a canonical tag on those tiers would tell search engines the
 * canonical version of a page lives on a non-production domain. Returning
 * `undefined` lets callers (see src/lib/seo/metadata.ts) omit the
 * `<link rel="canonical">` tag entirely rather than point it somewhere it
 * shouldn't go.
 */
export function canonicalUrl(path: string = "/"): string | undefined {
  return isProduction() ? absoluteUrl(path) : undefined;
}
