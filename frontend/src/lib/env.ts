/**
 * Environment variable validation.
 *
 * Hand-rolled on purpose: with four public vars and two server vars, a
 * schema library (e.g. zod) would add a dependency without adding real
 * safety over a few `if` checks. Revisit this if the surface grows a lot.
 *
 * - `publicEnv` reads `NEXT_PUBLIC_*` vars, which Next.js inlines into the
 *   client bundle at build time regardless of where they're read from.
 * - `getServerEnv()` reads server-only vars (API_URL, secrets).
 *
 * The whole module is still gated with `server-only`: today nothing needs
 * `publicEnv` from a Client Component (site config is only consumed by
 * Server Components and metadata generation), and gating the file keeps a
 * server secret from ever being one accidental `import` away from a
 * Client Component. If a Client Component later needs a public value,
 * read `process.env.NEXT_PUBLIC_*` directly there instead of importing
 * this module, or pass the value down as a prop from a Server Component.
 */
import "server-only";

export type AppEnv = "development" | "preview" | "staging" | "production";

const APP_ENVS: readonly AppEnv[] = [
  "development",
  "preview",
  "staging",
  "production",
];

function isAppEnv(value: string | undefined): value is AppEnv {
  return !!value && (APP_ENVS as readonly string[]).includes(value);
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and set it.`,
    );
  }
  return value;
}

interface PublicEnv {
  /** This deploy's own public origin, e.g. https://www.example.com. Used to build canonical/absolute URLs. */
  NEXT_PUBLIC_SITE_URL: string;
  /** Public API base URL. Only for the rare case a Client Component must call the API directly. */
  NEXT_PUBLIC_API_URL: string;
  /** Deployment tier. Drives noindex/robots behavior — see src/lib/seo/canonical.ts. */
  NEXT_PUBLIC_APP_ENV: AppEnv;
}

function readPublicEnv(): PublicEnv {
  return {
    NEXT_PUBLIC_SITE_URL: requireEnv(
      "NEXT_PUBLIC_SITE_URL",
      process.env.NEXT_PUBLIC_SITE_URL,
    ),
    NEXT_PUBLIC_API_URL: requireEnv(
      "NEXT_PUBLIC_API_URL",
      process.env.NEXT_PUBLIC_API_URL,
    ),
    NEXT_PUBLIC_APP_ENV: isAppEnv(process.env.NEXT_PUBLIC_APP_ENV)
      ? process.env.NEXT_PUBLIC_APP_ENV
      : "development",
  };
}

/**
 * Public env vars, validated once at import time. This module is
 * server-only (see above), but the *values* on this export are safe to
 * pass down into Client Components as props — just don't import this
 * module itself from client code.
 */
export const publicEnv: PublicEnv = readPublicEnv();

interface ServerEnv {
  /** Private API base URL for Server Component / Route Handler fetches. Prefer this over NEXT_PUBLIC_API_URL server-side. */
  API_URL: string;
  /** Shared secret for the future cache-revalidation webhook (app/api/revalidate). */
  REVALIDATION_SECRET: string;
}

let serverEnv: ServerEnv | undefined;

/**
 * Lazily validated server-only env vars. Calling this from a Client
 * Component is already prevented at import time by `server-only`; the
 * lazy validation additionally keeps `next build` from failing on env
 * vars that are only needed by routes that aren't exercised yet.
 */
export function getServerEnv(): ServerEnv {
  if (!serverEnv) {
    serverEnv = {
      API_URL: requireEnv("API_URL", process.env.API_URL),
      REVALIDATION_SECRET: requireEnv(
        "REVALIDATION_SECRET",
        process.env.REVALIDATION_SECRET,
      ),
    };
  }
  return serverEnv;
}
