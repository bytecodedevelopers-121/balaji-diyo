import { footerOffices } from "@/config/navigation";
import { CONTACT_DEFAULTS, type ContactContent } from "@/features/page-content/contact-defaults";

/**
 * Map strip between ContactSection and CtaSection (design-references/
 * contact.png, y≈1303–1869 at 1440px) — a full-bleed Google Maps view of
 * the Nepal office with an "Open in Maps ↗" chip pinned top-left.
 *
 * The design reference is a static screenshot of an interactive Google
 * Maps pane (pan/zoom controls, live "Google" wordmark all baked into
 * the pixels). Implemented here as a real, live Google Maps embed of
 * `footerOffices[0]`'s actual address rather than shipping that
 * screenshot as an `<img>` — a live map is strictly more useful at the
 * same visual spot, and needs no API key (the classic `output=embed`
 * query form, not the newer keyed Maps Embed API).
 */
export function ContactMapSection({ content = CONTACT_DEFAULTS.map }: { content?: ContactContent["map"] } = {}) {
  const nepalOffice = footerOffices[0]!;
  const query = encodeURIComponent(content.searchText || `Joyful Trekking Pvt. Ltd., ${nepalOffice.address ?? ""}`);
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <section className="relative w-full">
      <a
        href={mapsSearchUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-brand-neutral-000 px-3 py-2 font-poppins text-[14px] leading-[22.4px] font-medium text-primary-500 shadow-card-soft transition-opacity hover:opacity-90"
      >
        {content.buttonLabel}
        <ExternalLinkIcon className="size-3.5" />
      </a>
      <iframe
        title={`Map to ${nepalOffice.address ?? "our office"}`}
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        className="h-[420px] w-full border-0 sm:h-[500px] lg:h-[566px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}
