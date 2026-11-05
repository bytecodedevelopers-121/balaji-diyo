import Link from "next/link";
import { FillImage } from "@/components/ui/FillImage";
import { blogAuthorName, blogExcerpt, formatBlogDate } from "../lib/format";
import type { BlogPost } from "../types/blog.types";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16l-1 4z" strokeLinejoin="round" />
    </svg>
  );
}

/** Date and author line used on blog cards and the featured post. */
export function BlogMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-brand-neutral-800">
      <span className="flex items-center gap-1.5">
        <CalendarIcon />
        {formatBlogDate(post.blogDate)}
      </span>
      <span className="flex items-center gap-1.5">
        <PenIcon />
        By {blogAuthorName(post)}
      </span>
    </div>
  );
}

/**
 * Blog card: title, meta and photo. On hover (or keyboard focus) a white panel
 * covers the photo with a short excerpt and an "Explore More" button.
 */
export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[4px] border border-brand-neutral-300 bg-white transition-colors hover:border-primary-200 focus-visible:border-primary-500"
    >
      <div className="px-7 pt-7 pb-5">
        <h3 className="text-[22px] leading-snug font-medium text-brand-neutral-1000">{post.title}</h3>
        <div className="mt-4">
          <BlogMeta post={post} />
        </div>
      </div>

      <div className="relative mt-auto aspect-[4/3] w-full border-t border-transparent bg-brand-neutral-200 group-hover:border-brand-neutral-300">
        <FillImage
          src={post.imageUrl}
          alt={post.title}
          className="absolute inset-0 size-full object-cover"
          sizes="(min-width:1024px) 380px, (min-width:768px) 50vw, 100vw"
        />
        <div className="absolute inset-0 flex flex-col justify-center gap-6 bg-white px-7 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <p className="text-[15px] leading-[1.9] font-medium text-brand-neutral-800">{blogExcerpt(post, 170)}</p>
          <span className="inline-flex w-fit items-center gap-2 rounded-pill border border-primary-500 px-5 py-2.5 text-[14px] text-brand-neutral-1000">
            Explore More <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
