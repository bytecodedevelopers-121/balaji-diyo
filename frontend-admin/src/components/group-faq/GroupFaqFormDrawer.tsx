import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { MultiSelectTags } from "@/components/ui/MultiSelectTags";
import { ScopedCategoryCreateDrawer } from "@/components/category/ScopedCategoryCreateDrawer";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { useCategoriesByTypeKey } from "@/hooks/useCategoriesByTypeKey";
import { useInlineCreate } from "@/hooks/useInlineCreate";
import { useCreateCategory } from "@/hooks/queries/useCategories";
import { stripHtml } from "@/lib/richText";
import type { GroupFaq, CreateGroupFaqDto, UpdateGroupFaqDto } from "@/types/group-faq";

const schema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().refine((v) => stripHtml(v).length >= 5, "Answer must be at least 5 characters"),
  isActive: z.boolean().optional(),
  categoryIds: z.array(z.string()).min(1, "Select at least one category").max(5, "Up to 5 categories"),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface GroupFaqFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  groupFaq?: GroupFaq | null;
  onSubmit: (data: CreateGroupFaqDto | UpdateGroupFaqDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function GroupFaqFormDrawer({
  isOpen,
  onClose,
  groupFaq,
  onSubmit,
  isLoading,
  error,
  onDismissError,
}: GroupFaqFormDrawerProps) {
  const isEdit = !!groupFaq;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question: groupFaq?.question ?? "",
      answer: groupFaq?.answer ?? "",
      isActive: groupFaq?.isActive ?? true,
      categoryIds: groupFaq?.categories.map((c) => c.id) ?? [],
      metaTitle: groupFaq?.meta?.metaTitle ?? "",
      metaKeywords: groupFaq?.meta?.metaKeywords ?? "",
      metaDescription: groupFaq?.meta?.metaDescription ?? "",
    },
  });

  // GroupFAQ categorization uses the generic Category/CategoryType taxonomy,
  // scoped to whichever CategoryType has key "faq-group".
  const groupFaqCategories = useCategoriesByTypeKey("faq-group");
  const categoryCreate = useInlineCreate(useCreateCategory(), (res) => ({ value: res.data.id, label: res.data.title }));

  const submit = (values: FormValues) => {
    onSubmit({
      question: values.question,
      answer: values.answer,
      isActive: values.isActive,
      categoryIds: values.categoryIds,
      metaTitle: values.metaTitle || undefined,
      metaKeywords: values.metaKeywords || undefined,
      metaDescription: values.metaDescription || undefined,
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Group FAQ" : "New Group FAQ"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create Group FAQ"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <Input label="Question" required error={errors.question?.message} {...register("question")} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Answer <span className="text-red-500">*</span>
          </label>
          <Controller
            name="answer"
            control={control}
            render={({ field }) => (
              <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Write the answer…" minHeight={140} />
            )}
          />
          {errors.answer && <p className="mt-1 text-xs text-red-600">{errors.answer.message}</p>}
        </div>

        <Controller
          name="categoryIds"
          control={control}
          render={({ field }) => (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Categories <span className="text-red-500">*</span>
              </label>
              {groupFaqCategories.categoryType ? (
                <MultiSelectTags
                  options={groupFaqCategories.options}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add category…"
                  create={{
                    label: "Category",
                    render: ({ isOpen, onClose, onCreated }) => (
                      <ScopedCategoryCreateDrawer
                        isOpen={isOpen}
                        onClose={onClose}
                        typeLabel="FAQ Group"
                        onSubmit={(data) =>
                          categoryCreate.submit({ ...data, typeId: groupFaqCategories.categoryType!.id }, onCreated)
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
                  No "faq-group" category type exists yet — create one under Category Types first.
                </p>
              )}
              {errors.categoryIds && <p className="mt-1 text-xs text-red-600">{errors.categoryIds.message}</p>}
            </div>
          )}
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
