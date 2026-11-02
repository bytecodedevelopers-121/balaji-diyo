import { Fragment } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CmsProse } from "@/components/ui/CmsProse";
import { TableOfContentsNav } from "@/components/ui/TableOfContentsNav";
import { ContactForm } from "@/components/sections/ContactSection/ContactForm";
import { splitCmsSections } from "@/features/pages/lib/split-cms-sections";
import { normalizeCmsHtml } from "@/features/pages/lib/normalize-cms-html";
import { cleanBlogContent } from "@/features/blogs/lib/clean-blog-content";
import { estimateReadTimeMinutes } from "@/features/blogs/lib/read-time";
import { extractFaqBlock } from "@/features/blogs/lib/extract-faq-block";
import { getBlogs } from "@/features/blogs/api/get-blogs";
import type { BlogPost } from "@/features/blogs/types/blog.types";
import { BlogCard } from "@/components/sections/BlogListingSection/BlogCard";
import { formatBlogDate } from "@/features/blogs/lib/format-blog-date";
import { ShareButtons } from "./ShareButtons";
import { BlogFaqAccordion } from "./BlogFaqAccordion";
import { TextToSpeechPlayer } from "@/components/ui/TextToSpeechPlayer";
import { decodeHtmlEntities } from "@/lib/html";
import { FillImage } from "@/components/ui/FillImage";

/**
 * A single blog post's own page — design-references/
 * "Travel Blogs - Individual.png". White content card(s) floating on a
 * light-grey page background (`#F5F5F5`, confirmed via this PNG's own
 * pixel colors — not another transparent-export-hole case like every
 * other page built from this Figma file this session; this one really
 * is grey, verified by sampling both edge and center pixels down the
 * full page length before assuming either way).
 *
 * Breadcrumb reads "Home > Blog > {title}", not the design's literal
 * "Home > Nepal > Trekking Routes in Nepal" — that's the same Figma
 * mockup copy-paste leftover BlogListingSection's own comment documents
 * (this exact wrong breadcrumb appears on both mockups).
 *
 * The audio control uses the shared browser-native text-to-speech
 * player. It reads the post title and CMS body, so it does not require
 * a pre-recorded audio field on Blog. The embedded package summary card
 * and filterable gear-checklist widget are not built (see
 * clean-blog-content.ts for the unresolved legacy shortcode; the real
 * gear content is an unstructured `<ul>`).
 *
 * Desktop sidebar holds only the sticky `TableOfContentsNav` (scrolls
 * internally when long, follows the active section). The "Ask Question"
 * form sits after the article at every breakpoint — an earlier design
 * stacked it under the ToC in one shared sticky block, but that block
 * grew taller than the viewport and scrolled the ToC away near the end
 * of the article.
 *
 * The floating WhatsApp button this section used to mount itself
 * (inside the hero image `<div>`, though its `fixed` positioning meant
 * that nesting was never functionally meaningful) is now global (root
 * layout, 2026-08-27) — every page gets it, not just this one, so
 * it's no longer rendered here.
 */
