export interface CategoryType {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCategoryTypeDto {
  key: string;
  name: string;
}

export interface UpdateCategoryTypeDto {
  key?: string;
  name?: string;
}
