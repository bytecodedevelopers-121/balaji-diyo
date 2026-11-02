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
import { AttachmentField } from "@/components/media/AttachmentField";
import { BlogAuthorFormDrawer } from "@/components/blog-author/BlogAuthorFormDrawer";
import { TagFormDrawer } from "@/components/tag/TagFormDrawer";
import { ScopedCategoryCreateDrawer } from "@/components/category/ScopedCategoryCreateDrawer";
import { PlaceCreateDrawer } from "@/components/place/PlaceCreateDrawer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useInlineCreate } from "@/hooks/useInlineCreate";
import { useBlogAuthors, useCreateBlogAuthor } from "@/hooks/queries/useBlogAuthors";
import { useCategoriesByTypeKey } from "@/hooks/useCategoriesByTypeKey";
import { useCreateCategory } from "@/hooks/queries/useCategories";
import { useTags, useCreateTag } from "@/hooks/queries/useTags";
import { usePlaces, useCreatePlace } from "@/hooks/queries/usePlaces";
import type { Blog, BlogFormValues } from "@/types/blog";
import type { CreateBlogAuthorDto } from "@/types/blog-author";
import type { CreateTagDto } from "@/types/tag";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().optional(),
  abstract: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  blogDate: z.string().min(1, "Date is required"),
  isActive: z.boolean(),
  authorIds: z.array(z.string()),
  categoryIds: z.array(z.string()),
  tagIds: z.array(z.string()),
  placeIds: z.array(z.string()),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface BlogFormProps {
  defaultValues?: Blog;
  onSubmit: (data: BlogFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function BlogForm({ defaultValues, onSubmit, isLoading, submitLabel }: BlogFormProps) {
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
      blogDate: defaultValues?.blogDate?.slice(0, 10) ?? "",
      isActive: defaultValues?.isActive ?? true,
      authorIds: defaultValues?.authors.map((a) => a.id) ?? [],
      categoryIds: defaultValues?.categories.map((c) => c.id) ?? [],
      tagIds: defaultValues?.tags.map((t) => t.id) ?? [],
      placeIds: defaultValues?.places.map((p) => p.id) ?? [],
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const { data: authorsData } = useBlogAuthors({ perPage: 200, isActive: true });
  const authorOptions = (authorsData?.data.items ?? []).map((a) => ({ value: a.id, label: a.name }));

  // Blog categorization uses the generic Category/CategoryType taxonomy,
  // scoped to whichever CategoryType has key "blog".
  const blogCategories = useCategoriesByTypeKey("blog");

  const { data: tagsData } = useTags({ perPage: 200 });
  const tagOptions = (tagsData?.data.items ?? []).map((t) => ({ value: t.id, label: t.name }));

  const { data: placesData } = usePlaces({ perPage: 200, isActive: true });
  const placeOptions = (placesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.placeName }));

  const authorCreate = useInlineCreate(useCreateBlogAuthor(), (res) => ({ value: res.data.id, label: res.data.name }));
  const tagCreate = useInlineCreate(useCreateTag(), (res) => ({ value: res.data.id, label: res.data.name }));
  const categoryCreate = useInlineCreate(useCreateCategory(), (res) => ({ value: res.data.id, label: res.data.title }));
  const placeCreate = useInlineCreate(useCreatePlace(), (res) => ({ value: res.data.id, label: res.data.placeName }));

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      abstract: values.abstract || undefined,
      content: values.content,
      blogDate: values.blogDate,
      isActive: values.isActive,
      authorIds: values.authorIds,
      categoryIds: values.categoryIds,
      tagIds: values.tagIds,
      placeIds: values.placeIds,
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
          <Input label="Date" type="date" required error={errors.blogDate?.message} {...register("blogDate")} />
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
                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Write the blog post…" />
              )}
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
          </div>
          <Checkbox label="Active" {...register("isActive")} />
        </FormSection>

        <FormSection title="Taxonomy" columns={2}>
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
                      <BlogAuthorFormDrawer
                        isOpen={isOpen}
                        onClose={onClose}
                        author={null}
                        onSubmit={(data) => authorCreate.submit(data as CreateBlogAuthorDto, onCreated)}
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
          <Controller
            name="tagIds"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Tags</label>
                <MultiSelectTags
                  options={tagOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add tag…"
                  create={{
                    label: "Tag",
                    render: ({ isOpen, onClose, onCreated }) => (
                      <TagFormDrawer
                        isOpen={isOpen}
                        onClose={onClose}
                        tag={null}
                        onSubmit={(data) => tagCreate.submit(data as CreateTagDto, onCreated)}
                        isLoading={tagCreate.isLoading}
                        error={tagCreate.error}
                        onDismissError={tagCreate.clearError}
                      />
                    ),
                  }}
                />
              </div>
            )}
          />
          <div className="sm:col-span-2">
            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Categories</label>
                  {blogCategories.categoryType ? (
                    <MultiSelectTags
                      options={blogCategories.options}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add category…"
                      create={{
                        label: "Category",
                        render: ({ isOpen, onClose, onCreated }) => (
                          <ScopedCategoryCreateDrawer
                            isOpen={isOpen}
                            onClose={onClose}
                            typeLabel="Blog"
                            onSubmit={(data) =>
                              categoryCreate.submit({ ...data, typeId: blogCategories.categoryType!.id }, onCreated)
                            }
                            isLoading={categoryCreate.isLoading}
                            error={categoryCreate.error}
                            onDismissError={categoryCreate.clearError}
                          />
                        ),
                      }}
                    />
                  ) : (
                    <p className="text-xs text-gray-500">
                      No "blog" category type exists yet — create one under Category Types first.
                    </p>
                  )}
                </div>
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <Controller
              name="placeIds"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Places</label>
                  <MultiSelectTags
                    options={placeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Add place…"
                    create={{
                      label: "Place",
                      render: ({ isOpen, onClose, onCreated }) => (
                        <PlaceCreateDrawer
                          isOpen={isOpen}
                          onClose={onClose}
                          onSubmit={(data) => placeCreate.submit(data, onCreated)}
                          isLoading={placeCreate.isLoading}
                          error={placeCreate.error}
                          onDismissError={placeCreate.clearError}
                        />
                      ),
                    }}
                  />
                </div>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Images" description="Thumbnail is used on blog cards and listings; banner appears on the post's detail page" columns={2}>
          <AttachmentField
            label="Thumbnail"
            hint="Shown uncropped on blog cards and listings. 1200 × 900 px — 4:3."
            ownerType="blog"
            ownerId={defaultValues?.id}
            role="FEATURED"
          />
          <AttachmentField
            label="Banner Image"
            hint="Wide strip at the top of the post's detail page. 1650 × 650 px — ~2.5:1."
            ownerType="blog"
            ownerId={defaultValues?.id}
            role="SINGLE_BANNER"
          />
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
