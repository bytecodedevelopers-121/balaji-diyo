import { Header } from "@/components/layout/Header";
import { NotFoundContent } from "@/components/sections/NotFoundContent";
import { getHeaderNavData } from "@/features/navigation/lib/build-navigation";
import { getSiteSettings } from "@/features/site-settings/api/get-site-settings";
import { toTelHref } from "@/features/site-settings/lib/to-tel-href";

// TODO(legacy-migration): once live, log 404s here (path, referrer, query)
// to whatever analytics/error-tracking sink the project adopts, so real
// incoming legacy traffic drives what gets added to
// src/config/legacy-routes.ts — see that file's "Monitoring unresolved
// legacy URLs" note. Not added yet since no sink has been chosen.

/**
 * This file lives outside every route group ((home)/(pages)/[slug]), so
 * for a genuinely unmatched URL (nothing in the tree matched at all) it
 * renders directly under the root layout, which no longer supplies its
 * own Header (see root `layout.tsx`'s doc comment — Header is
 * variant-scoped per group, not global anymore), so it renders one here.
 *
 * BUT: per Next's own not-found.js docs, a `notFound()` call *inside* a
 * matched route segment (e.g. `(pages)/blog/[slug]/page.tsx`) still
 * bubbles up to this same file when that segment has no local
 * `not-found.tsx` — and it renders *inside* that segment's layout, not
 * instead of it. Since (pages)/layout.tsx and [slug]/layout.tsx each
 * already render their own Header, that used to stack this file's Header
 * on top of theirs (two navbars on e.g. a 404'd /blog/[slug]). Fixed by
 * giving `(pages)/` and `[slug]/` their own `not-found.tsx` (just the
 * shared `NotFoundContent`, no Header — their layout already has one) so
 * this root file is only ever reached for a route that matched nothing,
 * where it's the sole thing rendering and does need its own Header.
 */
export default async function NotFound() {
  const nav = await getHeaderNavData();
  const settings = await getSiteSettings();

  return (
    <>
      <Header
        variant="light"
        siteName={settings.companyName}
        phone={settings.mobile}
        phoneHref={toTelHref(settings.mobile)}
        {...nav}
      />
      <NotFoundContent />
    </>
  );
}
