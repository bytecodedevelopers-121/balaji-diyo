import { sitemapGroupResponse } from "@/lib/seo/sitemap-groups";

export const revalidate = 3600;

export function GET() {
  return sitemapGroupResponse("map");
}
