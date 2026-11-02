// src/modules/user/dto/change-password.dto.ts
import { z } from 'zod';

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDto>;

export const ResetPasswordDto = z.object({
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;
