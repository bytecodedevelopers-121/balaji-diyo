import { absoluteUrl } from "./canonical";

export type SitemapChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapEntry {
  /** Site-relative path, e.g. "/blog/some-post" — made absolute here. */
  path: string;
  priority?: number;
  changeFrequency?: SitemapChangeFrequency;
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** `<urlset>` document for one group's entries. */
export function buildUrlSet(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const parts = [`<loc>${escapeXml(absoluteUrl(entry.path))}</loc>`];
    if (entry.changeFrequency) parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
    if (entry.priority !== undefined) parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
    return `<url>${parts.join("")}</url>`;
  });
  return `${XML_HEADER}\n<urlset xmlns="${SITEMAP_NS}">\n${urls.join("\n")}\n</urlset>\n`;
}

/** `<sitemapindex>` document pointing at each group's own sitemap file. */
export function buildSitemapIndex(paths: string[]): string {
  const sitemaps = paths.map((path) => `<sitemap><loc>${escapeXml(absoluteUrl(path))}</loc></sitemap>`);
  return `${XML_HEADER}\n<sitemapindex xmlns="${SITEMAP_NS}">\n${sitemaps.join("\n")}\n</sitemapindex>\n`;
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
