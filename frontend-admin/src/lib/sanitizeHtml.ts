import DOMPurify from "dompurify";

// Matches what RichTextEditor's toolbar can produce — headings, inline
// marks (bold/italic/underline/strike/sub/sup/code + color/font via
// textStyle spans), alignment/indent (style attr), links, images, lists
// (incl. task lists), blockquote, hr, and tables. Nothing else is allowed
// through, whether it came from the editor or was posted directly to the API.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "sub",
  "sup",
  "code",
  "span",
  "mark",
  "a",
  "img",
  "ul",
  "ol",
  "li",
  "label",
  "input",
  "blockquote",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "colgroup",
  "col",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "style",
  "class",
  "colspan",
  "rowspan",
  "width",
  "height",
  "type",
  "checked",
  "disabled",
  "data-type",
  "data-checked",
];

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: true });
}
