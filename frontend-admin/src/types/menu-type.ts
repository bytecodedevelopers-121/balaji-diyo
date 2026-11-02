export interface MenuType {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateMenuTypeDto {
  key: string;
  name: string;
}

export interface UpdateMenuTypeDto {
  key?: string;
  name?: string;
}
