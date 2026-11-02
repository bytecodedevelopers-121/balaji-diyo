export const SETTING_VALUE_TYPES = [
  "STRING",
  "TEXT",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "IMAGE",
  "FILE",
  "DATE",
  "JSON",
] as const;

export type SettingValueType = (typeof SETTING_VALUE_TYPES)[number];

export interface GlobalSetting {
  id: string;
  key: string;
  keyGroup: string | null;
  categoryId: string | null;
  label: string | null;
  valueType: SettingValueType;
  value: string | null;
  jsonValue: unknown;
  // Computed server-side: jsonValue when valueType is JSON, otherwise value.
  resolvedValue: unknown;
  isProtected: boolean;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateGlobalSettingDto {
  key: string;
  keyGroup?: string;
  categoryId?: string;
  label?: string;
  valueType: SettingValueType;
  value?: string;
  jsonValue?: unknown;
  isProtected?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGlobalSettingDto {
  keyGroup?: string;
  categoryId?: string;
  label?: string;
  valueType?: SettingValueType;
  value?: string;
  jsonValue?: unknown;
  isProtected?: boolean;
  description?: string;
  isActive?: boolean;
}
