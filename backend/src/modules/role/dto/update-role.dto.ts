// src/modules/role/dto/update-role.dto.ts
import { z } from 'zod';

export const UpdateRoleDto = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export type UpdateRoleDtoType = z.infer<typeof UpdateRoleDto>;