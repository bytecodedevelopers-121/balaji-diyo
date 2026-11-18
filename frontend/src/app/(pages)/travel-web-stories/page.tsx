import type { Metadata } from "next";
import Link from "next/link";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { getWebStories } from "@/features/site-content/api";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPageSections, resolveSection } from "@/features/page-content/api";
import { WEBSTORIES_PAGE_DEFAULTS } from "@/features/page-content/webstories-defaults";

export async function generateMetadata(): Promise<Metadata> {
  const { content } = resolveSection(await getPageSections("webstories"), "seo", WEBSTORIES_PAGE_DEFAULTS.seo);
  return buildMetadata({ title: content.title, description: content.description, path: "/travel-web-stories" });
}

/** Nepal Travel Web Stories: wide hero photo, breadcrumb, title and a grid of story cards. */
export default async function TravelWebStoriesPage() {
  const [stories, sections] = await Promise.all([getWebStories(), getPageSections("webstories")]);
  // Hero photo and heading are editable in the admin (Page Content → Travel Web Stories).
  const { content: hero } = resolveSection(sections, "hero", WEBSTORIES_PAGE_DEFAULTS.hero);
  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1170px]">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[10px]">
            <FillImage
              src={hero.image}
              alt={hero.imageAlt}
              className="absolute inset-0 size-full object-cover"
              sizes="(min-width:1170px) 1170px, 100vw"
              preload
            />
          </div>

          <div className="mx-auto mt-5 w-full max-w-[1035px]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[{ label: "Home", href: "/" }, { label: hero.title }]}
            />
            <h1 className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
              {hero.title}
            </h1>

            <ul className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">
              {stories.map((story) => (
                <li key={story.slug}>
                  <Link
                    href={`/web-stories/${story.slug}`}
                    className="group relative block aspect-[3/4] overflow-hidden rounded-[10px] bg-brand-neutral-200"
                  >
                    <FillImage
                      src={story.cover}
                      alt={story.title}
                      className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width:1024px) 25vw, (min-width:520px) 50vw, 100vw"
                    />
                    <span className="absolute top-4 left-4 rounded-pill bg-white px-3 py-1 text-[12px] font-medium text-brand-neutral-1000">
                      {story.slides.length} Stories
                    </span>
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pt-12 pb-4 text-[16px] leading-snug font-semibold text-white">
                      {story.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
