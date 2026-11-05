import { decodeHtmlEntities } from "@/lib/html";

export interface TocEntry {
  id: string;
  text: string;
  children: { id: string; text: string }[];
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Adds an `id` to every `<h2>`/`<h3>` of a CMS blog body and returns the
 * outline for a table of contents: each `<h2>` is an entry and the `<h3>`s
 * that follow it are its children. Headings that already have an `id` keep it.
 */
export function buildToc(html: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const used = new Set<string>();

  const withIds = html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag: string, attrs: string, inner: string) => {
    const text = decodeHtmlEntities(inner.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (!text) return match;

    const existing = /\sid=["']([^"']+)["']/i.exec(attrs)?.[1];
    let id = existing ?? (slugifyHeading(text) || "section");
    if (!existing) {
      let candidate = id;
      for (let n = 2; used.has(candidate); n += 1) candidate = `${id}-${n}`;
      id = candidate;
    }
    used.add(id);

    if (tag.toLowerCase() === "h2") toc.push({ id, text, children: [] });
    else if (toc.length > 0) toc[toc.length - 1]!.children.push({ id, text });
    else toc.push({ id, text, children: [] });

    return existing ? match : `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });

  return { html: withIds, toc };
}
