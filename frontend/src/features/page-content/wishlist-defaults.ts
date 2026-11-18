import defaults from "./wishlist-defaults.json";

/** Built-in copy of the Wishlist page; the CMS (admin → Page Content → Wishlist) overrides it. */
export interface WishlistContent {
  content: { title: string; emptyTitle: string; emptyText: string; buttonLabel: string; buttonHref: string };
}

export const WISHLIST_DEFAULTS: WishlistContent = defaults;
