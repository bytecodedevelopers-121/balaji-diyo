import { z } from 'zod';

const ValueType = z.enum(['STRING', 'TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'IMAGE', 'FILE', 'DATE', 'JSON']);

export const GlobalSettingBaseDto = z.object({
  key: z.string().min(1).max(50),
  keyGroup: z.string().max(50).optional(),
  categoryId: z.string().optional(),
  label: z.string().max(100).optional(),
  valueType: ValueType,
  value: z.string().optional(),
  jsonValue: z.unknown().optional(),
  isProtected: z.boolean().optional(),
  description: z.string().max(1500).optional(),
  isActive: z.boolean().optional(),
});

export const CreateGlobalSettingDto = GlobalSettingBaseDto.refine((d) => d.valueType !== 'JSON' || d.jsonValue !== undefined, {
  message: 'jsonValue is required when valueType is JSON',
  path: ['jsonValue'],
});

export type CreateGlobalSettingDtoType = z.infer<typeof CreateGlobalSettingDto>;
