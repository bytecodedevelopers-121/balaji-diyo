// src/modules/user/dto/update-user.dto.ts
import { z } from 'zod';

export const UpdateUserDto = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  roleId: z.string().optional(),
});

export type UpdateUserDtoType = z.infer<typeof UpdateUserDto>;

// Self-service profile update — deliberately excludes roleId so a user can never
// change their own role through the /me endpoint.
export const UpdateProfileDto = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
});

export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
