import env from '../config/env';

/**
 * Notifies the Next.js frontend's cache that the given tags (and,
 * optionally, real page paths) are stale, so an on-demand
 * `revalidateTag()`/`revalidatePath()` runs instead of waiting for the
 * next time-based revalidation window. POSTs to `app/api/revalidate`
 * there.
 *
 * `paths` exists because `tags` alone turned out not to be enough: a
 * deleted blog post kept rendering (a stale 200, not a 404) on its own
 * `/blog/<slug>` page indefinitely — confirmed live — because that page
 * is prerendered via `generateStaticParams` and has its own path-keyed
 * HTML cache entry, separate from the tagged `fetch` data cache that
 * `revalidateTag` alone busts. See the frontend route handler's own doc
 * comment (`app/api/revalidate/route.ts`) for the full story and the
 * Next docs citation. Every caller of this function reaches a page
 * shaped like that one, so every caller has the same gap — this param
 * is opt-in (defaults to none) rather than forced on all 14 existing
 * call sites in one pass; `BlogService` is the first to pass it for real
 * (this was reported against blog specifically), the rest still need
 * the same treatment.
 *
 * Fire-and-forget by design: a failed/unconfigured revalidation must
 * never fail the mutation that triggered it, so this only logs on
 * failure. No-ops (with a log line) when REVALIDATION_SECRET isn't set —
 * same "optional integration" shape as GA4/PACO in config/env.ts.
 */
export async function revalidateFrontendTags(tags: string[], paths: string[] = []): Promise<void> {
  if (!env.REVALIDATION_SECRET) {
    console.error('revalidateFrontendTags: REVALIDATION_SECRET not set, skipping', { tags, paths });
    return;
  }

  try {
    const response = await fetch(`${env.PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': env.REVALIDATION_SECRET,
      },
      body: JSON.stringify({ tags, paths }),
    });

    if (!response.ok) {
      console.error(`revalidateFrontendTags: frontend responded ${response.status}`, { tags, paths });
    }
  } catch (err) {
    console.error('revalidateFrontendTags: request failed', { tags, paths, err });
  }
}
