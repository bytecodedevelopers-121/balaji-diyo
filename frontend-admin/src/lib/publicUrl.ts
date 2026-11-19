const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000").replace(/\/+$/, "");

/** Where a page created under Admin → Pages is shown on the public website: /<slug>. */
export function publicPageUrl(slug: string | null | undefined): string | null {
  return slug ? `${SITE_URL}/${slug}` : null;
}
