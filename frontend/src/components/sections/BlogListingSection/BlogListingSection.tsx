import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Pagination } from "@/components/ui/Pagination";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import { getBlogCategories } from "@/features/blogs/api/get-blog-categories";
import { BlogFilters } from "./BlogFilters";
import { FeaturedBlogCard } from "./FeaturedBlogCard";
import { BlogCard } from "./BlogCard";

const FEATURED_COUNT = 2;
const GRID_PAGE_SIZE = 9;

/**
 * /blog's main section — transcribed from design-references/blog.png.
 * White background, not the black band the flattened screenshot shows —
 * same transparent-export-hole artifact already documented for every
 * other page built from this second Figma file this session (this
 * page's own alpha channel confirms it too).
 *
 * Breadcrumb is "Home > Blog", not the design's literal "Home > Nepal >
 * Trekking Routes in Nepal" — that's a Figma mockup copy-paste leftover
 * (this exact same wrong breadcrumb also appears on the individual post
 * mockup), not a real intended label for a blog page.
 *
 * The first 2 posts (already sorted `blogDate desc` server-side) render
 * as the large featured cards, but only on page 1 — everything else is
 * the "More Stories" grid, now paged via the shared `Pagination`
 * component (same link-based, no-client-JS shape as
 * TrekkingRoutesSection's), not the client-side "Load More" append this
 * used to do via its own now-deleted BlogGrid.
 *
 * Pagination trick, unchanged from the "Load More" version: this
 * fetches one combined page sized FEATURED_COUNT+GRID_PAGE_SIZE (11) at
 * a fixed `perPage`, and only *page 1* gets split into featured+grid —
 * every later page (2, 3, …) renders as a plain 11-post grid with no
 * featured cards. `GetBlogsDto` only takes `page`/`perPage` (no raw
 * offset), so a genuinely independent "9-per-page grid" starting where
 * page 1's featured cards left off isn't expressible — keeping the same
 * `perPage` across every page keeps `skip = (page-1)*perPage` correct
 * without ever re-showing or skipping a post, at the cost of page 1
 * showing a smaller (9-post) grid than every later page (11 posts).
 */
export async function BlogListingSection({
  page,
  categoryId,
  search,
}: {
  page: number;
  categoryId?: string;
  search?: string;
}) {
  const [categories, { items, meta }] = await Promise.all([
    getBlogCategories(),
    getBlogs({ page, perPage: FEATURED_COUNT + GRID_PAGE_SIZE, categoryId, search }),
  ]);

  const featured = page === 1 ? items.slice(0, FEATURED_COUNT) : [];
  const rest = page === 1 ? items.slice(FEATURED_COUNT) : items;

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (search) params.set("search", search);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  return (
    <section className="bg-brand-neutral-000 py-11">
      <div className="mx-auto flex w-full max-w-[1442px] flex-col items-center gap-6 px-6 md:px-16">
        <Breadcrumbs
          tone="dark"
          items={[{ label: "Home", href: "/" }, { label: "Blog" }]}
        />
        {/* `text-center` lives on the H1 itself, not the section wrapper —
            it used to sit up on the wrapper, which meant every descendant
            (the featured cards' overlaid title/date/author, each "More
            Stories" card's title/date/author) silently inherited centered
            text too, off-design in both places (see FeaturedBlogCard.tsx
            and BlogCard.tsx for the `text-left` overrides that were
            needed there before this got moved here instead). */}
        <h1 className="text-center font-playfair-display text-[44px] leading-[1.15] font-medium text-brand-neutral-1000">
          Travel Blogs
        </h1>

        <BlogFilters categories={categories} activeCategoryId={categoryId} search={search} />

        {featured.length > 0 ? (
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-[8fr_5fr]">
            {featured.map((post, index) => (
              <FeaturedBlogCard
                key={post.id}
                post={post}
                className={index === 1 ? "sm:aspect-auto sm:h-full" : undefined}
              />
            ))}
          </div>
        ) : null}

        <h2 className="w-full font-poppins text-[24px] leading-[1.3] font-bold text-brand-neutral-1000">
          More Stories
        </h2>

        <div className="mt-5 flex w-full flex-col items-center gap-10">
          {rest.length > 0 ? (
            <div className="grid w-full grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="font-poppins text-body-m text-brand-neutral-600">
              No posts match this filter yet.
            </p>
          )}

          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            buildHref={buildHref}
          />
        </div>
      </div>
    </section>
  );
}
