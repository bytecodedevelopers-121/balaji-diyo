import defaults from "./contact-defaults.json";
import type { CtaContent } from "./home-defaults";

/** Built-in copy of the Contact Us page; the CMS (admin → Page Content → Contact Us) overrides it. */
export interface ContactContent {
  seo: { title: string; description: string };
  intro: {
    title: string;
    subtitle: string;
    openedTitle: string;
    openedItems: { text: string }[];
    salesTitle: string;
    salesNote: string;
  };
  details: {
    /** Empty = use the company name from Global Settings. */
    companyName: string;
    addressLabel: string;
    phoneLabel: string;
    mobileLabel: string;
    emailLabel: string;
    hoursLabel: string;
    hoursText: string;
  };
  map: { title: string; buttonLabel: string; searchText: string };
  cta: CtaContent;
}

export const CONTACT_DEFAULTS: ContactContent = defaults;
