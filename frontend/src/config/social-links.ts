/**
 * Social profile links shown in the footer.
 *
 * PLACEHOLDER: URLs are not yet confirmed against the current live
 * profiles. Replace with the real handles before launch.
 *
 * Extended to 7 platforms (was 3) to match the footer's real icon row
 * (design-references/homepage.png, y≈9420 at 1440px): Facebook, X,
 * Instagram, LinkedIn, YouTube, Pinterest, TikTok, in that order.
 */
export interface SocialLink {
  label: string;
  href: string;
}

export const socialLinks: SocialLink[] = [
  { label: "Facebook", href: "https://facebook.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
  { label: "YouTube", href: "https://youtube.com/" },
  { label: "Pinterest", href: "https://pinterest.com/" },
  { label: "TikTok", href: "https://tiktok.com/" },
];
