// src/modules/user/dto/create-user.dto.ts
import { z } from 'zod';

export const CreateUserDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string(),
});

export type CreateUserDtoType = z.infer<typeof CreateUserDto>;
