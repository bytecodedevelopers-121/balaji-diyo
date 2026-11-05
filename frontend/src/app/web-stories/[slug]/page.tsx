import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWebStory, WEB_STORIES } from "@/config/web-stories";
import { buildMetadata } from "@/lib/seo/metadata";
import { StoryViewer } from "./StoryViewer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return WEB_STORIES.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getWebStory(slug);
  if (!story) return buildMetadata({ title: "Page Not Found", path: `/web-stories/${slug}`, noIndex: true });
  return buildMetadata({
    title: story.title,
    description: story.slides[0]?.caption,
    path: `/web-stories/${story.slug}`,
    image: story.cover,
  });
}

export default async function WebStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = getWebStory(slug);
  if (!story) notFound();
  return <StoryViewer story={story} />;
}
