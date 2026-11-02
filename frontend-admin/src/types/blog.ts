import type { BlogAuthor } from "./blog-author";
import type { Category } from "./category";
import type { Tag } from "./tag";

export interface BlogPlace {
  id: string;
  placeName: string;
}

export interface BlogMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface Blog {
  id: string;
  title: string;
  abstract: string | null;
  content: string;
  blogDate: string;
  isActive: boolean;
  authors: BlogAuthor[];
  categories: Category[];
  tags: Tag[];
  places: BlogPlace[];
  slug: string | null;
  meta: BlogMeta | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BlogFormValues {
  title: string;
  slug?: string;
  abstract?: string;
  content: string;
  blogDate: string;
  isActive?: boolean;
  authorIds?: string[];
  categoryIds?: string[];
  tagIds?: string[];
  placeIds?: string[];
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
