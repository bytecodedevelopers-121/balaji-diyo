/**
 * Pulls a real "FAQ" block out of a CMS section's HTML, so it can be
 * rendered as an accordion (`BlogFaqAccordion`) instead of plain prose.
 *
 * There's no structured FAQ field on Blog — this is free-form,
 * migrated CMS body HTML — so detection is deliberately narrow and
 * literal: only a heading whose own text matches "FAQ"/"Frequently
 * Asked Questions" triggers anything. Any other heading — a regular
 * subsection with its own heading-then-paragraph shape, which every
 * other section on the page also has — is left completely alone. This
 * was checked against real migrated posts (`blogs.content` in the dev
 * DB) rather than assumed: the FAQ heading itself is `<h2>` on some
 * posts and `<h3>` on others (whichever level `splitCmsSections`
 * didn't already split the document on), always followed by repeating
 * `<h4>Question</h4><p>Answer</p>` pairs — e.g. "What Do You Mean By
 * Trekking?" uses `<h3 id="fa-qs">FAQ's</h3>` + five `<h4>`/`<p>`
 * pairs, "Where is Mount K2 Peak?" uses `<h2 id="fa-qs">FAQs</h2>`
 * instead. The question level is detected from what's actually there
 * rather than hardcoded to `h4`, in case some other post varies it.
 */

export interface FaqQaPair {
  /** Plain text (HTML stripped) — this becomes the accordion trigger. */
  question: string;
  /** This question's answer, HTML intact (may be more than one paragraph). */
  answerHtml: string;
}

export interface FaqBlock {
  /** Plain text of the "FAQ"/"Frequently Asked Questions" heading itself. */
  heading: string;
  items: FaqQaPair[];
}

export interface SectionWithFaq {
  /** Everything before the FAQ heading (or the whole input, when no FAQ block was found) — render via `CmsProse` unchanged. */
  beforeHtml: string;
  /** `null` when this section has no FAQ heading in it at all. */
  faq: FaqBlock | null;
}

const FAQ_TEXT_PATTERN = /\bfaqs?\b|frequently asked questions/i;
const HEADING_PATTERN = /<h([2-4])[^>]*>([\s\S]*?)<\/h\1>/gi;

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&rsquo;/gi, "’")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractFaqBlock(html: string): SectionWithFaq {
  HEADING_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HEADING_PATTERN.exec(html))) {
    const headingText = stripTags(match[2]);
    if (!FAQ_TEXT_PATTERN.test(headingText)) continue;

    const beforeHtml = html.slice(0, match.index).trim();
    const items = splitQaPairs(html.slice(match.index + match[0].length));
    // A heading that merely mentions "FAQ" in passing (not actually
    // followed by any Q&A pairs) isn't a real FAQ block — leave the
    // whole section as plain prose rather than rendering an empty
    // accordion under a stray heading.
    if (items.length === 0) return { beforeHtml: html, faq: null };

    return { beforeHtml, faq: { heading: headingText, items } };
  }
  return { beforeHtml: html, faq: null };
}

function splitQaPairs(html: string): FaqQaPair[] {
  const level = html.match(/<h([2-6])[^>]*>/i)?.[1];
  if (!level) return [];

  const headingTag = new RegExp(`<h${level}[^>]*>[\\s\\S]*?<\\/h${level}>`, "i");
  const headingText = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, "i");

  return html
    .split(new RegExp(`(?=<h${level}[\\s>])`, "i"))
    .map((part) => part.trim())
    .filter((part) => headingTag.test(part))
    .map((part) => ({
      question: stripTags(part.match(headingText)?.[1] ?? ""),
      answerHtml: part.replace(headingTag, "").trim(),
    }))
    .filter((pair) => pair.question.length > 0);
}
