import type { StoryAuthor } from "./story-author";

export interface StoryMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface Story {
  id: string;
  title: string;
  abstract: string | null;
  content: string;
  storyDate: string;
  isActive: boolean;
  authors: StoryAuthor[];
  slug: string | null;
  meta: StoryMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface StoryFormValues {
  title: string;
  slug?: string;
  abstract?: string;
  content: string;
  storyDate: string;
  isActive?: boolean;
  authorIds?: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
