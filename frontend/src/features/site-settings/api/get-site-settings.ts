import "server-only";
import { apiFetch } from "@/lib/api/api-client";
import { siteConfig } from "@/config/site";
import type { SiteSettings } from "../types/site-settings.types";

/** Wire shape of `GET /global-settings/public` — a flat map of every
 *  active `GlobalSetting` row (see backend's
 *  `global-setting.controller.ts` `findAllPublic`). Values are
 *  `unknown` at this level (STRING/TEXT/INTEGER/BOOLEAN/IMAGE/JSON all
 *  collapse into one JSON payload); narrowed to `string` below since
 *  every key this frontend reads is legacy-migrated as STRING/TEXT. */
type RawPublicSettings = Record<string, unknown>;

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
  const raw = await apiFetch<RawPublicSettings>("/global-settings/public", {
    next: { revalidate: 300, tags: ["site-settings"] },
  }).catch(() => ({}) as RawPublicSettings);

  return {
    companyName: asString(raw, "company_name", siteConfig.name),
    phone: asString(raw, "phone", "+977 14701884"),
    secondaryPhone: asString(raw, "secondary_phone", "+977 14701885"),
    mobile: asString(raw, "mobile", siteConfig.phone),
    email: asString(raw, "email", "joyfultrekking@gmail.com"),
    secondaryEmail: asString(raw, "secondary_email", "joyfultrekking@gmail.com"),
    address: asString(raw, "address", "Thamel, Kathmandu, Nepal"),
    poBox: asString(raw, "po_box", "P.O. Box No. 11670"),
    socialLinks: buildSocialLinks(raw),
  };
}
