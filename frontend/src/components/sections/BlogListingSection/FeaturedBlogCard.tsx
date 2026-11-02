import Link from "next/link";
import type { BlogPost } from "@/features/blogs/types/blog.types";
import { formatBlogDate } from "@/features/blogs/lib/format-blog-date";
import { cn } from "@/lib/utils";
import { FillImage } from "@/components/ui/FillImage";

/**
 * One of the 2 large featured cards at the top of /blog (design-
 * references/blog.png, y≈260–900 at 1440px) — photo (see `object-contain`
 * note below), title overlaid bottom-left on the gradient scrim, a
 * small circular "read more" arrow top-right. The 2 most recent posts
 * (list is
 * `blogDate desc` server-side already — blog.repository.ts's `findMany`),
 * not a separate "featured" flag (Blog has no such field).
 *
 * Figma gives each card as its own fixed frame at 1440px — 800×510 for
 * the first, 500×510 for the second, 16px corner radius, 20px padding,
 * 10px gap between the title and the meta row below it. The pair sits
 * in an `8fr 5fr` grid (see BlogListingSection, 800:500 reduced) so the
 * first card reads noticeably wider than the second, per the design —
 * but both stay the *same height*. Rather than hardcode 510px (only
 * correct at exactly 1440px), only this (the wide, first) card carries
 * an `aspect-[800/510]` ratio; the caller passes `className` to switch
 * the second card to `sm:aspect-auto sm:h-full` so it just stretches to
 * match the row height the first card's aspect ratio establishes at
 * whatever width it's actually rendered (default grid
 * `align-items: stretch`) — reproducing the same 800:500:510 proportions
 * responsively instead of only at the design's exact breakpoint. Both
 * fall back to the same aspect ratio when stacked to one column on
 * mobile.
 *
 * Photo is `object-contain`, not `object-cover` — full image, never
 * cropped, even though that means a photo whose aspect ratio doesn't
 * match the 800:510/500:510 frame letterboxes instead of filling it
 * edge-to-edge. The letterbox gap reads fine here because the frame's
 * own `bg-brand-neutral-1000` (below, otherwise the no-photo fallback)
 * sits behind it and the gradient scrim + title overlay still work
 * against that dark fill.
 */
export function FeaturedBlogCard({
  post,
  className,
}: {
  post: BlogPost;
  className?: string;
}) {
  if (!post.slug) return null;
  const author = post.authors[0];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex aspect-[800/510] w-full flex-col justify-end overflow-hidden rounded-2xl bg-brand-neutral-1000",
        className,
      )}
    >
      {post.imageUrl ? (
        <FillImage
          src={post.imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-contain transition-transform duration-300 group-hover:scale-105" sizes="(min-width:1024px) 50vw, 100vw" />
      ) : null}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "var(--gradient-photo-scrim)" }}
        aria-hidden="true"
      />

      <span
        aria-hidden="true"
        className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-brand-neutral-000 text-brand-neutral-1000 shadow-card-soft transition-transform group-hover:scale-105"
      >
        <ArrowUpRightIcon />
      </span>

      <div className="relative z-10 flex flex-col gap-[10px] p-5 text-brand-neutral-000">
        <p className="font-poppins text-[22px] leading-[1.3] font-bold">{post.title}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-pill bg-brand-neutral-000 px-3 py-1 font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-1000">
            {formatBlogDate(post.blogDate)}
          </span>
          {author ? (
            <span className="flex items-center gap-1 font-poppins text-[14px] leading-[22.4px] font-medium">
              <PersonIcon />
              {author.name}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function ArrowUpRightIcon() {
  return (
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
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

function PersonIcon() {
  return (
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
