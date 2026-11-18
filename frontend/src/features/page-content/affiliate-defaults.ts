import defaults from "./affiliate-defaults.json";

/** Built-in copy of the Affiliate Program page; the CMS (admin → Page Content → Affiliate Program) overrides it. */
export interface AffiliateContent {
  seo: { title: string; description: string };
  /** `body` is rich-text HTML written in the admin's text editor. */
  intro: { title: string; body: string };
  form: { title: string; submitLabel: string; successMessage: string };
}

export const AFFILIATE_DEFAULTS: AffiliateContent = defaults;
