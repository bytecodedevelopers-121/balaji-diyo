import { sitemapIndexResponse } from "@/lib/seo/sitemap-groups";

export const revalidate = 3600;

/** Sitemap index — one entry per content-type sitemap; see lib/seo/sitemap-groups.ts. */
export function GET() {
  return sitemapIndexResponse();
}
