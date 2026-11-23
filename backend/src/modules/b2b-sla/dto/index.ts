import { z } from 'zod';
import { booleanQueryParam } from '../../../common/dto/zod-helpers';
import { dateInput } from '../../b2b-common/b2b-inputs';

const id = z.string().min(1).max(64);
const Statuses = ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'BREACHED'] as const;
const Priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export const ListSlaQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(15),
  status: z.enum(Statuses).optional(),
  priority: z.enum(Priorities).optional(),
  partnerId: id.optional(), // admin only
  overdue: booleanQueryParam, // due date passed and not resolved
});
export type ListSlaQueryDtoType = z.infer<typeof ListSlaQueryDto>;

export const UpdateSlaDto = z
  .object({
    status: z.enum(['IN_PROGRESS', 'ESCALATED', 'RESOLVED']),
    priority: z.enum(Priorities),
    notes: z.string().trim().max(5000),
    dueAt: dateInput,
  })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Provide at least one field to change' });
export type UpdateSlaDtoType = z.infer<typeof UpdateSlaDto>;

export const SlaParamsDto = z.object({ id });
