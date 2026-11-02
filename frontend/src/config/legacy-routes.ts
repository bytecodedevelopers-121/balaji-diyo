/**
 * Legacy URL migration model.
 *
 * STATUS: PENDING AUDIT, aside from the one entry below (a direct rename
 * of a route this app itself owns, not something reverse-engineered from
 * the old site — see its own comment). The old Boundless Adventure public
 * site's route source was not available in this repository at the time
 * this foundation was built — `flamingo-base/routes/web.php` only defines
 * the admin/API surface, and no legacy sitemap.xml, Search Console
 * export, or public-site router config was present to audit. Do not add
 * further redirects here by guessing.
 *
 * Before adding entries, audit (in order of reliability):
 *   1. The current live site's XML sitemap.
 *   2. Google Search Console → "Pages" / "Links" exports for indexed URLs.
 *   3. Server access logs for real crawled/visited paths.
 *   4. The legacy database's slug-bearing columns (packages, blog posts,
 *      destinations, etc.) once the DB dump referenced in project memory
 *      is available.
 *   5. Any legacy router config or sitemap generator in the old codebase,
 *      if one turns up outside this repo.
 *
 * Rules for entries once the audit exists:
 *   - Preserve the existing URL whenever practical — a redirect is a
 *     fallback for URLs that truly cannot be kept, not a default.
 *   - `destination` must be the final URL. Never chain redirects (A → B
 *     → C); resolve the chain and redirect A and B both straight to C.
 *   - Do not blanket-redirect removed pages to `/`. A 410 Gone or a
 *     specific replacement page is almost always more correct than a
 *     silent homepage redirect, which erodes both SEO signal and user
 *     trust ("I searched for X and landed on the homepage").
 *   - `permanent: true` (HTTP 308) for confirmed, final URL changes.
 *     `permanent: false` (HTTP 307) only while a mapping is still being
 *     validated — flip it once confirmed, don't leave 307s in production
 *     long-term.
 *
 * Scaling: this array is fine for a short, build-time-known list. The
 * Express API already has a database-backed mechanism for a large
 * mapping — `backend/src/modules/redirect-manager` — with a public
 * `GET /redirects/resolve?path=<source>` endpoint whose own code comment
 * is called by `src/proxy.ts` before page rendering. Prefer bulk-loading
 * audited mappings into that table (`POST /redirects/bulk`) over growing
 * this file — this array is best kept for a handful of redirects that are
 * cheap to review in a PR.
 *
 * Wiring: for the small-array path, map this into Next.js's `redirects()`
 * in next.config.ts (`source`/`destination`/`permanent` already match
 * that API's shape) via src/lib/seo/redirects.ts#toNextRedirects — already
 * wired, currently a no-op since the array below is empty. The database-
 * backed path is implemented in `src/proxy.ts`; it calls
 * `GET /redirects/resolve` with a short timeout and fails open to normal
 * Next.js routing on misses or backend errors.
 *
 * Monitoring unresolved legacy URLs: once the site is live, 404s that
 * carry telltale legacy patterns (old query params, old file extensions,
 * etc.) should be logged from `src/app/not-found.tsx` to whatever
 * analytics/error-tracking sink the project adopts, so real incoming
 * legacy traffic — not just guesses — drives what gets added here.
 */
export interface LegacyRedirect {
  /** Path on the old site, e.g. "/package/everest-base-camp-trek". */
  source: string;
  /** Final destination path on the new site. Must not itself redirect. */
  destination: string;
  /** true = 308 permanent, false = 307 temporary (see rules above). */
  permanent: boolean;
}

/**
 * "/trekking-routes-map-of-nepal" → "/map" (2026-09-03, explicit user
 * direction — the URL itself, not the page content, was the ask: "the
 * url should be /map"). Not from the audit process above — this one's a
 * direct rename of a route this app itself owns, not a legacy-site URL
 * being reverse-engineered — but still redirected rather than dropped,
 * since "/trekking-routes-map-of-nepal" was itself a confirmed-real
 * legacy URL (found verbatim in boundless.sql) that external links/
 * search-engine indexing may already point at. Covers the listing page
 * and every one of its own "/[slug]" detail pages via `:slug*` (zero or
 * one segment — Next's `redirects()` needs the param named to use it in
 * `destination`, and `*` rather than a bare param keeps a trailing slash
 * on the base path itself from erroring on a missing capture).
 */
export const legacyRedirects: LegacyRedirect[] = [
  { source: "/trekking-routes-map-of-nepal", destination: "/map", permanent: true },
  {
    source: "/trekking-routes-map-of-nepal/:slug*",
    destination: "/map/:slug*",
    permanent: true,
  },
];
