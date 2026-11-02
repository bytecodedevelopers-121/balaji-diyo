/**
 * Estimated reading time for a blog post — design-references/
 * "Travel Blogs - Individual.png" shows "Read time: 10 mins" in the
 * post meta row. No `readTime` field exists on the Blog model, so this
 * computes a real estimate from the post's own `content` (strip HTML,
 * count words, 200 words/minute — the commonly-cited average adult
 * silent-reading speed) rather than a hardcoded/placeholder number.
 */
const WORDS_PER_MINUTE = 200;

export function estimateReadTimeMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
