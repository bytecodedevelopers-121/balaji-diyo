import { cn } from "@/lib/utils";

interface CmsProseProps {
  html: string;
  className?: string;
  /**
   * Opt-in styling for booking-terms-and-conditions' bold, primary-500
   * "01. Down Payment"-style numbered section headings (see the `h3`
   * comment below) — every other caller gets the default `h3`, which
   * matches the rest of the heading hierarchy (Playfair, neutral-1000,
   * sized between `h2` and `h4`) instead. Off by default: this was
   * previously unconditional on every `h3` sitewide, which was fine
   * only as long as booking-terms-and-conditions was the sole real
   * migrated page using `h3` at all — it no longer is (client-flagged
   * 2026-09-03: a package's Overview-tab CMS copy uses plain `h3`
   * subsection headings — "Spring", "Summer", ... — that inherited
   * this numbered-heading look with no relation to it).
   */
  numberedHeadings?: boolean;
}

/**
 * Renders trusted, admin-authored CMS HTML with this site's typography.
 *
 * Styling is done with Tailwind arbitrary child selectors rather than
 * `@tailwindcss/typography` — that plugin isn't installed here, and
 * pulling it in would restyle by its own scale rather than this
 * project's sampled Figma tokens (font-playfair-display headings,
 * text-body-l body, brand-neutral-* palette).
 *
 * `dangerouslySetInnerHTML` is correct here, not a shortcut: this
 * content comes from the authenticated admin CMS (backend's Page
 * module), the same trust level as the rest of the site's copy — it is
 * not user-submitted input. Same call already made for team member bios
 * (`/team/[slug]`). If a page body ever becomes reader-submitted, this
 * needs a sanitizer first.
 */
export function CmsProse({ html, className, numberedHeadings = false }: CmsProseProps) {
  return (
    <div
      className={cn(
        // Was `text-brand-neutral-700` — too far below `<strong>`'s
        // `text-brand-neutral-1000` (see "Emphasis" below), so bold words
        // in any CMS-authored copy read as a jarring near-black jump out
        // of a much lighter-gray paragraph (client-flagged on the trip
        // Overview tab, 2026-09-02, but this is the shared CMS-HTML
        // renderer — same contrast gap on every page it's used for:
        // legal pages, team bios, ...). Matches this page's own
        // `text-brand-neutral-900` body-copy convention (HighlightsAndOverview's
        // quick facts/highlights list, ItinerarySection, ...) — closer to
        // `<strong>`'s color, so bold text still stands out without
        // looking like a different color palette entirely.
        "font-poppins text-body-l text-brand-neutral-900",
        // Block rhythm
        "[&>*+*]:mt-5",
        // CMS bodies can contain long unbroken tokens (raw URLs, bank
        // account/SWIFT codes) with no natural break point — without
        // this, one long link overflows its column and the whole page
        // horizontally on mobile (hit on booking-terms-and-conditions's
        // bank-detail links; verified via a real narrow-viewport
        // scrollWidth check, not just eyeballed).
        "break-words",
        // Headings — Playfair to match section headings elsewhere.
        // `h1` shows up mid-body in at least one migrated page
        // (last-minute-trip-deals' "Upcoming Last Minute Departures" —
        // a WordPress authoring quirk, not a real page-title h1), styled
        // the same as h2 rather than larger, since here it's acting as
        // just another section heading, not the page title (PageHero's
        // own h1 already owns that). `h3` defaults to the same
        // Playfair/neutral-1000 family as h1/h2, just sized down toward
        // h4 — a normal subsection heading, for any CMS body that uses
        // h3 as such (a package's Overview-tab copy does: "Spring",
        // "Summer", ...). `numberedHeadings` swaps in the bold
        // sans-serif primary-500 treatment instead (blue "01. Down
        // Payment"-style numbered section headings, per design-
        // references/"Booking Terms and Conditions.png") — that page's
        // own h3 usage, not a general h3 style.
        // Client-requested (2026-09-03): h2 was 32px, matching h1 — too
        // close to this page's own actual section headings (e.g.
        // HighlightsAndOverview's "Trip Highlights") for something
        // that's really just CMS body copy. Dropped to 26px, and h3
        // stepped down to 22px along with it so the two stay visually
        // distinct instead of landing on the same size.
        "[&_h1]:font-playfair-display [&_h1]:text-[26px] [&_h1]:leading-[1.3] [&_h1]:font-medium [&_h1]:text-brand-neutral-1000 [&_h1]:mt-10",
        "[&_h2]:font-playfair-display [&_h2]:text-[26px] [&_h2]:leading-[1.3] [&_h2]:font-medium [&_h2]:text-brand-neutral-1000 [&_h2]:mt-10",
        numberedHeadings
          ? "[&_h3]:font-poppins [&_h3]:text-[26px] [&_h3]:leading-[1.3] [&_h3]:font-bold [&_h3]:text-primary-500 [&_h3]:mt-10"
          : "[&_h3]:font-playfair-display [&_h3]:text-[22px] [&_h3]:leading-[1.35] [&_h3]:font-medium [&_h3]:text-brand-neutral-1000 [&_h3]:mt-8",
        "[&_h4]:font-poppins [&_h4]:text-[18px] [&_h4]:leading-[1.4] [&_h4]:font-bold [&_h4]:text-brand-neutral-1000 [&_h4]:mt-6",
        // Anchor-jump comfort — a heading a table-of-contents link scrolls to shouldn't land flush against the viewport edge.
        "[&_h1]:scroll-mt-8 [&_h2]:scroll-mt-8 [&_h3]:scroll-mt-8 [&_h4]:scroll-mt-8",
        // Lists
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2",
        // Links
        "[&_a]:text-primary-500 [&_a]:underline hover:[&_a]:opacity-80",
        // Media — CMS images arrive at arbitrary sizes; cap and round them
        "[&_img]:h-auto [&_img]:w-full [&_img]:rounded-card",
        "[&_figure]:my-8",
        "[&_figcaption]:mt-3 [&_figcaption]:text-body-m [&_figcaption]:text-brand-neutral-600 [&_figcaption]:italic",
        // Blockquote — a centered pull-quote treatment (seen in
        // last-minute-trip-deals' "Book today and be on the trail in
        // just a few days.")
        "[&_blockquote]:border-l-4 [&_blockquote]:border-secondary-500 [&_blockquote]:pl-6 [&_blockquote]:text-heading-xl [&_blockquote]:text-brand-neutral-1000 [&_blockquote_p]:mt-0",
        // Tables — real CMS-authored tables (as opposed to the one
        // LastMinuteTripsSection strips out and replaces with a live
        // component); kept simple since no migrated content needs
        // anything richer yet. `dangerouslySetInnerHTML` means there's
        // no JSX wrapper to hang `overflow-x-auto` on around each
        // `<table>` — a wide/many-column table (natural for markdown
        // content converted to HTML) would otherwise force the whole
        // page wider than the viewport on mobile. `display: block` on
        // the table element itself turns *it* into the scroll
        // container while its rows/cells keep their table layout (rows
        // and cells default to `table-row`/`table-cell` regardless of
        // their ancestor's own `display`, so the grid still renders
        // correctly) — the same technique typography plugins use for
        // this exact problem.
        "[&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-brand-neutral-300 [&_th]:bg-brand-neutral-100 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold",
        "[&_td]:border [&_td]:border-brand-neutral-300 [&_td]:p-3",
        // Emphasis
        "[&_strong]:font-bold [&_strong]:text-brand-neutral-1000",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
