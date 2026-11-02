export interface GlobalCategory {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateGlobalCategoryDto {
  key: string;
  name: string;
}

export interface UpdateGlobalCategoryDto {
  key?: string;
  name?: string;
}
