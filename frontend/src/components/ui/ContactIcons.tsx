import { useId } from "react";

/**
 * Phone/mail/pin line icons + the 7-platform social glyph switch.
 *
 * Extracted verbatim from Footer.tsx (no path changes) when ContactSection
 * needed the exact same icon set for the /contact page's contact-info
 * column (design-references/contact.png, y≈699–1258 at 1440px — phone,
 * phone, mail, pin rows + the same 7 social icons in the same order as
 * the footer). Kept as one shared module rather than duplicated a second
 * time, since both call sites render identical marks; each accepts a
 * `className` so callers can size the icon per their own layout (Footer
 * uses 16px icons, ContactSection's spec calls for 18px/24px).
 */
export function PhoneIcon({ className = "size-4 shrink-0" }: { className?: string }) {
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
      <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.5 1 1 0 0 1-.25 1z" />
    </svg>
  );
}

export function MailIcon({ className = "size-4 shrink-0" }: { className?: string }) {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function PinIcon({ className = "mt-0.5 size-4 shrink-0" }: { className?: string }) {
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
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/**
 * Brand-colored badges (2026-09-03): each platform now renders as a
 * self-contained rounded-square icon — its own brand-color background
 * plus a white glyph — rather than a bare currentColor glyph left to
 * pick up whatever text color its wrapper happened to set. Matches the
 * client-supplied reference screenshot of colored circular/square social
 * badges (blue Facebook "f", black X, Instagram gradient camera, blue
 * LinkedIn "in", red YouTube play, red Pinterest "P"). Callers no longer
 * need to set a text color on the wrapping `<a>` for these to show
 * correctly — `className` still controls size (and, via Tailwind's
 * `rounded-*`, how square/round the corners read).
 */
export function SocialIcon({
  platform,
  className = "size-8",
}: {
  platform: string;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true as const,
  };
  const gradientId = useId();

  switch (platform) {
    case "Facebook":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path
            d="M14 9h3V6h-3c-1.66 0-3 1.34-3 3v2H9v3h2v6h3v-6h3l1-3h-4v-2c0-.55.45-1 1-1z"
            fill="#fff"
          />
        </svg>
      );
    case "X":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#000" />
          <path
            d="M6 6l5.1 6.3L6.2 18h1.9l4.2-4.9L15.9 18H18l-5.4-6.7L17.2 6h-1.9l-3.9 4.5L8.1 6z"
            fill="#fff"
          />
        </svg>
      );
    case "Instagram":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="24" x2="24" y2="0">
              <stop offset="0%" stopColor="#FFDD55" />
              <stop offset="40%" stopColor="#E1306C" />
              <stop offset="100%" stopColor="#6E42C1" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill={`url(#${gradientId})`} />
          <rect
            x="6"
            y="6"
            width="12"
            height="12"
            rx="3.5"
            fill="none"
            stroke="#fff"
            strokeWidth={1.6}
          />
          <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth={1.6} />
          <circle cx="15.6" cy="8.4" r="0.9" fill="#fff" />
        </svg>
      );
    case "LinkedIn":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#0A66C2" />
          <rect x="5.5" y="9.5" width="3" height="9" fill="#fff" />
          <circle cx="7" cy="6" r="1.7" fill="#fff" />
          <path
            d="M11.5 9.5h3v1.5c.6-1.1 1.7-1.8 3.1-1.8 2.4 0 3.9 1.6 3.9 4.4V18.5h-3v-4.2c0-1.2-.7-2-1.8-2s-2.1.8-2.1 2v4.2h-3z"
            fill="#fff"
          />
        </svg>
      );
    case "YouTube":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#FF0000" />
          <path d="M10 8.3v7.4l6.4-3.7z" fill="#fff" />
        </svg>
      );
    case "Pinterest":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#E60023" />
          <path
            d="M12 5.5a6.5 6.5 0 0 0-2.4 12.5c0-.5 0-1.1.1-1.6l.9-3.9s-.2-.5-.2-1.1c0-1 .6-1.8 1.4-1.8.6 0 1 .5 1 1 0 .6-.4 1.6-.6 2.5-.2.7.4 1.3 1.1 1.3 1.3 0 2.3-1.7 2.3-3.8 0-1.6-1.1-2.7-3-2.7-2.1 0-3.5 1.6-3.5 3.4 0 .6.2 1 .5 1.4.1.1.1.2 0 .3l-.2.7c0 .2-.2.2-.4.1-1-.4-1.5-1.6-1.5-2.9 0-2.2 1.9-4.7 5.4-4.7 2.9 0 4.7 2 4.7 4.2 0 2.9-1.6 5-3.9 5-.8 0-1.5-.4-1.8-.9l-.5 2c-.2.6-.5 1.3-.7 1.8A6.5 6.5 0 1 0 12 5.5z"
            fill="#fff"
          />
        </svg>
      );
    case "TikTok":
      return (
        <svg {...common}>
          <rect width="24" height="24" rx="6" fill="#000" />
          <path
            d="M14.5 5c.3 1.5 1.3 2.7 2.8 3v2.1a5.3 5.3 0 0 1-2.8-.8V15a4.3 4.3 0 1 1-3.7-4.3v2.2a2.1 2.1 0 1 0 1.6 2.1V5z"
            fill="#fff"
          />
        </svg>
      );
    default:
      return null;
  }
}
