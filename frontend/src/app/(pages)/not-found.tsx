import { NotFoundContent } from "@/components/sections/NotFoundContent";

/**
 * Covers every `notFound()` call under this route group (blog/[slug],
 * team/[slug], attractions/[slug], map/[slug], the
 * static pages that 404 on missing CMS content, ...). Without this file,
 * those calls fell through to the root `app/not-found.tsx`, which renders
 * its *own* Header —
 * stacked on top of the one `(pages)/layout.tsx` already renders around
 * `{children}`, producing two navbars (e.g. GET /blog/<missing-slug>).
 * `(pages)/layout.tsx` still wraps this file the same way it wraps every
 * page here, so no Header/PageContainer needed in this file itself.
 */
export default function PagesNotFound() {
  return <NotFoundContent />;
}
