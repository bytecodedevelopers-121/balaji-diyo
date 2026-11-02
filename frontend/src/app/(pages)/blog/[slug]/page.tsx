import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetailSection } from "@/components/sections/BlogDetailSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import { getBlogBySlug } from "@/features/blogs/api/get-blog-by-slug";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateStaticParams() {
  // Same "over-fetch a page once for its slugs" shortcut as /team/[slug]
  // and /map/[slug]'s own generateStaticParams,
  // but smaller (30, not "all 237 real posts") — this fetch pulls each
  // post's full body along with its slug (getBlogs has no
  // slugs-only/fields projection), and 100 full posts came in at ~3MB,
  // over Next's 2MB data-cache-entry limit (hit and confirmed via a real
  // build: "items over 2MB can not be cached"). 30 pre-renders the most
  // recent posts (`blogDate desc` server-side already); the long tail
  // still renders correctly on first request via the `revalidate: 900`
  // on getBlogBySlug, just without a build-time page for it.
  const { items: posts } = await getBlogs({ page: 1, perPage: 30 });
  return posts.filter((post) => post.slug).map((post) => ({ slug: post.slug as string }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getBlogBySlug(slug);

  if (!post) {
    return buildMetadata({
      title: "Post Not Found",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: post.title,
    description:
      post.abstract?.replace(/<[^>]+>/g, " ").trim().slice(0, 200) || undefined,
    path: `/blog/${post.slug}`,
    // Not `post.imageUrl`: buildMetadata's `image` expects a path under
    // this frontend's own /public (absoluteUrl prepends NEXT_PUBLIC_SITE_URL
    // unconditionally — see canonical.ts), but the post's cover photo is
    // already an absolute URL on the *backend's* own origin. Passing it
    // through would double-prefix into a broken URL. Falls back to the
    // site's default OG image instead of a broken one.
  });
}

/**
 * Transcribed from design-references/"Travel Blogs - Individual.png" —
 * see BlogDetailSection for the section itself; this file is just
 * data-fetching + the same 404 handling /team/[slug]/page.tsx and
 * /map/[slug]/page.tsx already established
 * (real HTTP status caveat noted in both of those files' own comments —
 * still applies here, not repeated).
 */
export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <BlogDetailSection post={post} />
      <CtaSection />
    </>
  );
}
