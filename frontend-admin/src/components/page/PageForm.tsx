import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/form/FormSection";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { Page, PageFormValues } from "@/types/page";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  content: z.string().optional(),
  parentId: z.string().optional(),
  pageOrder: z.number().optional(),
  isActive: z.boolean(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PageFormProps {
  defaultValues?: Page;
  /** Other pages, for the parent picker — excludes the page being edited. */
  pages?: Page[];
  onSubmit: (data: PageFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function PageForm({ defaultValues, pages = [], onSubmit, isLoading, submitLabel }: PageFormProps) {
  const { isOnline } = useOnlineStatus();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      slug: defaultValues?.slug ?? "",
      content: defaultValues?.content ?? "",
      parentId: defaultValues?.parentId ?? "",
      pageOrder: defaultValues?.pageOrder ?? 0,
      isActive: defaultValues?.isActive ?? true,
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const parentOptions = pages
    .filter((p) => p.id !== defaultValues?.id)
    .map((p) => ({ value: p.id, label: p.title }));

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      content: values.content || undefined,
      parentId: values.parentId || undefined,
      pageOrder: values.pageOrder,
      isActive: values.isActive,
      metaTitle: values.metaTitle || undefined,
      metaKeywords: values.metaKeywords || undefined,
      metaDescription: values.metaDescription || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-6">
        <FormSection title="Content" columns={2}>
          <div className="sm:col-span-2">
            <Input label="Title" required error={errors.title?.message} {...register("title")} />
          </div>
          <Input
            label="Slug"
            hint="Leave blank to auto-generate from the title"
            error={errors.slug?.message}
            {...register("slug")}
          />
          <Select
            label="Parent Page"
            placeholder="None (top-level)"
            options={parentOptions}
            error={errors.parentId?.message}
            {...register("parentId")}
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Body</label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Write the page content…"
                />
              )}
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
          </div>
          <Checkbox label="Active" {...register("isActive")} />
        </FormSection>

        <FormSection title="SEO" description="Overrides for search engines" columns={2}>
          <Input label="Meta Title" error={errors.metaTitle?.message} {...register("metaTitle")} />
          <Input label="Meta Keywords" error={errors.metaKeywords?.message} {...register("metaKeywords")} />
          <div className="sm:col-span-2">
            <Textarea
              label="Meta Description"
              rows={2}
              error={errors.metaDescription?.message}
              {...register("metaDescription")}
            />
          </div>
        </FormSection>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading} disabled={!isOnline}>
            {submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
