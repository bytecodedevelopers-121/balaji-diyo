/** `**bold**` marks bold runs in any text field below. */
export interface GuideSection {
  heading?: string;
  /** A single paragraph (shorthand for one entry in `paragraphs`). */
  body?: string;
  paragraphs?: string[];
  /** Rendered with the star-bookmark bullet. */
  bullets?: string[];
  /** Highlighted peach callout box. */
  note?: string;
}

export interface GuideTopic {
  slug: string;
  title: string;
  image: string;
  /** Used for meta description and, without `intro`, as the opening paragraph. */
  summary: string;
  /** Opening paragraphs shown under the title (overrides `summary` on the page). */
  intro?: string[] | null;
  sections: GuideSection[];
}

export interface TravelGuide {
  slug: string;
  country: string;
  title: string;
  image: string;
  summary: string;
  /** Topic cards shown on the country page, each with its own detail page. */
  topics: GuideTopic[];
}

export interface DestinationCard {
  label: string;
  href: string;
  image: string;
  /** Activity key in `TRIP_CATEGORIES`, used for the package count. */
  categoryKey?: string;
}

export interface Destination {
  slug: string;
  name: string;
  heroImage: string;
  intro: string;
  countryLabel: string;
  cards: DestinationCard[];
  /** CMS-style HTML article under the cards (h2/h3, paragraphs, blockquote notes). */
  contentHtml: string;
}

export interface WebStorySlide {
  image: string;
  video?: string;
  caption: string;
}

export interface WebStory {
  slug: string;
  title: string;
  /** Card cover; also the first slide's background in the viewer. */
  cover: string;
  slides: WebStorySlide[];
}
