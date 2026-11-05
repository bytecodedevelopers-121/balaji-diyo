import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import { BlogCard } from "@/features/blogs/components/BlogCard";

/**
 * "Travel News & Articles" — the three latest blog posts as the same
 * hover-excerpt cards the blog page uses. Real posts come from `GET /blogs`
 * (with the built-in samples while the database has none, see `getBlogs`);
 * the section is hidden when there is nothing to show.
 */
export async function TravelNewsSection() {
  const { items } = await getBlogs({ perPage: 3 }).catch(() => ({ items: [] }));
  if (items.length === 0) return null;

  return (
    <section className="bg-site-bg px-4 py-12 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto w-full max-w-[1280px]">
        <div suppressHydrationWarning className="reveal mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy">
              <Mountain aria-hidden="true" className="size-4" />
              Our Latest Blogs
            </p>
            <h2 className="font-display text-[clamp(22px,5vw,32px)] leading-tight font-bold text-brand-neutral-1000">
              Travel News &amp; Articles
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden shrink-0 items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy transition-colors hover:bg-logo-sun sm:inline-flex"
          >
            Read All Blogs
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {items.map((post) => (
            <li key={post.id}>
              <BlogCard post={post} />
            </li>
          ))}
        </ul>

        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy sm:hidden"
        >
          Read All Blogs
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
