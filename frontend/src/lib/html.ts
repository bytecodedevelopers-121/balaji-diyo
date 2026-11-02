const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  rsquo: "’",
};

/**
 * Decodes the handful of named/numeric HTML entities that show up in
 * migrated CMS copy (smart quotes, dashes, `&amp;`, `&nbsp;`, ...) —
 * originally `BlogDetailSection`'s own `htmlToPlainText` helper, pulled
 * out here once `splitCmsSections` needed the exact same decoding for
 * its plain-text heading labels (see that function's own doc comment):
 * without it, a heading like "China's Side" (authored as
 * `China&rsquo;s Side`) rendered its entity code literally in the ToC
 * sidebar instead of the apostrophe it stands for — React escapes
 * string children, so the raw `&rsquo;` text was never going to
 * resolve to a character on its own.
 *
 * Not a general-purpose entity decoder (no full HTML5 entity table) —
 * covers exactly what real migrated content uses. A left-over unknown
 * entity falls through unchanged rather than dropped.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&([a-z]+);/gi, (entity, name: string) => NAMED_HTML_ENTITIES[name.toLowerCase()] ?? entity)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}
