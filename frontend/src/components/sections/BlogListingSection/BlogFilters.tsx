import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlogCategory } from "@/features/blogs/types/blog.types";

/**
 * Category pills + search input (design-references/blog.png, y≈140–190
 * at 1440px). Plain links + a GET form — no client JS needed, matching
 * this site's server-first pattern (TrekkingRoutesSection's Pagination
 * is the same shape of "real filtering via the URL, not client state").
 * See get-blog-categories.ts for why only 2 pills are real ("Adventure"
 * has no matching category, dropped rather than invented).
 */
export function BlogFilters({
  categories,
  activeCategoryId,
  search,
}: {
  categories: BlogCategory[];
  activeCategoryId?: string;
  search?: string;
}) {
  function buildHref(categoryId?: string) {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (search) params.set("search", search);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  const pillClassName = (active: boolean) =>
    cn(
      "shrink-0 rounded-pill px-4 py-2 font-poppins text-[14px] leading-[22.4px] font-medium transition-colors",
      active
        ? "bg-secondary-500 text-brand-neutral-000"
        : "bg-brand-neutral-200 text-brand-neutral-800 hover:bg-brand-neutral-300",
    );

  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Filter posts by category" className="flex flex-wrap items-center gap-2">
        <Link href={buildHref(undefined)} className={pillClassName(!activeCategoryId)}>
          All Posts
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={buildHref(category.id)}
            className={pillClassName(activeCategoryId === category.id)}
          >
            {category.title}
          </Link>
        ))}
      </nav>

      <form action="/blog" method="GET" className="flex w-full max-w-xs items-center gap-2">
        {activeCategoryId ? <input type="hidden" name="category" value={activeCategoryId} /> : null}
        <label className="sr-only" htmlFor="blog-search">
          Search articles
        </label>
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-brand-neutral-600" />
          <input
            id="blog-search"
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search articles..."
            className="w-full rounded-pill border border-brand-neutral-300 bg-brand-neutral-000 py-2.5 pr-4 pl-11 font-poppins text-[14px] leading-[22.4px] text-brand-neutral-900 placeholder:text-brand-neutral-600 focus:border-primary-500 focus:outline-none"
          />
        </div>
      </form>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
