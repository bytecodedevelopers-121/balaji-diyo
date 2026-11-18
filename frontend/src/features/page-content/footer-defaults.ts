import defaults from "./footer-defaults.json";

/** Built-in copy of the site footer; the CMS (admin → Page Content → Footer) overrides it. */
export interface FooterContent {
  newsletter: { title: string; text: string; namePlaceholder: string; emailPlaceholder: string; buttonLabel: string };
  columns: { companyHeading: string; usefulLinksHeading: string };
  brand: { tagline: string; openingHours: string; watermark: string; backgroundImage: string };
  social: { heading: string };
  payments: { heading: string; image: string; imageAlt: string; href: string };
  legal: { rightsText: string; developedByLabel: string; developerName: string; developerUrl: string; registration: string };
}

export const FOOTER_DEFAULTS: FooterContent = defaults;
