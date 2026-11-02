import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/features/blogs/types/blog.types";
import { formatBlogDate } from "@/features/blogs/lib/format-blog-date";
import { FillImage } from "@/components/ui/FillImage";

/**
 * A blog card, in two treatments matched to where each design shows it:
 * - `/blog`'s own "More Stories" grid (design-references/blog.png,
 *   y≈950–1400 at 1440px), `variant="grid"` (the default): per Figma's
 *   inspect panel for this card frame (424×320 at 1440px, one of 3 grid
 *   columns — width kept fluid via the grid rather than hardcoded, only
 *   height is ratio-locked) — 16px corner radius. Full-bleed image, same
 *   as `variant="row"` below — an earlier pass took the frame's own
 *   `padding: 20px` (from that same inspect panel) as an inset around
 *   the photo, leaving the `bg-brand-neutral-100` frame visible as a
 *   border, but that read turned out wrong: removed, image now fills
 *   the frame edge-to-edge and `overflow-hidden` + `rounded-2xl` on the
 *   frame alone clips it, no separate radius needed on the `<img>`.
 *   Whole-card frame is 424×429 with a 12px gap between the image and
 *   the title/date/author content below it — already what `gap-3`
 *   (12px) on the outer `<Link>` gives, no change needed there.
 * - A post's own "More Stories" row (design-references/
 *   "Travel Blogs - Individual.png", y≈3450–3900 at 1440px),
 *   `variant="row"`: full-bleed image (no Figma spec given for this
 *   one, left as it was).
 * Title shows below the image in both.
 *
 * Image itself is `object-contain` (not `object-cover`/full-bleed as
 * described above), so the whole photo is always visible instead of
 * being cropped to fill the frame — the frame's `bg-brand-neutral-100`
 * shows through as letterboxing on any photo that isn't exactly the
 * frame's own aspect ratio.
 */
export function BlogCard({
  post,
  variant = "grid",
}: {
  post: BlogPost;
  variant?: "grid" | "row";
}) {
  if (!post.slug) return null;
  const author = post.authors[0];

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-3">
      <div
        className={cn(
          "relative w-full overflow-hidden bg-brand-neutral-100",
          variant === "row" ? "aspect-[4/3] rounded-card" : "aspect-[424/320] rounded-2xl",
        )}
      >
        {post.imageUrl ? (
          <FillImage
            src={post.imageUrl}
            alt={post.title}
            className="size-full object-contain transition-transform duration-300 group-hover:scale-105" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
        ) : (
          <div className="flex size-full items-center justify-center font-poppins text-body-m text-brand-neutral-600">
            {post.title}
          </div>
        )}
      </div>
      {/* `line-clamp-2` just guards against a runaway-long title blowing
          the card out past 2 lines — it doesn't reserve space for a
          2nd line that isn't there. A 1-line title's box is only as
          tall as 1 line, so the `gap-3` (12px) above and below it stays
          an honest 12px instead of ballooning with unused reserved
          space. (An earlier pass force-reserved 2-line height here to
          line up the date/author row across a grid row when neighboring
          titles wrapped differently — reverted since it broke this
          12px-gap structure, which is what was actually asked for.) */}
      <p className="line-clamp-2 font-poppins text-[16px] leading-[1.4] font-bold text-brand-neutral-1000">
        {post.title}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-pill border border-brand-neutral-300 px-3 py-1 font-poppins text-[14px] leading-[22.4px] font-medium text-secondary-500">
          {formatBlogDate(post.blogDate)}
        </span>
        {author ? (
          <span className="flex items-center gap-1 font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-700">
            <PersonIcon />
            {author.name}
          </span>
        ) : null}
      </div>
    </Link>
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
