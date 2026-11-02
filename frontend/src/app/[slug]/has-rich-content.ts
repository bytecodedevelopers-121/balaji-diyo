/** A quick "is there actually anything here" check for a TipTap-authored
 *  field — its empty state is `"<p></p>"` (or similarly tag-only), which
 *  a bare truthy/length check on the raw HTML string wouldn't catch.
 *  Kept out of the `"use client"` components so Server Components can
 *  call it too. */
export function hasRichContent(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}
