import Link from "next/link";
import { ArrowRight, CalendarDays, Mountain, PenLine } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import { formatBlogDate } from "@/features/blogs/lib/format-blog-date";

/**
 * "Travel News & Articles" — the three latest blog posts as cards (title,
 * date, author, then photo). Real posts come from `GET /blogs`; when there
 * are none, development shows sample posts (never in production) and
 * production hides the section.
 */
interface Post {
  id: string;
  href: string;
  title: string;
  date: string;
  author: string;
  image: string;
}

const SAMPLE_POSTS: Post[] = [
  { id: "p1", href: "/blog", title: "Ghorepani Poon Hill Trek in April: Weather & Best Dates", date: "Oct 21, 2026", author: "Arjun", image: "/images/blog/ebc-fitness-level.jpg" },
  { id: "p2", href: "/blog", title: "Ghorepani Poon Hill Trek in March", date: "Oct 16, 2026", author: "Arjun", image: "/images/blog/upper-mustang-crossing.jpg" },
  { id: "p3", href: "/blog", title: "Annapurna Circuit Trek Distance: KM, Miles & Route", date: "Oct 04, 2026", author: "Arjun", image: "/images/journey/trek.jpg" },
];

export async function TravelNewsSection() {
  const { items } = await getBlogs({ perPage: 3 }).catch(() => ({ items: [] }));
  const posts: Post[] =
    items.length > 0
      ? items.map((post) => ({
          id: post.id,
          href: `/blog/${post.slug}`,
          title: post.title,
          date: formatBlogDate(post.blogDate),
          author: post.authors[0]?.name ?? "Joyful Trekking Pvt. Ltd.",
          image: post.imageUrl ?? "/images/blog/ebc-fitness-level.jpg",
        }))
      : process.env.NODE_ENV !== "production"
        ? SAMPLE_POSTS
        : [];
  if (posts.length === 0) return null;

  return (
    <section className="bg-[#e6f3fa] px-4 py-12 min-[768px]:px-10 min-[1120px]:px-[72px]">
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
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={post.href}
                className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-[#c9dcec] bg-brand-neutral-000 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(6,74,112,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
              >
                <span className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-4">
                  <span className="text-[17px] leading-snug font-medium text-brand-neutral-1000 group-hover:text-logo-navy">
                    {post.title}
                  </span>
                  <span className="mt-auto flex items-center gap-5 text-[12px] text-brand-neutral-800">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="size-4 text-[#d98a00]" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <PenLine aria-hidden="true" className="size-4 text-[#d98a00]" />
                      By {post.author}
                    </span>
                  </span>
                </span>
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-brand-neutral-200">
                  <FillImage
                    src={post.image}
                    alt=""
                    aria-hidden="true"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                </span>
              </Link>
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
