import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/form/FormSection";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { MultiSelectTags } from "@/components/ui/MultiSelectTags";
import { StoryAuthorFormDrawer } from "@/components/story-author/StoryAuthorFormDrawer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useInlineCreate } from "@/hooks/useInlineCreate";
import { useStoryAuthors, useCreateStoryAuthor } from "@/hooks/queries/useStoryAuthors";
import type { Story, StoryFormValues } from "@/types/story";
import type { CreateStoryAuthorDto } from "@/types/story-author";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().optional(),
  abstract: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  storyDate: z.string().min(1, "Date is required"),
  isActive: z.boolean(),
  authorIds: z.array(z.string()),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StoryFormProps {
  defaultValues?: Story;
  onSubmit: (data: StoryFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function StoryForm({ defaultValues, onSubmit, isLoading, submitLabel }: StoryFormProps) {
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
      abstract: defaultValues?.abstract ?? "",
      content: defaultValues?.content ?? "",
      storyDate: defaultValues?.storyDate?.slice(0, 10) ?? "",
      isActive: defaultValues?.isActive ?? true,
      authorIds: defaultValues?.authors.map((a) => a.id) ?? [],
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const { data: authorsData } = useStoryAuthors({ perPage: 200, isActive: true });
  const authorOptions = (authorsData?.data.items ?? []).map((a) => ({ value: a.id, label: a.name }));

  const authorCreate = useInlineCreate(useCreateStoryAuthor(), (res) => ({ value: res.data.id, label: res.data.name }));

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      abstract: values.abstract || undefined,
      content: values.content,
      storyDate: values.storyDate,
      isActive: values.isActive,
      authorIds: values.authorIds,
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
          <Input label="Date" type="date" required error={errors.storyDate?.message} {...register("storyDate")} />
          <div className="sm:col-span-2">
            <Textarea label="Abstract" rows={2} error={errors.abstract?.message} {...register("abstract")} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Body <span className="text-red-500">*</span>
            </label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Write the story…" />
              )}
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
          </div>
          <Checkbox label="Active" {...register("isActive")} />
        </FormSection>

        <FormSection title="Authors" columns={2}>
          <div className="sm:col-span-2">
            <Controller
              name="authorIds"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Authors</label>
                  <MultiSelectTags
                    options={authorOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Add author…"
                    create={{
                      label: "Author",
                      render: ({ isOpen, onClose, onCreated }) => (
                        <StoryAuthorFormDrawer
                          isOpen={isOpen}
                          onClose={onClose}
                          author={null}
                          onSubmit={(data) => authorCreate.submit(data as CreateStoryAuthorDto, onCreated)}
                          isLoading={authorCreate.isLoading}
                          error={authorCreate.error}
                          onDismissError={authorCreate.clearError}
                        />
                      ),
                    }}
                  />
                </div>
              )}
            />
          </div>
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
