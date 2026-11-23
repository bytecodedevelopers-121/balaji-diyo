import { decodeHtmlEntities } from "@/lib/html";
import type { BlogPost } from "../types/blog.types";

/** e.g. "Aug 09, 2026". */
export function formatBlogDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
}

/** e.g. "October 21, 2026". */
export function formatBlogDateLong(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function blogAuthorName(post: BlogPost): string {
  return post.authors[0]?.name ?? "Your Company";
}

/** Plain-text excerpt: the abstract, else the content, with tags stripped. */
export function blogExcerpt(post: BlogPost, maxLength = 320): string {
  const raw = post.abstract?.trim() || post.content;
  const text = decodeHtmlEntities(raw.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()} […]` : text;
}
