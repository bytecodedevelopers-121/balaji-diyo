import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWebStories, getWebStory } from "@/features/site-content/api";
import { buildMetadata } from "@/lib/seo/metadata";
import { StoryViewer } from "./StoryViewer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 30;

export async function generateStaticParams() {
  return (await getWebStories()).map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getWebStory(slug);
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
  const story = await getWebStory(slug);
  if (!story) notFound();
  return <StoryViewer story={story} />;
}
