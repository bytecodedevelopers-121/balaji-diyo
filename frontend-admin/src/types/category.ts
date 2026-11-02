import type { CategoryType } from "./category-type";

export interface CategoryMeta {
  metaTitle: string | null;
  metaKeywords: string | null;
  metaDescription: string | null;
}

export interface Category {
  id: string;
  title: string;
  description: string | null;
  extraField1: string | null;
  categoryOrder: number;
  isActive: boolean;
  typeId: string;
  type?: CategoryType;
  parentId: string | null;
  slug: string | null;
  meta: CategoryMeta | null;
  /** Active packages tagged with this category — only on list responses. */
  packageCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CategoryTreeNode extends Category {
  children: (Category & { children: Category[] })[];
}

export interface CreateCategoryDto {
  title: string;
  slug?: string;
  description?: string;
  extraField1?: string;
  categoryOrder?: number;
  isActive?: boolean;
  typeId: string;
  parentId?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

export interface UpdateCategoryDto {
  title?: string;
  slug?: string;
  description?: string;
  extraField1?: string;
  categoryOrder?: number;
  isActive?: boolean;
  typeId?: string;
  parentId?: string;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}
