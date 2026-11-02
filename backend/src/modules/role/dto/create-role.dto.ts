// src/modules/role/dto/create-role.dto.ts
import { z } from 'zod';

export const CreateRoleDto = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export type CreateRoleDtoType = z.infer<typeof CreateRoleDto>;