/**
 * Shared "share this page on social media" building blocks — the
 * sharer-intent URLs and matching icons, used by both
 * `BlogDetailSection/ShareButtons.tsx` (inline row, blog post page) and
 * `[slug]/_components/SharePopover.tsx` (popover, package detail page).
 * Split out so the two call sites can't drift on link format or icon
 * artwork; add a platform here once and both pick it up.
 *
 * Plain `<a>` sharer-intent URLs, matching how the live production
 * site's own package-detail "Share" button works (a static row of
 * platform sharer links, not the `navigator.share()` Web Share API).
 */
export interface SocialShareLink {
  label: string;
  href: string;
  /** Brand background color, as a Tailwind class (ShareButtons' icon-tile treatment) or hex (SharePopover). */
  color: string;
}

export function buildSocialShareLinks(url: string, title: string): SocialShareLink[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "#1877F2",
    },
    {
      label: "X",
      // Matches the `brand-neutral-1000` design token (theme.css) — the
      // original ShareButtons.tsx used that Tailwind class directly;
      // hardcoded here since this module has no Tailwind class context.
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "#050505",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "#0A66C2",
    },
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      color: "#E60023",
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "#25D366",
    },
  ];
}

export function SocialShareIcon({ platform, className = "size-4" }: { platform: string; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  switch (platform) {
    case "Facebook":
      return (
        <svg {...common}>
          <path d="M14 9h3V6h-3c-1.66 0-3 1.34-3 3v2H9v3h2v6h3v-6h3l1-3h-4v-2c0-.55.45-1 1-1z" />
        </svg>
      );
    case "X":
      return (
        <svg {...common}>
          <path d="M4 4l7.5 8.5L4.3 20h2.3l6-6.6 4.8 6.6H20l-7.8-9L19.4 4h-2.3l-5.6 6.1L6.3 4z" />
        </svg>
      );
    case "LinkedIn":
      return (
        <svg {...common}>
          <rect x="3" y="9" width="4" height="12" />
          <circle cx="5" cy="4.5" r="2.2" />
          <path d="M11 9h4v2c.7-1.4 2.2-2.3 4-2.3 3 0 5 2 5 5.5V21h-4v-6.2c0-1.6-.9-2.6-2.3-2.6-1.5 0-2.7 1-2.7 2.6V21h-4z" />
        </svg>
      );
    case "Pinterest":
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.7.2-2.5l1.4-6s-.3-.7-.3-1.7c0-1.6 1-2.8 2.1-2.8 1 0 1.5.7 1.5 1.6 0 1-.6 2.5-.9 3.9-.3 1.1.6 2 1.7 2 2.1 0 3.5-2.6 3.5-5.8 0-2.4-1.6-4.2-4.6-4.2-3.3 0-5.4 2.5-5.4 5.2 0 1 .3 1.6.7 2.2.2.2.2.3.1.6l-.3 1c-.1.3-.3.4-.6.3-1.6-.7-2.3-2.4-2.3-4.4 0-3.3 2.8-7.2 8.2-7.2 4.4 0 7.2 3.1 7.2 6.5 0 4.4-2.5 7.7-6.1 7.7-1.2 0-2.4-.7-2.7-1.4l-.8 3c-.2.9-.7 2-1.1 2.7A10 10 0 1 0 12 2z" />
        </svg>
      );
    case "WhatsApp":
      return (
        <svg {...common}>
          <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.44 1.27 4.89L2 22l5.25-1.28A9.95 9.95 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm5.83 14.24c-.25.7-1.24 1.28-2.02 1.44-.55.11-1.26.2-3.66-.78-2.94-1.22-4.84-4.16-4.99-4.35-.14-.19-1.2-1.6-1.2-3.05s.75-2.17 1.02-2.47c.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.25.58.83 2 .9 2.15.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.17-.29.38-.41.51-.14.14-.28.3-.12.58.16.28.71 1.18 1.53 1.91 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.53.33.07.12.07.68-.18 1.38z" />
        </svg>
      );
    default:
      return null;
  }
}
