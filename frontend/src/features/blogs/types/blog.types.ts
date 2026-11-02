/**
 * Blog post domain type — maps to the backend's Blog module
 * (backend/src/modules/blog), exposed publicly via `GET /blogs` (list)
 * and `GET /blogs/:slug` (detail). Captured from a live response, not
 * guessed — replaces this file's earlier provisional shape now that a
 * real page consumes it.
 */
export interface BlogAuthor {
  id: string;
  name: string;
  salutation: string | null;
  /** Real CMS-authored HTML bio — render with dangerouslySetInnerHTML, same trust level as the rest of this site's admin-authored copy. */
  description: string | null;
}

export interface BlogCategory {
  id: string;
  title: string;
}

export interface BlogPost {
  id: string;
  title: string;
  /** Real CMS-authored HTML, short form — used for card/meta descriptions. Most real posts don't have one set (null), not every card needs an excerpt. */
  abstract: string | null;
  /** Real CMS-authored HTML, full article body — render with dangerouslySetInnerHTML (see CmsProse). Contains real `<h2>`/`<h3>` section headings with the legacy site's own slug ids already baked in on some of them. */
  content: string;
  blogDate: string;
  authors: BlogAuthor[];
  categories: BlogCategory[];
  /**
   * The post's cover photo. Resolved server-side from the SINGLE_BANNER
   * (or, for most legacy-migrated rows, FEATURED) Attachment — see
   * blog.repository.ts's findFeaturedImagePaths. Null only for a post
   * with no image attached.
   */
  imageUrl: string | null;
  /**
   * True only when `imageUrl` came from a real SINGLE_BANNER attachment
   * — a photo actually sized/shaped for a full-bleed hero (~5 posts).
   * False for the common case, a FEATURED attachment — a small legacy
   * thumbnail (as little as ~436×369) never meant to fill an ultra-wide
   * strip. BlogDetailSection's hero uses this to pick `object-cover`
   * (safe, full-bleed) vs. a blurred-backdrop + `object-contain`
   * treatment (avoids the pixelated/zoomed-in look a small thumbnail
   * gets forced through `object-cover` at that aspect ratio).
   */
  imageIsWideBanner: boolean;
  /** Resolved from the owning `url_infos` row server-side; null only if that row is somehow missing. */
  slug: string | null;
}
