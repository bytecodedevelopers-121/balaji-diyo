import defaults from "./home-defaults.json";

/**
 * Built-in copy for every homepage section, kept in `home-defaults.json` (the
 * backend's `npm run seed:page-sections` loads that same file into the CMS).
 * The admin (Page Content → Home) overrides any field; whatever it leaves
 * empty falls back to these values.
 */
export interface HeroContent {
  badge: string;
  headlineLine1: string;
  headlineLine2: string;
  headlinePrefix: string;
  description: string;
  videos: { src: string }[];
  poster: string;
  categories: { label: string; sub: string; href: string; image: string; countSlug: string }[];
  places: { name: string }[];
}

export interface BestSellersContent {
  eyebrow: string;
  title: string;
  buttonLabel: string;
  buttonHref: string;
  maxCards: number;
}

export interface UpcomingTripsContent {
  eyebrow: string;
  title: string;
  buttonLabel: string;
  buttonHref: string;
  maxRows: number;
  noteTitle: string;
  noteBody: string;
}

export interface FeaturedToursContent {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  maxCards: number;
}

export interface ExploreNepalContent {
  eyebrow: string;
  title: string;
  /** Simple HTML (paragraphs, <strong>). */
  bodyHtml: string;
  buttonLabel: string;
  buttonHref: string;
  whyTitle: string;
  whyItems: { title: string; body: string }[];
  backgroundImage: string;
}

export interface ClientReviewsContent {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  platforms: { name: string; meta: string }[];
  buttonLabel: string;
  buttonHref: string;
  maxCards: number;
}

export interface WebStoriesContent {
  eyebrow: string;
  title: string;
  buttonLabel: string;
  buttonHref: string;
  maxCards: number;
}

export interface FaqGuidedContent {
  faqEyebrow: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  faqButtonLabel: string;
  faqButtonHref: string;
  guidedEyebrow: string;
  guidedTitle: string;
  points: { title: string; body: string }[];
}

export interface TravelNewsContent {
  eyebrow: string;
  title: string;
  buttonLabel: string;
  buttonHref: string;
  maxCards: number;
}

export interface AssociatedWithContent {
  title: string;
  partners: { name: string; src: string }[];
}

export interface CtaContent {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

/** Extra blocks an admin adds between the last section and the closing banner (Page Content → Home → Extra sections). */
export interface CustomSectionsContent {
  items: { title: string; text: string; image: string; imageAlt: string; buttonLabel: string; buttonHref: string }[];
}

export const HOME_DEFAULTS: {
  hero: HeroContent;
  bestSellers: BestSellersContent;
  upcomingTrips: UpcomingTripsContent;
  featuredTours: FeaturedToursContent;
  exploreNepal: ExploreNepalContent;
  clientReviews: ClientReviewsContent;
  webStories: WebStoriesContent;
  faqGuided: FaqGuidedContent;
  travelNews: TravelNewsContent;
  associatedWith: AssociatedWithContent;
  customSections: CustomSectionsContent;
  cta: CtaContent;
} = defaults;
