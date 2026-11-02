// Small shared helpers for fields backed by RichTextEditor (TipTap). The editor
// always emits an HTML string — even "empty" content comes back as "<p></p>" —
// so plain `.min(n)`/`!!value` checks on the raw string are unreliable for both
// required-field validation and for deciding whether an optional field was
// actually left blank.

/** Strips HTML tags and returns the trimmed visible text, for length checks. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** True if a RichTextEditor value has no visible content (e.g. "", "<p></p>"). */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  return !html || stripHtml(html).length === 0;
}
