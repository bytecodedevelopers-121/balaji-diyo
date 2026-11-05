import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CmsProse } from "@/components/ui/CmsProse";
import { CMS_ARTICLE_CLASSES } from "@/components/ui/cms-article-classes";
import { FillImage } from "@/components/ui/FillImage";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { getBlogBySlug } from "@/features/blogs/api/get-blog-by-slug";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import { BlogCard } from "@/features/blogs/components/BlogCard";
import { BlogTableOfContents } from "@/features/blogs/components/BlogTableOfContents";
import { ShareButton } from "@/features/blogs/components/ShareButton";
import { blogAuthorName, blogExcerpt, formatBlogDateLong } from "@/features/blogs/lib/format";
import { buildToc } from "@/features/blogs/lib/toc";
import type { BlogPost } from "@/features/blogs/types/blog.types";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import { getSiteSettings } from "@/features/site-settings/api/get-site-settings";
import { toTelHref } from "@/features/site-settings/lib/to-tel-href";
import { buildMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return buildMetadata({ title: "Page Not Found", path: `/blog/${slug}`, noIndex: true });
  return buildMetadata({
    title: post.title,
    description: blogExcerpt(post, 160),
    path: `/blog/${slug}`,
    image: post.imageUrl ?? undefined,
  });
}

function NeighbourLink({ post, direction }: { post: BlogPost; direction: "previous" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link href={`/blog/${post.slug}`} className={`flex items-center gap-4 ${isNext ? "flex-row-reverse text-right" : ""}`}>
      <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-[4px] bg-brand-neutral-200">
        <FillImage src={post.imageUrl} alt="" className="absolute inset-0 size-full object-cover" sizes="64px" />
      </span>
      <span>
        <span className="block text-[11px] tracking-wide text-brand-neutral-700 uppercase">
          {isNext ? "Next post →" : "← Previous post"}
        </span>
        <span className="mt-1 block text-[14px] leading-snug text-brand-neutral-1000">{post.title}</span>
      </span>
    </Link>
  );
}

/** A single Nepal Travel Blog post: hero photo, author row, body with a table of contents, help box, post navigation and latest posts. */
export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const [recent, settings] = await Promise.all([
    getBlogs({ perPage: 50 }).then((result) => result.items).catch(() => [] as BlogPost[]),
    getSiteSettings(),
  ]);

  const index = recent.findIndex((item) => item.id === post.id);
  // The list is newest first, so the older post sits after this one.
  const previous = index >= 0 ? recent[index + 1] : undefined;
  const next = index > 0 ? recent[index - 1] : undefined;
  const latest = recent.filter((item) => item.id !== post.id).slice(0, 3);

  const { html, toc } = buildToc(normalizeCmsHtml(post.content));
  const author = blogAuthorName(post);
  const phoneHref = toTelHref(settings.mobile);
  const whatsappHref = `https://wa.me/${settings.mobile.replace(/[^\d]/g, "")}`;

  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1170px]">
          {post.imageUrl ? (
            <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[10px] bg-brand-neutral-200">
              <FillImage
                src={post.imageUrl}
                alt={post.title}
                className="absolute inset-0 size-full object-cover"
                sizes="(min-width:1170px) 1170px, 100vw"
                preload
              />
            </div>
          ) : null}

          <div className="mx-auto mt-5 w-full max-w-[1035px]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blog" },
                ...(post.categories[0] ? [{ label: post.categories[0].title }] : []),
                { label: post.title },
              ]}
            />
            <h1 className="mt-6 font-display text-[clamp(28px,4.6vw,40px)] leading-tight font-bold text-brand-neutral-1000">
              {post.title}
            </h1>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={author} className="!size-14" />
                <div>
                  <p className="text-[20px] font-medium text-primary-500">{author}</p>
                  <p className="text-[13px] font-medium text-brand-neutral-900">Updated on {formatBlogDateLong(post.blogDate)}</p>
                </div>
              </div>
              <ShareButton title={post.title} />
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <CmsProse html={html} className={CMS_ARTICLE_CLASSES} />

                <div className="mt-10 rounded-[4px] bg-[#fdf1e8] px-6 py-8 text-center shadow-card-soft">
                  <p className="text-[14px] text-brand-neutral-1000">Need Help? Call Us</p>
                  <p className="mt-1 text-[15px] font-medium text-primary-500">
                    <a href={phoneHref} className="hover:underline">
                      {settings.mobile}
                    </a>{" "}
                    or{" "}
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:underline">
                      Chat with us on WhatsApp
                    </a>
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex rounded-[4px] bg-primary-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Ask a Question
                  </Link>
                </div>

                {previous || next ? (
                  <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
                    {previous ? <NeighbourLink post={previous} direction="previous" /> : <span />}
                    {next ? <NeighbourLink post={next} direction="next" /> : null}
                  </div>
                ) : null}
              </div>

              <aside>
                <BlogTableOfContents toc={toc} />
              </aside>
            </div>
          </div>
        </div>
      </section>

      {latest.length > 0 ? (
        <section className="bg-[#fcefe3] px-4 py-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className="mx-auto w-full max-w-[1035px]">
            <h2 className="font-display text-[clamp(24px,3.4vw,30px)] font-bold text-brand-neutral-1000">Latest Travel Blogs</h2>
            <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              {latest.map((item) => (
                <li key={item.id}>
                  <BlogCard post={item} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      <CtaSection />
    </>
  );
}
