/**
 * CMS page domain type — maps to the backend's Page module
 * (backend/src/modules/page), exposed publicly via `GET /pages/:slug`.
 *
 * This is the generic, admin-editable content-page model the legacy site
 * used for its long-form static pages (Responsible Tourism, and ~19
 * others already migrated into the dev DB). Distinct from the hardcoded
 * section components some secondary pages still use (AboutUsIntroSection
 * etc.) — those predate anything being wired to this API.
 */
export interface CmsPageMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface CmsPage {
  id: string;
  title: string;
  /** Rich CMS-authored HTML (headings, lists, figures). Trusted admin content — see PageContent for how it's rendered/normalized. */
  content: string | null;
  slug: string | null;
  /** Optional "continue to" link to another page of the site, set in Admin → Pages. */
  linkedPagePath?: string | null;
  linkedPageLabel?: string | null;
  meta: CmsPageMeta | null;
}
