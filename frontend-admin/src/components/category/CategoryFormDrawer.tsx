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
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { isRichTextEmpty } from "@/lib/richText";
import type { Category, CreateCategoryDto, UpdateCategoryDto } from "@/types/category";
import type { CategoryType } from "@/types/category-type";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  typeId: z.string().min(1, "Type is required"),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CategoryFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  categoryTypes: CategoryType[];
  parentOptionsSource: Category[];
  defaultTypeId?: string;
  onSubmit: (data: CreateCategoryDto | UpdateCategoryDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function CategoryFormDrawer({
  isOpen,
  onClose,
  category,
  categoryTypes,
  parentOptionsSource,
  defaultTypeId,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: CategoryFormDrawerProps) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: category?.title ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      typeId: category?.typeId ?? defaultTypeId ?? "",
      parentId: category?.parentId ?? "",
      isActive: category?.isActive ?? true,
      metaTitle: category?.meta?.metaTitle ?? "",
      metaKeywords: category?.meta?.metaKeywords ?? "",
      metaDescription: category?.meta?.metaDescription ?? "",
    },
  });

  const selectedTypeId = watch("typeId");

  const typeOptions = categoryTypes.map((t) => ({ value: t.id, label: t.name }));
  const parentOptions = parentOptionsSource
    .filter((c) => c.id !== category?.id && c.typeId === selectedTypeId)
    .map((c) => ({ value: c.id, label: c.title }));

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      description: isRichTextEmpty(values.description) ? undefined : values.description,
      typeId: values.typeId,
      parentId: values.parentId || undefined,
      isActive: values.isActive,
      metaTitle: values.metaTitle || undefined,
      metaKeywords: values.metaKeywords || undefined,
      metaDescription: values.metaDescription || undefined,
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Category" : "New Category"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <Select
          label="Type"
          required
          options={typeOptions}
          error={errors.typeId?.message}
          {...register("typeId")}
        />
        <Input label="Title" required error={errors.title?.message} {...register("title")} />
        <Input
          label="Slug"
          hint="Leave blank to auto-generate from the title"
          error={errors.slug?.message}
          {...register("slug")}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Describe this category…" minHeight={120} />
            )}
          />
        </div>
        <Select
          label="Parent Category"
          placeholder="None (top-level)"
          options={parentOptions}
          error={errors.parentId?.message}
          {...register("parentId")}
        />
        <Checkbox label="Active" {...register("isActive")} />

        <fieldset className="space-y-4 border-t border-gray-200 pt-4">
          <legend className="mb-1 text-sm font-medium text-gray-700">SEO (optional)</legend>
          <Input label="Meta Title" error={errors.metaTitle?.message} {...register("metaTitle")} />
          <Input label="Meta Keywords" error={errors.metaKeywords?.message} {...register("metaKeywords")} />
          <Textarea
            label="Meta Description"
            rows={2}
            error={errors.metaDescription?.message}
            {...register("metaDescription")}
          />
        </fieldset>
      </form>
    </Drawer>
  );
}
