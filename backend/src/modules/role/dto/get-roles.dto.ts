// src/modules/role/dto/get-roles.dto.ts
import { z } from 'zod';

export const GetRolesDto = z.object({
  search: z.string().optional(),
  isSystem: z.string().transform(val => val === 'true').optional(),
  page: z.string().optional(),
  perPage: z.string().optional(),
});

export type GetRolesDtoType = z.infer<typeof GetRolesDto>;