import "server-only";
import { getServerEnv } from "@/lib/env";

/**
 * Rewrites legacy absolute asset URLs inside CMS-authored HTML to this
 * deploy's own file host.
 *
 * The migrated `Page.content` bodies still carry the old production
 * site's absolute image URLs, e.g.
 *   https://fis-api.boundlessadventure.com/media/attachments/media-x.jpg
 * The same files are already on disk locally under
 * `backend/uploads/public/attachments/...` (carried over by the legacy
 * import) and served at `/files/public/...` — but only after dropping
 * the stray leading `media/` segment, which never existed on disk. That
 * exact quirk is documented for the DB's own path columns in
 * `backend/scripts/legacy-import/media-path.ts`; it applies to inline
 * HTML `src`s too, which that ETL didn't touch.
 *
 * Without this, every inline image in a migrated page 404s (or silently
 * hotlinks the old production host, which is worse — it would keep
 * "working" locally while depending on a server we're replacing).
 *
 * Deliberately a narrow string rewrite, not an HTML parse: the only
 * transformation needed is host+prefix on asset URLs, and pulling in a
 * DOM parser to do it server-side would be a dependency for no gain.
 *
 * **Dead-link bug fixed 2026-09-22**: `boundlessadventure.com` is both
 * the legacy image host *and* the legacy site's own page-permalink host
 * — the old site put every content type directly under the root (same
 * flat shape this app's own `/[slug]` route now mirrors, see its doc
 * comment). A blog body linking to another old page, e.g.
 * `https://boundlessadventure.com/everest-base-camp-trek-with-helicopter-return`,
 * used to get rewritten by the same blanket host swap as a real image
 * URL, landing on `<base>/files/public/everest-base-camp-trek-with-...`
 * — a raw backend file-server URL with nothing behind it, since it was
 * never an uploaded file. Only paths that look like an actual asset
 * (a recognized file extension) are rewritten to `/files/public/...`
 * now; anything else just has the legacy host stripped down to a
 * root-relative path instead, so it resolves against this app's own
 * `/[slug]` route rather than either 404ing on `/files/public/` or
 * leaking the visitor out to the old production host.
 */

/** Legacy asset hosts whose URLs should be re-pointed at the current file host. */
const LEGACY_ASSET_HOSTS = [
  "https://fis-api.boundlessadventure.com",
  "http://fis-api.boundlessadventure.com",
  "https://boundlessadventure.com",
  "http://boundlessadventure.com",
];

/** File extensions the legacy site actually served as uploaded assets — anything else after a legacy host is a normal page link, not a file on disk. */
const ASSET_EXTENSION = /\.(?:jpe?g|png|gif|webp|svg|avif|pdf|docx?|xlsx?|pptx?|mp4|mov|zip)(?:\?\S*)?$/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `http://host:5000/api` → `http://host:5000` — files are served off the origin, not under the API prefix. */
function fileBaseUrl(): string {
  return getServerEnv().API_URL.replace(/\/api\/?$/, "");
}

export function normalizeCmsHtml(html: string): string {
  const base = fileBaseUrl();

  return LEGACY_ASSET_HOSTS.reduce((acc, host) => {
    // "<host>/media/foo.jpg" and "<host>/foo.jpg" both land on
    // "<base>/files/public/foo.jpg" — the `media/` segment is the stray
    // prefix described above, so it's dropped when present — but only
    // for paths that actually look like an asset; anything else (a page
    // permalink) just loses the host, becoming a root-relative link.
    const pattern = new RegExp(`${escapeRegExp(host)}/(?:media/)?([^"'\\s)]+)`, "g");
    return acc.replace(pattern, (match, path: string) => {
      return ASSET_EXTENSION.test(path) ? `${base}/files/public/${path}` : `/${path}`;
    });
  }, html);
}
