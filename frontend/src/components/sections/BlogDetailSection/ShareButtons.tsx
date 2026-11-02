import { publicEnv } from "@/lib/env";
import { buildSocialShareLinks, SocialShareIcon } from "@/lib/share/social-share-links";

/**
 * "Share With Your Friends" (design-references/
 * "Travel Blogs - Individual.png", y≈3300–3450 at 1440px) — sharer-intent
 * links built by the shared `buildSocialShareLinks` (see
 * `lib/share/social-share-links.tsx`, also used by the package-detail
 * page's `SharePopover`), pointed at this post's real canonical URL.
 *
 * Server Component: `publicEnv.NEXT_PUBLIC_SITE_URL` (not
 * `window.location`) builds the absolute URL from the post's own
 * `path`, so this renders correctly without needing to be a Client
 * Component.
 */
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const url = `${publicEnv.NEXT_PUBLIC_SITE_URL}${path}`;
  // This row keeps its original four platforms (no WhatsApp tile here,
  // unlike SharePopover) to match the Figma reference exactly.
  const links = buildSocialShareLinks(url, title).filter((link) => link.label !== "WhatsApp");

  return (
    // Plain `flex flex-wrap justify-between` left the label/icon-row
    // pair's exact horizontal position up to whatever each wrapped line
    // did once they didn't both fit on one line — reported as landing
    // centered on a narrow phone. Explicit `flex-col items-start` below
    // `sm` removes that ambiguity outright (column layout's cross-axis
    // is horizontal, so `items-start` pins both rows flush left);
    // `sm:flex-row sm:justify-between` restores the original one-line,
    // label-left/icons-right layout once there's room for it.
    <div className="flex flex-col items-start gap-4 bg-brand-neutral-000 p-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-poppins text-[14px] leading-[22.4px] font-bold tracking-wide text-brand-neutral-700 uppercase">
        Share With Your Friends
      </p>
      <div className="flex items-center gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Share on ${link.label}`}
            className="flex size-9 items-center justify-center rounded-md text-brand-neutral-000 transition-opacity hover:opacity-90"
            style={{ backgroundColor: link.color }}
          >
            <SocialShareIcon platform={link.label} />
          </a>
        ))}
      </div>
    </div>
  );
}
