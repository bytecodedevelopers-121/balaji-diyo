import defaults from "./webstories-defaults.json";

/** Built-in copy of the Travel Web Stories page; the CMS (admin → Page Content → Travel Web Stories) overrides it. */
export interface WebStoriesPageContent {
  seo: { title: string; description: string };
  hero: { title: string; image: string; imageAlt: string };
}

export const WEBSTORIES_PAGE_DEFAULTS: WebStoriesPageContent = defaults;
