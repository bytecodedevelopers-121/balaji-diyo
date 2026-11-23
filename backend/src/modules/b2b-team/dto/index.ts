import { z } from 'zod';

const B2BRoleEnum = z.enum(['AGENCY_ADMIN', 'BOOKING_AGENT', 'FINANCE_MANAGER']);

export const InviteTeamMemberDto = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  b2bRole: B2BRoleEnum,
  // Initial password set by the inviting admin and shared out-of-band (no invite-email flow yet).
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a digit'),
});
export type InviteTeamMemberDtoType = z.infer<typeof InviteTeamMemberDto>;

export const UpdateTeamMemberDto = z
  .object({ b2bRole: B2BRoleEnum.optional(), isActive: z.boolean().optional() })
  .refine((v) => v.b2bRole !== undefined || v.isActive !== undefined, { message: 'Provide b2bRole and/or isActive' });
export type UpdateTeamMemberDtoType = z.infer<typeof UpdateTeamMemberDto>;

export const TeamMemberParamsDto = z.object({ userId: z.string().min(1).max(64) });
