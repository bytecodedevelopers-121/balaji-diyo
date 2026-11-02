import { decodeHtmlEntities } from "@/lib/html";

/**
 * Splits a CMS page body into top-level sections at its heading
 * boundaries, so a long article can be laid out across a design's
 * alternating blocks (ResponsibleTourismSection) or a table-of-contents
 * sidebar (BookingTermsSection) instead of running as one column.
 *
 * The migrated CMS bodies are flat HTML (a sequence of `<p>`/`<h2>`/
 * `<h3>`/`<ul>`/`<figure>` siblings, not nested wrappers), so a
 * lookahead split is enough and avoids pulling in a DOM parser
 * server-side. Different migrated pages use different heading levels
 * for their main sections (responsible-tourism uses `<h2>`,
 * booking-terms-and-conditions uses `<h3>` with a `<h4>` subsection
 * nested inside one of them) — `detectHeadingLevel` picks whichever of
 * h2/h3 actually appears, so this one utility covers both rather than
 * needing a per-page level passed in.
 *
 * Each section gets a slugified `id` (from its heading text, injected
 * onto the heading tag itself) so callers can render anchor links to it
 * — e.g. a scroll-spy table-of-contents nav.
 *
 * Deliberately tolerant of shape: a body with no h2/h3 at all yields a
 * single intro section and no blocks — nothing is ever silently dropped.
 */
export interface CmsSection {
  /** Slugified, URL-safe anchor id for this section (from its heading text, already injected onto the heading tag in `html`). Unique within one call — a repeated heading gets a `-2`, `-3`, ... suffix. */
  id: string;
  /** Plain-text heading (HTML stripped), for nav labels. */
  heading: string;
  /** This section's full HTML, heading tag included. */
  html: string;
}

export interface CmsSections {
  /** Everything before the first section heading — may be empty string. */
  intro: string;
  /** One entry per section, in document order. */
  sections: CmsSection[];
}

const HEADING_LEVELS = ["h2", "h3"] as const;

function detectHeadingLevel(html: string): (typeof HEADING_LEVELS)[number] | null {
  return HEADING_LEVELS.find((level) => new RegExp(`<${level}[\\s>]`, "i").test(html)) ?? null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitCmsSections(
  html: string,
  preferredLevel?: (typeof HEADING_LEVELS)[number],
): CmsSections {
  const level = preferredLevel && new RegExp(`<${preferredLevel}[\\s>]`, "i").test(html)
    ? preferredLevel
    : detectHeadingLevel(html);
  if (!level) {
    return { intro: html.trim(), sections: [] };
  }

  const parts = html
    .split(new RegExp(`(?=<${level}[\\s>])`, "i"))
    .map((part) => part.trim())
    .filter(Boolean);

  const startsWithHeading = new RegExp(`^<${level}[\\s>]`, "i").test(parts[0] ?? "");
  const intro = startsWithHeading ? "" : (parts[0] ?? "");
  const rawSections = startsWithHeading ? parts : parts.slice(1);

  const seenIds = new Map<string, number>();
  const headingOpenTag = new RegExp(`(<${level})([\\s>])`, "i");
  const headingTextPattern = new RegExp(`<${level}[^>]*>(.*?)</${level}>`, "is");

  const sections: CmsSection[] = rawSections.map((raw) => {
    const heading = decodeHtmlEntities((raw.match(headingTextPattern)?.[1] ?? "").replace(/<[^>]+>/g, "")).trim();
    const baseId = slugify(heading) || "section";
    const seenCount = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, seenCount + 1);
    const id = seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`;

    return {
      id,
      heading,
      html: raw.replace(headingOpenTag, `$1 id="${id}"$2`),
    };
  });

  return { intro, sections };
}
