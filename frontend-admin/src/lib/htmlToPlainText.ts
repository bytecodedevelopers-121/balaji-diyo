// Converts RichTextEditor HTML output into plain text for contexts that
// can't render markup (e.g. the CV PDF templates) — preserves paragraph
// breaks and turns list items into "• " prefixed lines.
export function htmlToPlainText(html: string | null | undefined): string | null {
  if (!html) return null;
  const doc = new DOMParser().parseFromString(html, "text/html");

  function render(node: ChildNode): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(render).join("");
    switch (el.tagName.toLowerCase()) {
      case "li":
        return `• ${inner.trim()}\n`;
      case "p":
        return `${inner.trim()}\n`;
      case "br":
        return "\n";
      default:
        return inner;
    }
  }

  const text = Array.from(doc.body.childNodes).map(render).join("");
  return text.replace(/\n{3,}/g, "\n\n").trim() || null;
}
