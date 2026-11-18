import about from "./about-defaults.json";
import team from "./team-defaults.json";
import legal from "./legal-defaults.json";
import guided from "./guided-defaults.json";
import responsible from "./responsible-defaults.json";
import partner from "./partner-defaults.json";
import terms from "./terms-defaults.json";
import privacy from "./privacy-defaults.json";

/**
 * Built-in copy of the Company menu pages (About Us, Team, Legal Documents, Why Guided Travel, Responsible
 * Travel, Partner with Us, Terms, Privacy). The CMS (admin → Page Content) overrides it section by section.
 * Fields named `body` are rich-text HTML written in the admin's text editor.
 */
export interface SeoContent {
  title: string;
  description: string;
}

export interface PhotoItem {
  image: string;
  imageAlt: string;
}

export interface AboutContent {
  seo: SeoContent;
  hero: { title: string; subtitle: string; image: string; imageAlt: string };
  story: {
    label: string;
    heading: string;
    headingAccent: string;
    body: string;
    collage: PhotoItem[];
    stats: { value: string; label: string }[];
    strip: PhotoItem[];
  };
  history: {
    title: string;
    titleAccent: string;
    milestones: { year: string; title: string; image: string; imageAlt: string; body: string }[];
  };
}

export interface TeamContent {
  seo: SeoContent;
  hero: { title: string; subtitle: string; image: string; imageAlt: string };
  intro: { label: string; heading: string; headingAccent: string; body: string; image: string; imageAlt: string };
  grid: { heading: string; headingAccent: string; headingEnd: string };
}

export interface LegalContent {
  seo: SeoContent;
  intro: { title: string; body: string; note: string };
  groups: { legalTitle: string; associationsTitle: string };
}

/** A text page: heading plus one rich-text body; `image` only on the pages that have a top photo. */
export interface ProsePageContent {
  seo: SeoContent;
  content: { title: string; body: string; image?: string; imageAlt?: string };
}

export const ABOUT_DEFAULTS: AboutContent = about;
export const TEAM_DEFAULTS: TeamContent = team;
export const LEGAL_DEFAULTS: LegalContent = legal;
export const GUIDED_DEFAULTS: ProsePageContent = guided;
export const RESPONSIBLE_DEFAULTS: ProsePageContent = responsible;
export const PARTNER_DEFAULTS: ProsePageContent = partner;
export const TERMS_DEFAULTS: ProsePageContent = terms;
export const PRIVACY_DEFAULTS: ProsePageContent = privacy;
