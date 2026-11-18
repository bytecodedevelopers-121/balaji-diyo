export interface DestinationCard {
  label: string;
  href: string;
  image: string;
  categoryKey?: string;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  countryLabel: string;
  heroImage: string;
  intro: string;
  cards: DestinationCard[];
  contentHtml: string;
  sortOrder: number;
  isActive: boolean;
}

export interface GuideSection {
  heading?: string;
  body?: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
}

export interface GuideTopic {
  id?: string;
  slug: string;
  title: string;
  image: string;
  summary: string;
  intro?: string[] | null;
  sections: GuideSection[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface TravelGuide {
  id: string;
  slug: string;
  country: string;
  title: string;
  image: string;
  summary: string;
  sortOrder: number;
  isActive: boolean;
  topics: GuideTopic[];
}

export interface WebStorySlide {
  image: string;
  video?: string;
  caption: string;
}

export interface WebStory {
  id: string;
  slug: string;
  title: string;
  cover: string;
  slides: WebStorySlide[];
  sortOrder: number;
  isActive: boolean;
}

export type SiteContentResource = "destinations" | "travel-guides" | "web-stories";
