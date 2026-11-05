import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { Pagination } from "@/components/ui/Pagination";
import { getBlogCategories, getBlogs } from "@/features/blogs/api/get-blogs";
import { BlogCard, BlogMeta } from "@/features/blogs/components/BlogCard";
import { blogExcerpt } from "@/features/blogs/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Nepal Travel Blog",
  description: "Trekking guides, route and weather tips, costs, permits and packing lists for Nepal from the Joyful Trekking team.",
  path: "/blog",
});

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}

const PER_PAGE = 9;

/** Nepal Travel Blog: featured post band, category/search filters and a paginated "Latest Travel Blogs" grid. */
export default async function BlogPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const categoryId = query.category || undefined;
  const search = query.search?.trim() || undefined;
  const isFiltered = Boolean(categoryId || search);

  const [list, categories, featuredList] = await Promise.all([
    getBlogs({ page, perPage: PER_PAGE, categoryId, search }),
    getBlogCategories().catch(() => []),
    page === 1 && !isFiltered ? getBlogs({ perPage: 1 }) : Promise.resolve(null),
  ]);

  const featured = featuredList?.items[0] ?? null;
  const posts = featured ? list.items.filter((post) => post.id !== featured.id) : list.items;

  const buildHref = (target: number) => {
    const params = new URLSearchParams();
    if (target > 1) params.set("page", String(target));
    if (categoryId) params.set("category", categoryId);
    if (search) params.set("search", search);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  };

  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-6 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1170px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Nepal Travel Blog" }]}
          />
          <h1 className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
            Nepal Travel Blog
          </h1>
        </div>
      </section>

      {featured ? (
        <section className="bg-[#fcefe3] px-4 py-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className="mx-auto grid w-full max-w-[1170px] items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="text-[13px] tracking-wide text-brand-neutral-800 uppercase">Featured Post</p>
              <h2 className="mt-2 text-[clamp(24px,3.4vw,32px)] leading-tight font-semibold text-logo-navy">
                <Link href={`/blog/${featured.slug}`} className="hover:underline">
                  {featured.title}
                </Link>
              </h2>
              <div className="mt-8">
                <BlogMeta post={featured} />
              </div>
              <p className="mt-5 text-[15px] leading-[1.8] text-brand-neutral-800">{blogExcerpt(featured, 360)}</p>
              <Link
                href={`/blog/${featured.slug}`}
                className="mt-6 inline-flex items-center gap-2 rounded-pill border border-primary-500 px-5 py-2.5 text-[14px] text-brand-neutral-1000 transition-colors hover:bg-primary-500 hover:text-white"
              >
                Explore More <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[6px] bg-brand-neutral-200">
              <FillImage
                src={featured.imageUrl}
                alt={featured.title}
                className="absolute inset-0 size-full object-cover"
                sizes="(min-width:1024px) 560px, 100vw"
                preload
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-brand-neutral-000 px-4 pt-10 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1170px]">
          <form
            method="get"
            action="/blog"
            className="flex flex-col gap-4 rounded-md bg-white p-4 shadow-card-strong sm:flex-row sm:items-center sm:justify-between"
          >
            <select
              name="category"
              defaultValue={categoryId ?? ""}
              aria-label="Choose category"
              className="w-full rounded-md border border-brand-neutral-300 bg-white px-4 py-3.5 text-[14px] text-brand-neutral-900 outline-none focus:border-primary-500 sm:w-[280px]"
            >
              <option value="">Choose Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
            <div className="flex w-full gap-2 sm:w-[280px]">
              <input
                type="search"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search"
                aria-label="Search blogs"
                className="w-full rounded-md border border-brand-neutral-300 bg-white px-4 py-3.5 text-[14px] text-brand-neutral-900 outline-none focus:border-primary-500"
              />
              <button type="submit" className="rounded-md bg-primary-500 px-4 text-[14px] font-medium text-white">
                Go
              </button>
            </div>
          </form>

          <h2 className="mt-10 font-display text-[clamp(24px,3.4vw,32px)] font-bold text-brand-neutral-1000">Latest Travel Blogs</h2>

          {posts.length === 0 ? (
            <p className="mt-8 text-[16px] text-brand-neutral-800">No blog posts found.</p>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.id}>
                  <BlogCard post={post} />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex justify-center">
            <Pagination currentPage={list.meta.currentPage} totalPages={list.meta.totalPages} buildHref={buildHref} />
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
