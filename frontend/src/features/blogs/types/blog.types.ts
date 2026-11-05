/** A public blog post from `GET /blogs` (list) or `GET /blogs/:slug` (detail, includes `content`). */
export interface BlogPost {
  id: string;
  title: string;
  abstract: string | null;
  /** Real CMS-authored HTML; only guaranteed on the detail endpoint's rendering, present on both. */
  content: string;
  /** ISO date string. */
  blogDate: string;
  slug: string | null;
  authors: { id: string; name: string }[];
  categories: { id: string; title: string }[];
  /** Absolute URL of the post's featured image, or null when it has none. */
  imageUrl: string | null;
  imageIsWideBanner: boolean;
}

export interface BlogCategoryOption {
  id: string;
  title: string;
}
