// src/modules/user/types.ts
export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  roleId: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: { id: string; name: string };
}

export interface UserListQuery {
  page: number;
  limit: number;
  roleId?: string;
  isActive?: boolean;
}
