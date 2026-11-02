import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { stripHtml } from "@/lib/richText";
import type { TripInfo, CreateTripInfoDto, UpdateTripInfoDto } from "@/types/trip-info";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().optional(),
  description: z.string().refine((v) => stripHtml(v).length >= 5, "Description must be at least 5 characters"),
  isActive: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TripInfoFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tripInfo?: TripInfo | null;
  onSubmit: (data: CreateTripInfoDto | UpdateTripInfoDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function TripInfoFormDrawer({
  isOpen,
  onClose,
  tripInfo,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: TripInfoFormDrawerProps) {
  const isEdit = !!tripInfo;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: tripInfo?.title ?? "",
      slug: tripInfo?.slug ?? "",
      description: tripInfo?.description ?? "",
      isActive: tripInfo?.isActive ?? true,
      metaTitle: tripInfo?.meta?.metaTitle ?? "",
      metaKeywords: tripInfo?.meta?.metaKeywords ?? "",
      metaDescription: tripInfo?.meta?.metaDescription ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      description: values.description,
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
      title={isEdit ? "Edit Trip Info" : "New Trip Info"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Trip Info"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <Input label="Title" required error={errors.title?.message} {...register("title")} />
        <Input
          label="Slug"
          hint="Leave blank to auto-generate from the title"
          error={errors.slug?.message}
          {...register("slug")}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Describe this trip info…" minHeight={140} />
            )}
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>
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
