/**
 * Shared blog-date formatter — was independently duplicated in
 * BlogDetailSection/FeaturedBlogCard/BlogCard; extracted once a 4th
 * consumer (the homepage's BlogSection) needed the exact same format.
 */
export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
