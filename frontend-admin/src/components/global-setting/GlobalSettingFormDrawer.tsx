import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CreatableSelect } from "@/components/ui/CreatableSelect";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { GlobalCategoryCreateDrawer } from "@/components/global-category/GlobalCategoryCreateDrawer";
import { useGlobalCategories, useCreateGlobalCategory } from "@/hooks/queries/useGlobalCategories";
import { useInlineCreate } from "@/hooks/useInlineCreate";
import { getPublicUrl } from "@/lib/storage";
import { SETTING_VALUE_TYPES } from "@/types/global-setting";
import type { GlobalSetting, SettingValueType, CreateGlobalSettingDto, UpdateGlobalSettingDto } from "@/types/global-setting";

const VALUE_TYPE_LABELS: Record<SettingValueType, string> = {
  STRING: "Short Text",
  TEXT: "Long Text",
  INTEGER: "Whole Number",
  DECIMAL: "Decimal Number",
  BOOLEAN: "True / False",
  IMAGE: "Image",
  FILE: "File",
  DATE: "Date",
  JSON: "JSON",
};

const TEXT_VALUE_TYPES: SettingValueType[] = ["STRING", "TEXT", "DATE", "IMAGE", "FILE"];
const NUMBER_VALUE_TYPES: SettingValueType[] = ["INTEGER", "DECIMAL"];

const schema = z
  .object({
    key: z.string().min(1, "Key is required").max(50),
    keyGroup: z.string().optional(),
    categoryId: z.string().optional(),
    label: z.string().optional(),
    valueType: z.enum(SETTING_VALUE_TYPES),
    textValue: z.string().optional(),
    numberValue: z.string().optional(),
    boolValue: z.boolean(),
    jsonValueText: z.string().optional(),
    isProtected: z.boolean(),
    description: z.string().optional(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.valueType === "JSON" && v.jsonValueText) {
      try {
        JSON.parse(v.jsonValueText);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be valid JSON", path: ["jsonValueText"] });
      }
    }
    if (v.valueType === "INTEGER" && v.numberValue && !/^-?\d+$/.test(v.numberValue)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a whole number", path: ["numberValue"] });
    }
    if (v.valueType === "DECIMAL" && v.numberValue && Number.isNaN(Number(v.numberValue))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Must be a number", path: ["numberValue"] });
    }
  });

type FormValues = z.infer<typeof schema>;

