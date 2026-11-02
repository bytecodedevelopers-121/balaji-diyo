/**
 * Floating WhatsApp button — design-references/"Booking Terms and
 * Conditions.png" shows a green circular icon near the top of the
 * content area; the conventional (and near-universal) behavior for that
 * pattern is a viewport-fixed button that stays reachable while
 * scrolling a long page, which is what this implements. No scroll
 * behavior is visible in a static screenshot, so this is an inference,
 * not a literal transcription.
 *
 * The number is real, not a placeholder: the page's own CMS content
 * (cancellation section) says "you can directly contact us on WhatsApp
 * as well: +977 9845000000" — the same number as the footer's Nepal
 * head office contact (`src/config/navigation.ts`'s `footerOffices`),
 * just not yet given a `wa.me` link there.
 *
 * Moved here from BookingTermsSection (2026-08-20) and now also used by
 * WhyBoundlessSection (which had its own independent, near-identical
 * copy — same href/position/styling, a different WhatsApp glyph — until
 * this consolidation) and BlogDetailSection's post hero, which
 * design-references/"Travel Blogs - Individual.png" shows the same icon
 * on.
 */
export const WHATSAPP_HREF = "https://wa.me/9779845000000";

/**
 * The bare glyph, split out so callers that need the icon in a
 * differently-sized/positioned button (e.g. the package detail page's
 * mobile sticky booking bar, which sits inline rather than
 * viewport-corner-fixed) don't have to fork the SVG path.
 */
export function WhatsAppGlyph({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.25-1.28A9.95 9.95 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm5.83 14.24c-.25.7-1.24 1.28-2.02 1.44-.55.11-1.26.2-3.66-.78-2.94-1.22-4.84-4.16-4.99-4.35-.14-.19-1.2-1.6-1.2-3.05s.75-2.17 1.02-2.47c.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.25.58.83 2 .9 2.15.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.38-.41.51-.14.14-.28.3-.12.58.16.28.71 1.18 1.53 1.91 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.53.33.07.12.07.68-.18 1.38z" />
    </svg>
  );
}

export function WhatsAppButton() {
  return (
    <a
      // Targeted by `globals.css` to hide this site-wide singleton on
      // mobile specifically on pages that render their own fixed
      // bottom CTA bar with an inline WhatsApp button already (e.g.
      // the package detail page's `MobileBookingBar`) — see that
      // rule's own comment for why.
      id="global-whatsapp-button"
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-6 bottom-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-brand-neutral-000 shadow-card-strong transition-opacity hover:opacity-90"
    >
      <WhatsAppGlyph className="size-7" />
    </a>
  );
}
