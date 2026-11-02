// src/modules/role/types.ts
export interface RoleFilters {
  search?: string;
  isSystem?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds?: string[];
}