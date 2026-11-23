import "server-only";
import { apiFetch } from "@/lib/api/api-client";
import { siteConfig } from "@/config/site";
import { getPageSections } from "@/features/page-content/api";
import type { SiteSettings } from "../types/site-settings.types";

/** Wire shape of `GET /global-settings/public` — a flat map of every
 *  active `GlobalSetting` row (see backend's
 *  `global-setting.controller.ts` `findAllPublic`). Values are
 *  `unknown` at this level (STRING/TEXT/INTEGER/BOOLEAN/IMAGE/JSON all
 *  collapse into one JSON payload); narrowed to `string` below since
 *  every key this frontend reads is legacy-migrated as STRING/TEXT. */
type RawPublicSettings = Record<string, unknown>;

/** CMS contact field → the Global Settings key it overrides. */
const CMS_CONTACT_KEYS = [
  { field: "address", setting: "address" },
  { field: "email", setting: "email" },
  { field: "phone", setting: "phone" },
  { field: "secondaryPhone", setting: "secondary_phone" },
  { field: "mobile", setting: "mobile" },
] as const;

/** Social links saved in the CMS, minus rows missing a platform or an address. */
function readCmsSocialLinks(value: unknown): SiteSettings["socialLinks"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    const { label, href } = (row ?? {}) as { label?: unknown; href?: unknown };
    return typeof label === "string" && label && typeof href === "string" && href.trim()
      ? [{ label, href: href.trim() }]
      : [];
  });
}

function asString(raw: RawPublicSettings, key: string, fallback: string): string {
  const value = raw[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

/**
 * Real social profile URLs from the migrated `GlobalSetting` rows, in
 * the same platform order/labels `config/social-links.ts`'s old
 * placeholder used — `SocialIcon` (components/ui/ContactIcons.tsx)
 * matches on these exact labels, so the order/wording has to stay put
 * even though the URLs now come from real data.
 */
function buildSocialLinks(raw: RawPublicSettings): SiteSettings["socialLinks"] {
  return [
    { label: "Facebook", href: asString(raw, "facebook", "https://facebook.com/") },
    { label: "X", href: asString(raw, "twitter", "https://x.com/") },
    { label: "Instagram", href: asString(raw, "instagram", "https://instagram.com/") },
    { label: "LinkedIn", href: asString(raw, "linkedin", "https://linkedin.com/") },
    { label: "YouTube", href: asString(raw, "youtube", "https://youtube.com/") },
    { label: "Pinterest", href: asString(raw, "pinterest", "https://pinterest.com/") },
    { label: "TikTok", href: asString(raw, "tiktok", "https://tiktok.com/") },
  ];
}

/**
 * Fetches every active `GlobalSetting` in one request (see that
 * module's own `findAllPublic` doc comment on why this is one bulk
 * endpoint rather than one round trip per key) and narrows it to what
 * this frontend renders. Every field falls back to a static default —
 * `siteConfig`'s existing values, or the same placeholder URLs
 * `config/social-links.ts` used — if the API is unreachable or a
 * specific key is missing/inactive, so callers (Header, Footer, ...)
 * degrade to exactly their pre-existing hardcoded behavior instead of
 * rendering blank contact info.
 *
 * Cached like `getHeaderNavData`/`getFooterNavData` (Next's fetch
 * Data Cache dedupes identical calls within one request, so calling
 * this once per route-group layout — same pattern those two already
 * use — doesn't mean one request per layout at runtime).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const [globals, cms] = await Promise.all([
    apiFetch<RawPublicSettings>("/global-settings/public", {
      next: { revalidate: 300, tags: ["site-settings"] },
    }).catch(() => ({}) as RawPublicSettings),
    getPageSections("site"),
  ]);
  // Contact details and social links saved in the admin (Page Content → Contact details & social links)
  // win over the older Global Settings rows, which stay as the fallback.
  const raw: RawPublicSettings = { ...globals };
  for (const key of CMS_CONTACT_KEYS) {
    const value = cms.contact?.content?.[key.field];
    if (typeof value === "string" && value.trim().length > 0) raw[key.setting] = value.trim();
  }
  const cmsLinks = readCmsSocialLinks(cms.social?.content?.links);

  return {
    companyName: asString(raw, "company_name", siteConfig.name),
    phone: asString(raw, "phone", "+977 14701884"),
    secondaryPhone: asString(raw, "secondary_phone", "+977 14701885"),
    mobile: asString(raw, "mobile", siteConfig.phone),
    email: asString(raw, "email", "info@example.com"),
    secondaryEmail: asString(raw, "secondary_email", "info@example.com"),
    address: asString(raw, "address", "Thamel, Kathmandu, Nepal"),
    poBox: asString(raw, "po_box", "P.O. Box No. 11670"),
    socialLinks: cmsLinks.length > 0 ? cmsLinks : buildSocialLinks(raw),
  };
}
