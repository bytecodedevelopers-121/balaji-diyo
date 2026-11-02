import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from "@/types/menu-item";

const schema = z
  .object({
    label: z.string().min(1, "Label is required"),
    isExternal: z.boolean(),
    externalLink: z.string().optional(),
    urlSegment: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine((v) => !v.isExternal || !!v.externalLink?.trim(), {
    message: "External URL is required for an external link",
    path: ["externalLink"],
  });

type FormValues = z.infer<typeof schema>;

interface MenuItemFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  typeId: string;
  item?: MenuItem | null;
  /** Where a new item will be created — null id means top-level. Ignored when editing (re-parenting isn't supported; delete + recreate under the new parent instead). */
  parentContext?: { id: string | null; label: string } | null;
  onSubmit: (data: CreateMenuItemDto | UpdateMenuItemDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function MenuItemFormDrawer({
  isOpen,
  onClose,
  typeId,
  item,
  parentContext,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: MenuItemFormDrawerProps) {
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: item?.label ?? "",
      isExternal: item?.isExternal ?? false,
      externalLink: item?.externalLink ?? "",
      urlSegment: item?.urlSegment ?? "",
      isActive: item?.isActive ?? true,
    },
  });

  const isExternal = watch("isExternal");

  const submit = (values: FormValues) => {
    const shared = {
      label: values.label,
      isExternal: values.isExternal,
      externalLink: values.isExternal ? values.externalLink || undefined : undefined,
      urlSegment: !values.isExternal ? values.urlSegment || undefined : undefined,
      isActive: values.isActive,
    };
    onSubmit(isEdit ? shared : { ...shared, typeId, parentId: parentContext?.id ?? undefined });
  };

  const title = isEdit ? "Edit Menu Item" : parentContext?.id ? `New Item Under "${parentContext.label}"` : "New Menu Item";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}

        {!isEdit && (
          <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
            {parentContext?.id ? (
              <>
                Adding under <span className="font-medium text-gray-700">{parentContext.label}</span>
              </>
            ) : (
              "Adding as a top-level item"
            )}
          </p>
        )}

        <Input label="Label" required error={errors.label?.message} {...register("label")} />

        <Controller
          name="isExternal"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="External link"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />

        {isExternal ? (
          <Input
            label="External URL"
            required
            hint="Full URL, e.g. https://example.com"
            error={errors.externalLink?.message}
            {...register("externalLink")}
          />
        ) : (
          <Input
            label="URL Segment"
            hint='Internal path, e.g. "about-us" or "/packages"'
            error={errors.urlSegment?.message}
            {...register("urlSegment")}
          />
        )}

        <Checkbox label="Active" {...register("isActive")} />
      </form>
    </Drawer>
  );
}
