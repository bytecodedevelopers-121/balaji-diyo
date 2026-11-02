/**
 * Public, non-auth site-wide settings — mirrors legacy's
 * `base_global_settings` (now the `GlobalSetting` model, see backend's
 * `global-setting` module), exposed as a flat `{ key: resolvedValue }`
 * map by `GET /global-settings/public`.
 *
 * Only the handful of keys this frontend actually renders are typed
 * here (contact info + socials for Header/Footer) — the API returns
 * ~45 keys total (advanced/company/images groups: meta defaults,
 * review counts, category-section picks, avatars, ...), most of which
 * have no current UI consumer. Deliberately NOT including `logo_light`/
 * `logo_dark`: `components/ui/Logo.tsx` is a pixel-exact 3-layer Figma
 * reproduction, not a single-image lockup, so swapping in the settings
 * table's flat SVG there would be a fidelity regression, not a fix —
 * see that component's own doc comment.
 */
export interface SiteSettings {
  companyName: string;
  /** Nepal HQ landline (`phone` setting) — not currently surfaced in
   *  the header (see `mobile` below), kept for a future consumer. */
  phone: string;
  /** Second Nepal HQ business landline. */
  secondaryPhone: string;
  /** Nepal HQ mobile (`mobile` setting) — this is the number the header
   *  CTA/phone link actually shows; `config/site.ts`'s old hardcoded
   *  `siteConfig.phone` was this same value transcribed as a literal. */
  mobile: string;
  email: string;
  secondaryEmail: string;
  address: string;
  /** Nepal HQ postal box, displayed with the street address. */
  poBox: string;
  /** Real social profile URLs, in the same platform order/labels
   *  `config/social-links.ts`'s placeholder used (`SocialIcon` matches
   *  on these exact labels) — see that file's own "PLACEHOLDER" note,
   *  now superseded by this real, migrated data. */
  socialLinks: { label: string; href: string }[];
}
