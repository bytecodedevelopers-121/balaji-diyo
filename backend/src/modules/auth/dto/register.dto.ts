// src/modules/auth/dto/register.dto.ts
import { z } from 'zod';

export const RegisterDto = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    roleId: z.string(),
    isSuperAdmin: z.boolean().optional().default(false),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;