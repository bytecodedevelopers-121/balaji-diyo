import { publicEnv } from "@/lib/env";

/**
 * Site-wide configuration.
 *
 * `url` intentionally comes from `NEXT_PUBLIC_SITE_URL`, never a literal
 * domain in this file — each deployment (local/preview/staging/production)
 * sets its own origin via environment variables, so no production domain
 * is hardcoded in source. See src/lib/seo/canonical.ts for how this is
 * combined with NEXT_PUBLIC_APP_ENV to decide indexability.
 */
export const siteConfig = {
  name: "Your Company Pvt. Ltd.",
  shortName: "Your Company",
  /** Placeholder copy — replace once final marketing copy is provided. */
  description:
    "Your Company Pvt. Ltd. plans guided treks, tours and expeditions. Site content is a placeholder pending the Figma implementation.",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  locale: "en_US",
  themeColor: "#1c1917",
  /**
   * Nepal HQ number as sampled in the Figma header (node 2001:13563)
   * and Contact Us page. Multiple regional office numbers exist in the
   * Footer (not sampled — see docs/figma-design-audit.md) but only
   * this one is used in the header.
   */
  phone: "+977 9845000000",
  phoneHref: "tel:+9779845000000",
  /** Local placeholder — replace with a real default share image later. */
  defaultOgImage: "/images/placeholders/og-default.svg",
} as const;

export type SiteConfig = typeof siteConfig;