export async function BlogDetailSection({ post }: { post: BlogPost }) {
  // Migrated blog bodies still carry the old CMS's absolute image URLs
  // (e.g. https://fis-api.boundlessadventure.com/media/attachments/...),
  // a dead host — same gap normalize-cms-html.ts already documents and
  // fixes for CMS Pages; blog content just never got routed through it.
  const cleanedContent = cleanBlogContent(normalizeCmsHtml(post.content));
  const { intro, sections } = splitCmsSections(cleanedContent);
  const tocItems = sections.map((section) => ({ id: section.id, heading: section.heading }));

  const author = post.authors[0];
  const category = post.categories[0];
  const readTime = estimateReadTimeMinutes(post.content);
  const narration = `${post.title}. ${htmlToPlainText(cleanedContent)}`;

  const related = await getRelatedPosts(post);

  return (
    <>
      {post.imageUrl ? (
        <div className="relative h-[280px] w-full overflow-hidden bg-brand-neutral-1000 sm:h-[360px] lg:h-[420px]">
          {post.imageIsWideBanner ? (
            /*
              Real SINGLE_BANNER photo (e.g. 1650×650) — already sized
              and shaped for this fixed-height, full-width strip, so a
              plain full-bleed `object-cover` reproduces the legacy
              site's own rendering of the same photo: sharp, edge-to-
              edge, only a mild/unnoticeable crop. This is the ~5-post
              case; see the `else` branch for the far more common
              small-thumbnail one, where `object-cover` looks bad.
            */
            <FillImage
              src={post.imageUrl}
              alt={post.title}
              className="absolute inset-0 size-full object-cover" sizes="100vw" />
          ) : (
            <>
              {/*
                Two-layer "blurred backdrop" treatment, not a plain
                `object-cover`/`-contain` on one `<img>` — this is a
                FEATURED-only post: a small legacy thumbnail (as little
                as ~436×369), never a real wide banner. Against this
                fixed-height full-width strip (roughly 4.5:1 at desktop
                widths):
                - Plain `object-cover` scales a ~436×369 source up ~4.4x
                  to cover the width, then crops to a ~26%-height center
                  sliver — the pixelated, zoomed-in look this replaces.
                - Plain `object-contain` alone leaves the flat
                  `bg-brand-neutral-1000` showing through as bars on
                  both sides (the front layer's own scale here is only
                  ~1.1-1.2x).
                Splitting into a blurred, darkened full-bleed copy
                (behind) + the same photo shown whole at contain's own
                mild ~1.1-1.2x scale (front, so it never needs the crop
                `-cover` forces or the pixelation `-cover`'s 4.4x
                upscale causes) gets both: a sharp, uncropped subject
                and a background that's colour-matched to the photo
                instead of a flat bar. Doesn't fix the real underlying
                issue (the source is genuinely low-res) — that needs an
                admin to upload a proper wide cover photo per post, same
                as the SINGLE_BANNER posts above already have.
              */}
              <FillImage
                src={post.imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full scale-110 object-cover object-center blur-xl brightness-50" sizes="100vw" />
              <FillImage
                src={post.imageUrl}
                alt={post.title}
                className="absolute inset-0 size-full object-contain" sizes="100vw" />
            </>
          )}
        </div>
      ) : null}

      <section className="bg-brand-neutral-200 py-6">
        <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-6 md:px-16">
          <div className="rounded-2xl bg-brand-neutral-000 p-6 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blog" },
                { label: post.title },
              ]}
            />
            <h1 className="mt-7 max-w-[1120px] font-poppins text-[28px] leading-[1.55] font-bold text-brand-neutral-1000 sm:text-[32px] sm:leading-[1.6]">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <TextToSpeechPlayer
                text={narration}
                label={post.title}
              />

              <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4 lg:gap-x-12 xl:gap-x-16">
                {author ? (
                  <MetaField label="Written by" value={author.name} />
                ) : null}
                <MetaField label="Published" value={formatBlogDate(post.blogDate)} />
                <MetaField label="Read time" value={`${readTime} min${readTime === 1 ? "" : "s"}`} />
                {category ? <MetaField label="Category" value={category.title} /> : null}
              </div>
            </div>
          </div>

          {/*
            Below `lg`: ToC tabs, then content. At `lg` and up the ToC is
            a sticky sidebar beside the content column.
          */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {tocItems.length > 0 ? (
              // Stretched to the content column's full height so the
              // sticky ToC inside it has the whole article to pin across.
              // Only the ToC lives here — the "Ask Question" form sits
              // after the article instead, so nothing below the ToC can
              // be slid over by it.
              <div className="lg:flex lg:shrink-0 lg:self-stretch">
                <TableOfContentsNav items={tocItems} />
              </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <div className="rounded-2xl bg-brand-neutral-000 p-6">
                {intro ? <CmsProse html={intro} className="mb-8" /> : null}
                {sections.map((section) => {
                  // Most sections have no FAQ heading in them at all —
                  // `extractFaqBlock` returns `faq: null` and the
                  // original, unsplit `section.html` back as
                  // `beforeHtml`, so those render exactly as before.
                  // Only a section that really does contain a
                  // "FAQ"/"Frequently Asked Questions" heading gets the
                  // accordion swapped in for that portion.
                  const { beforeHtml, faq } = extractFaqBlock(section.html);
                  return (
                    <Fragment key={section.id}>
                      {beforeHtml ? <CmsProse html={beforeHtml} className="mb-8" /> : null}
                      {faq ? (
                        <div className="mb-8">
                          <BlogFaqAccordion faq={faq} />
                        </div>
                      ) : null}
                    </Fragment>
                  );
                })}
              </div>

              <ContactForm
                heading="Ask Question"
                type="blog"
                maxWidthClassName="max-w-full"
                layout="one-column"
              />

              <ShareButtons title={post.title} path={`/blog/${post.slug}`} />
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="bg-brand-neutral-200 pb-16">
          <div className="mx-auto w-full max-w-360 px-6 md:px-16">
            <h2 className="font-poppins text-[24px] leading-[1.3] font-bold text-brand-neutral-1000">
              More Stories
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} variant="row" />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

async function getRelatedPosts(post: BlogPost): Promise<BlogPost[]> {
  const categoryId = post.categories[0]?.id;
  const page = await getBlogs({ perPage: 4, categoryId });
  return page.items.filter((item) => item.id !== post.id).slice(0, 3);
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-600">
        {label}
      </span>
      <span className="font-poppins text-[16px] leading-[25.6px] font-medium whitespace-nowrap text-brand-neutral-900">
        {value}
      </span>
    </div>
  );
}

/** Converts trusted CMS HTML into the plain text consumed by speech synthesis. */
function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}