interface GlobalSettingFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  setting?: GlobalSetting | null;
  onSubmit: (data: CreateGlobalSettingDto | UpdateGlobalSettingDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function GlobalSettingFormDrawer({
  isOpen,
  onClose,
  setting,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: GlobalSettingFormDrawerProps) {
  const isEdit = !!setting;
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: setting?.key ?? "",
      keyGroup: setting?.keyGroup ?? "",
      categoryId: setting?.categoryId ?? "",
      label: setting?.label ?? "",
      valueType: setting?.valueType ?? "STRING",
      textValue: setting && TEXT_VALUE_TYPES.includes(setting.valueType) ? (setting.value ?? "") : "",
      numberValue: setting && NUMBER_VALUE_TYPES.includes(setting.valueType) ? (setting.value ?? "") : "",
      boolValue: setting?.valueType === "BOOLEAN" ? setting.value === "true" : false,
      jsonValueText: setting?.valueType === "JSON" ? JSON.stringify(setting.jsonValue ?? {}, null, 2) : "",
      isProtected: setting?.isProtected ?? false,
      description: setting?.description ?? "",
      isActive: setting?.isActive ?? true,
    },
  });

  const valueType = watch("valueType");

  const { data: categoriesData } = useGlobalCategories({ perPage: 200 });
  const categoryOptions = (categoriesData?.data.items ?? []).map((c) => ({ value: c.id, label: c.name }));
  const categoryCreate = useInlineCreate(useCreateGlobalCategory(), (res) => ({ value: res.data.id, label: res.data.name }));

  const submit = (values: FormValues) => {
    const shared = {
      keyGroup: values.keyGroup || undefined,
      categoryId: values.categoryId || undefined,
      label: values.label || undefined,
      valueType: values.valueType,
      isProtected: values.isProtected,
      description: values.description || undefined,
      isActive: values.isActive,
      value: undefined as string | undefined,
      jsonValue: undefined as unknown,
    };

    switch (values.valueType) {
      case "BOOLEAN":
        shared.value = values.boolValue ? "true" : "false";
        break;
      case "INTEGER":
      case "DECIMAL":
        shared.value = values.numberValue || undefined;
        break;
      case "JSON":
        shared.jsonValue = values.jsonValueText ? JSON.parse(values.jsonValueText) : undefined;
        break;
      default:
        shared.value = values.textValue || undefined;
    }

    onSubmit(isEdit ? shared : { ...shared, key: values.key });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Setting" : "New Setting"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Setting"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Key"
            hint="Unique lookup identifier"
            required
            disabled={isEdit}
            error={errors.key?.message}
            {...register("key")}
          />
          <Select
            label="Value Type"
            required
            disabled={isEdit}
            options={SETTING_VALUE_TYPES.map((t) => ({ value: t, label: VALUE_TYPE_LABELS[t] }))}
            error={errors.valueType?.message}
            {...register("valueType")}
          />
        </div>
        {isEdit && (
          <p className="-mt-2 text-xs text-gray-400">
            Key and value type can't be changed after creation — delete and recreate instead.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Label" hint="Human-readable name" error={errors.label?.message} {...register("label")} />
          <Input label="Key Group" hint="Optional grouping tag" error={errors.keyGroup?.message} {...register("keyGroup")} />
        </div>

        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <CreatableSelect
              label="Category"
              placeholder="No category"
              options={categoryOptions}
              value={field.value ?? ""}
              onChange={field.onChange}
              create={{
                label: "Category",
                render: ({ isOpen: createOpen, onClose: closeCreate, onCreated }) => (
                  <GlobalCategoryCreateDrawer
                    isOpen={createOpen}
                    onClose={closeCreate}
                    onSubmit={(data) => categoryCreate.submit(data, onCreated)}
                    isLoading={categoryCreate.isLoading}
                    error={categoryCreate.error}
                    onDismissError={categoryCreate.clearError}
                  />
                ),
              }}
            />
          )}
        />

        <fieldset className="space-y-3 border-t border-gray-200 pt-4">
          <legend className="mb-1 text-sm font-medium text-gray-700">Value</legend>

          {valueType === "STRING" && (
            <Input error={errors.textValue?.message} {...register("textValue")} />
          )}
          {valueType === "TEXT" && (
            <Textarea rows={5} error={errors.textValue?.message} {...register("textValue")} />
          )}
          {valueType === "DATE" && (
            <Input type="date" error={errors.textValue?.message} {...register("textValue")} />
          )}
          {valueType === "INTEGER" && (
            <Input type="number" step={1} error={errors.numberValue?.message} {...register("numberValue")} />
          )}
          {valueType === "DECIMAL" && (
            <Input type="number" step="any" error={errors.numberValue?.message} {...register("numberValue")} />
          )}
          {valueType === "BOOLEAN" && <Checkbox label="Enabled (true)" {...register("boolValue")} />}
          {valueType === "JSON" && (
            <Textarea
              rows={8}
              className="font-mono text-xs"
              placeholder="{ }"
              error={errors.jsonValueText?.message}
              {...register("jsonValueText")}
            />
          )}
          {(valueType === "IMAGE" || valueType === "FILE") && (
            <Controller
              name="textValue"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {field.value ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
                      {valueType === "IMAGE" && (
                        <img src={getPublicUrl(field.value)} alt="" className="h-12 w-12 rounded object-cover" />
                      )}
                      <span className="truncate text-xs text-gray-600">{field.value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => field.onChange("")}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No file selected.</p>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => setMediaPickerOpen(true)}>
                    Choose from Media Library
                  </Button>
                  {errors.textValue && <p className="text-xs text-red-600">{errors.textValue.message}</p>}

                  <MediaPickerModal
                    isOpen={mediaPickerOpen}
                    onClose={() => setMediaPickerOpen(false)}
                    onSelect={(media) => {
                      field.onChange(media.fullPath);
                      setMediaPickerOpen(false);
                    }}
                    folder="global"
                  />
                </div>
              )}
            />
          )}
        </fieldset>

        <Textarea
          label="Description"
          hint="Admin-facing note about what this setting controls"
          rows={2}
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="flex gap-4">
          <Checkbox label="Active" {...register("isActive")} />
          <Checkbox label="Protected (prevents deletion)" {...register("isProtected")} />
        </div>
      </form>
    </Drawer>
  );
}
