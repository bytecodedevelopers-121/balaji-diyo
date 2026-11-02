/**
 * Strips unresolved `[block](,NN)` shortcode placeholders out of a real
 * blog post's `content` HTML before it's rendered.
 *
 * design-references/"Travel Blogs - Individual.png" shows a package
 * summary card embedded mid-article ("Annapurna Base Camp Trek · 12
 * Days · From $1,395"). The real, legacy-migrated content does have a
 * matching embed point — `<div class="package-block" style="...">[block]
 * (,66)</div>` — in 202 of 237 real posts, confirmed directly against
 * the dev DB. But `NN` is a legacy WordPress plugin's own internal post
 * id with no mapping preserved anywhere in the migration (no matching
 * table in boundless.sql, no legacy-id column on Package) — there's no
 * reliable way to resolve it to a real Package to render a real card
 * from, so rendering the raw, broken `[block](,66)` text as-is would be
 * strictly worse than removing it. Not a redesign of that part of the
 * page — a missing-data gap, documented rather than guessed at.
 */
const PACKAGE_BLOCK_PATTERN = /<div class="package-block"[^>]*>\s*\[block\]\([^)]*\)\s*<\/div>/gi;

export function cleanBlogContent(html: string): string {
  return html.replace(PACKAGE_BLOCK_PATTERN, "");
}
