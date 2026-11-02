import "server-only";
import { isProduction } from "./canonical";
import { buildSitemapIndex, buildUrlSet, xmlResponse, type SitemapEntry } from "./sitemap-xml";
import { getAllPackageSlugs } from "@/features/trips/api/get-package-slugs";
import { getAllCategorySlugsWithPackages } from "@/features/trips/api/get-category-by-slug";
import { getTrekkingRegions } from "@/features/trekking-regions/api/get-trekking-regions";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import { getTeamMembers } from "@/features/team/api/get-team-members";
import { getAttractions } from "@/features/attractions/api/get-attractions";
import { getTrekkingRoutes } from "@/features/trekking-routes/api/get-trekking-routes";

/**
 * Grouped sitemap: `/sitemap.xml` is an index pointing at one sitemap
 * file per content type (`/page-sitemap.xml`, `/package-sitemap.xml`, …).
 * This registry is the single source of truth for both the index and each
 * group's own route handler (`src/app/<name>-sitemap.xml/route.ts`), so
 * adding a group here means adding its one-line route file and nothing
 * else.
 *
 * Every group returns an empty set outside production, matching
 * robots.ts's noindex behavior on non-production deploys.
 */
export type SitemapGroupName =
  | "page"
  | "package"
  | "category"
  | "blog"
  | "team"
  | "attraction"
  | "map";

interface SitemapGroup {
  name: SitemapGroupName;
  entries: () => Promise<SitemapEntry[]>;
}

/**
 * Real, confirmed-legacy or built-and-live top-level pages. Detail pages
 * and listing-style pages that resolve through the flat `/<slug>` route
 * (packages, categories, regions) live in their own groups below.
 */
const STATIC_PAGES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/about-us", priority: 0.7 },
  { path: "/why-boundless-adventure", priority: 0.7 },
  { path: "/team", priority: 0.7 },
  { path: "/company-documents", priority: 0.6 },
  { path: "/responsible-tourism", priority: 0.6 },
  { path: "/booking-terms-and-conditions", priority: 0.6 },
  { path: "/last-minute-trip-deals", priority: 0.7 },
  { path: "/customize-trip", priority: 0.8 },
  { path: "/volunteering-in-nepal", priority: 0.7 },
  { path: "/become-a-partner", priority: 0.6 },
  { path: "/compare-itineraries", priority: 0.7 },
  { path: "/reviews", priority: 0.7 },
  { path: "/contact", priority: 0.6 },
  { path: "/map", priority: 0.7 },
  { path: "/trekking-routes-in-nepal", priority: 0.8 },
  { path: "/blog", priority: 0.7 },
  { path: "/attractions", priority: 0.7 },
];

/**
 * Blog is fetched a page at a time: a single perPage=100 fetch of full
 * post bodies exceeds Next's 2MB per-entry data-cache limit (confirmed
 * via a real build), and the sitemap needs every post, not just the
 * first page of them.
 */
const BLOG_PAGE_SIZE = 30;

async function getAllBlogPosts() {
  const first = await getBlogs({ page: 1, perPage: BLOG_PAGE_SIZE });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.meta.totalPages - 1) }, (_, i) =>
      getBlogs({ page: i + 2, perPage: BLOG_PAGE_SIZE }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}

const withSlug = <T extends { slug: string | null }>(item: T): item is T & { slug: string } => Boolean(item.slug);

const GROUPS: SitemapGroup[] = [
  {
    name: "page",
    entries: async () =>
      STATIC_PAGES.map(({ path, priority }) => ({ path, priority, changeFrequency: "weekly" as const })),
  },
  {
    name: "package",
    entries: async () =>
      (await getAllPackageSlugs()).map((slug) => ({
        path: `/${slug}`,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      })),
  },
  {
    // Trekking regions + real category-browse pages — both are landing
    // pages that resolve through the flat `/<slug>` route.
    name: "category",
    entries: async () => {
      const [regions, categorySlugs] = await Promise.all([getTrekkingRegions(), getAllCategorySlugsWithPackages()]);
      const slugs = new Set([...regions.filter(withSlug).map((r) => r.slug), ...categorySlugs]);
      return [...slugs].map((slug) => ({ path: `/${slug}`, priority: 0.7, changeFrequency: "weekly" as const }));
    },
  },
  {
    name: "blog",
    entries: async () =>
      (await getAllBlogPosts()).filter(withSlug).map((post) => ({
        path: `/blog/${post.slug}`,
        priority: 0.5,
        changeFrequency: "monthly" as const,
      })),
  },
  {
    name: "team",
    entries: async () =>
      (await getTeamMembers()).filter(withSlug).map((member) => ({
        path: `/team/${member.slug}`,
        priority: 0.5,
        changeFrequency: "monthly" as const,
      })),
  },
  {
    name: "attraction",
    entries: async () => {
      const { regions } = await getAttractions();
      // A place can appear under several regions — list each once.
      const places = new Map(regions.flatMap((region) => region.places).filter(withSlug).map((p) => [p.id, p]));
      return [...places.values()].map((place) => ({
        path: `/attractions/${place.slug}`,
        priority: 0.5,
        changeFrequency: "monthly" as const,
      }));
    },
  },
  {
    // Per-trip trek route maps (`/map/<slug>`), all in one perPage=100
    // call — 48 real maps, and their bodies are small enough to stay
    // under the data-cache limit (unlike blog's).
    name: "map",
    entries: async () =>
      (await getTrekkingRoutes(1, 100)).items.filter(withSlug).map((route) => ({
        path: `/map/${route.slug}`,
        priority: 0.5,
        changeFrequency: "monthly" as const,
      })),
  },
];

const sitemapPath = (name: SitemapGroupName) => `/${name}-sitemap.xml`;

/** Response for one group's sitemap file — used by each `<name>-sitemap.xml/route.ts`. */
export async function sitemapGroupResponse(name: SitemapGroupName): Promise<Response> {
  const group = GROUPS.find((g) => g.name === name);
  const entries = group && isProduction() ? await group.entries() : [];
  return xmlResponse(buildUrlSet(entries));
}

/** Response for `/sitemap.xml` — the index of every group above. */
export function sitemapIndexResponse(): Response {
  const paths = isProduction() ? GROUPS.map((g) => sitemapPath(g.name)) : [];
  return xmlResponse(buildSitemapIndex(paths));
}
