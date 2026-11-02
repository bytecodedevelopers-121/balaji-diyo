/**
 * "Stories & Guides From the Field" — transcribed from
 * design-references/homepage.png (y≈6220–6810 at 1440px). Plain/white
 * background (the black background read off the screenshot doesn't
 * exist in the real Figma file; corrected per direct confirmation —
 * see ServicesSection's comment for the same correction), left-aligned
 * heading + copy + "Read More" link, two post cards to the right.
 * Card overlay text stays white regardless, since it sits on each
 * photo's own gradient scrim, not the section background.
 *
 * "Read More" now uses next/link's `<Link>` (was a plain `<a>`) — "/blog"
 * became a real internal route this session, and ESLint's
 * no-html-link-for-pages rule started flagging the plain anchor once it
 * could see that page exists.
 *
 * **API-integrated 2026-08-20**: pulls the 2 most recent posts from
 * `GET /blogs` via `getBlogs()` — the same fetch `/blog`'s own
 * `BlogListingSection` uses, already sorted `blogDate desc`
 * server-side. Unlike Popular Trips/Testimonials, these cards *do* link
 * through — `/blog/[slug]` is a fully real, already-wired detail page,
 * not the still-static package detail page. Falls back to the original
 * 2 hardcoded cards only if the blog list ever comes back empty.
 *
 * **Carousel 2026-08-27**: the card row is now `BlogCarousel`, a Client
 * Component — see its own comment.
 */
import Link from "next/link";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import { formatBlogDate } from "@/features/blogs/lib/format-blog-date";
import { BlogCarousel } from "./BlogCarousel";

const FALLBACK_POSTS = [
  {
    slug: null,
    image: "/images/blog/ebc-fitness-level.jpg",
    title: "How to Choose the Right Everest Base Camp Trek for Your Fitness Level",
    date: "Jun 04, 2026",
    author: "Dambar Khadka",
  },
  {
    slug: null,
    image: "/images/blog/upper-mustang-crossing.jpg",
    title: "What Nobody Tells You About Crossing Into Upper Mustang",
    date: "Apr 21, 2026",
    author: "Dambar Khadka",
  },
];

export async function BlogSection() {
  const { items } = await getBlogs({ perPage: 2 });

  const posts =
    items.length > 0
      ? items.map((post) => ({
          slug: post.slug,
          image: post.imageUrl ?? "/images/blog/ebc-fitness-level.jpg",
          title: post.title,
          date: formatBlogDate(post.blogDate),
          author: post.authors[0]?.name ?? "Joyful Trekking Pvt. Ltd.",
        }))
      : FALLBACK_POSTS;

  // `py-[50px]`, was `py-16` then `py-14` — see AboutSection.tsx's own
  // comment (2026-09-03, two passes).
  return (
    <section className="py-[2px] sm:py-[25px]">
      <div className="mx-auto w-full max-w-[1440px] md:px-16">
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_2fr] xl:items-center">
          <div className="px-6 md:px-0">
            <p className="text-body-l font-medium text-primary-500">Blog</p>
            <h2 className="mt-2 font-display text-raleway-4xl font-medium text-brand-neutral-1000 sm:text-display-section">
              Stories &amp; Guides From the Field
            </h2>
            <p className="mt-4 text-body-l text-brand-neutral-800">
              Trip tips, trail stories, and everything we&apos;ve learned
              from twenty-five years in the Himalayas.
            </p>
            <p className="mt-4 text-body-l text-brand-neutral-800">
              Guides, stories, and honest advice from the people who&apos;ve
              actually walked these trails.
            </p>
            <Link
              href="/blog"
              className="mt-6 flex items-center gap-2 text-body-l font-medium text-primary-500 hover:opacity-80"
            >
              Read More
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <BlogCarousel posts={posts} />
        </div>
      </div>
    </section>
  );
}
