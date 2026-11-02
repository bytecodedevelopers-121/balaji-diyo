import type { MetadataRoute } from "next";
import { absoluteUrl, isProduction } from "@/lib/seo/canonical";

/**
 * Production: allow everything, point crawlers at the sitemap.
 * Everything else (development/preview/staging): disallow everything, so
 * a non-production deploy can never get indexed even if it's briefly
 * reachable.
 */
export default function robots(): MetadataRoute.Robots {
  const rules: MetadataRoute.Robots["rules"] = isProduction()
    ? { userAgent: "*", allow: "/" }
    : { userAgent: "*", disallow: "/" };

  return {
    rules,
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
