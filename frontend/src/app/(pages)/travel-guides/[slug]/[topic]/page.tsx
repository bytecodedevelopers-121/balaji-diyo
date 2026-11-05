import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { getGuideTopic, getTravelGuide, TRAVEL_GUIDES, type GuideSection } from "@/config/travel-guides";
import { buildMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string; topic: string }>;
}

export function generateStaticParams() {
  return TRAVEL_GUIDES.flatMap((guide) => guide.topics.map((topic) => ({ slug: guide.slug, topic: topic.slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, topic: topicSlug } = await params;
  const guide = getTravelGuide(slug);
  const topic = guide ? getGuideTopic(guide, topicSlug) : undefined;
  if (!guide || !topic) {
    return buildMetadata({ title: "Page Not Found", path: `/travel-guides/${slug}/${topicSlug}`, noIndex: true });
  }
  return buildMetadata({
    title: topic.title,
    description: topic.summary,
    path: `/travel-guides/${guide.slug}/${topic.slug}`,
    image: topic.image,
  });
}

/** Renders `**bold**` runs (see `GuideSection`) as <strong>. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) => (
        <Fragment key={i}>{i % 2 === 1 ? <strong className="text-brand-neutral-1000">{part}</strong> : part}</Fragment>
      ))}
    </>
  );
}

function Section({ section }: { section: GuideSection }) {
  const paragraphs = section.paragraphs ?? (section.body ? [section.body] : []);
  return (
    <div className="mt-6">
      {section.heading ? <h2 className="text-[20px] font-semibold text-brand-neutral-1000">{section.heading}</h2> : null}
      {paragraphs.map((text) => (
        <p key={text} className="mt-3 text-[14px] leading-[1.85] text-brand-neutral-800">
          <RichText text={text} />
        </p>
      ))}
      {section.bullets ? (
        <ul className="mt-3 flex flex-col gap-2.5">
          {section.bullets.map((item) => (
            <li
              key={item}
              className="relative pl-9 text-[14px] leading-[1.7] text-brand-neutral-800 before:absolute before:top-0.5 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-['']"
            >
              <RichText text={item} />
            </li>
          ))}
        </ul>
      ) : null}
      {section.note ? (
        <p className="mt-4 rounded-[6px] bg-[#fdf1e8] px-5 py-4 text-[14px] text-brand-neutral-900">
          <RichText text={section.note} />
        </p>
      ) : null}
    </div>
  );
}

/** A single guide topic (visa, insurance, permits, ...) for one country. */
export default async function TravelGuideTopicPage({ params }: PageProps) {
  const { slug, topic: topicSlug } = await params;
  const guide = getTravelGuide(slug);
  const topic = guide ? getGuideTopic(guide, topicSlug) : undefined;
  if (!guide || !topic) notFound();

  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1100px]">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[10px] shadow-[0_10px_30px_rgba(6,74,112,0.2)]">
            <FillImage
              src={topic.image}
              alt={topic.title}
              className="absolute inset-0 size-full object-cover"
              sizes="(min-width:1100px) 1100px, 100vw"
              preload
            />
          </div>

          <div className="mx-auto mt-5 w-full max-w-[860px]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[
                { label: "Home", href: "/" },
                { label: "Travel Guides", href: "/travel-guides" },
                { label: guide.title, href: `/travel-guides/${guide.slug}` },
                { label: topic.title },
              ]}
            />
            <h1 className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
              {topic.title}
            </h1>
            <div className="mt-5 space-y-4 text-[14px] leading-[1.85] text-brand-neutral-800">
              {(topic.intro ?? [topic.summary]).map((text) => (
                <p key={text}>
                  <RichText text={text} />
                </p>
              ))}
            </div>

            {topic.sections.map((section, i) => (
              <Section key={section.heading ?? i} section={section} />
            ))}

            <Link
              href={`/travel-guides/${guide.slug}`}
              className="mt-10 inline-flex rounded-pill border border-logo-navy px-6 py-3 font-medium text-logo-navy transition-opacity hover:opacity-80"
            >
              Back to {guide.title}
            </Link>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
