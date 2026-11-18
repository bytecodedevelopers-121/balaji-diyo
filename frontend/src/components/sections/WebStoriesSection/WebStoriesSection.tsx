import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import { FillImage } from "@/components/ui/FillImage";
import { HOME_DEFAULTS, type WebStoriesContent } from "@/features/page-content/home-defaults";
import { getWebStories } from "@/features/site-content/api";

/**
 * "Travel Web Stories" — tall story tiles from the `/web-stories` API, each
 * opening its full-screen story at `/web-stories/<slug>`; "View All Stories"
 * goes to the `/travel-web-stories` listing.
 */
export async function WebStoriesSection({ content = HOME_DEFAULTS.webStories }: { content?: WebStoriesContent }) {
  const stories = (await getWebStories()).slice(0, content.maxCards);
  if (stories.length === 0) return null;

  return (
    <section className="bg-site-bg px-4 pt-6 pb-12 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto w-full max-w-[1280px]">
        <div suppressHydrationWarning className="reveal mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-body-s font-medium text-logo-navy">
              <Mountain aria-hidden="true" className="size-4" />
              {content.eyebrow}
            </p>
            <h2 className="font-display text-[clamp(22px,5vw,32px)] leading-tight font-bold text-brand-neutral-1000">
              {content.title}
            </h2>
          </div>
          <Link
            href={content.buttonHref}
            className="inline-flex shrink-0 items-center gap-2 rounded-pill border border-logo-sun px-5 py-2 text-body-s font-semibold text-logo-navy transition-colors hover:bg-logo-sun"
          >
            {content.buttonLabel}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stories.map((story) => (
            <li key={story.slug}>
              <Link
                href={`/web-stories/${story.slug}`}
                className="group relative block aspect-[9/16] overflow-hidden rounded-[4px] bg-logo-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy sm:aspect-[5/7]"
              >
                <FillImage
                  src={story.cover}
                  alt=""
                  aria-hidden="true"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(min-width: 640px) 25vw, 50vw"
                />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                <span className="absolute top-3 left-3 rounded-pill bg-brand-neutral-000 px-2.5 py-1 text-[11px] font-semibold text-brand-neutral-900">
                  {story.slides.length} Stories
                </span>
                <span className="absolute right-3 bottom-4 left-3 text-[14px] leading-snug font-bold text-brand-neutral-000">
                  {story.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
