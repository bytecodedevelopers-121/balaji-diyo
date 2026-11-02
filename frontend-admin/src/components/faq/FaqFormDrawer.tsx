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
import type { Faq, CreateFaqDto, UpdateFaqDto } from "@/types/faq";

const schema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  answer: z.string().refine((v) => stripHtml(v).length >= 5, "Answer must be at least 5 characters"),
  isActive: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FaqFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  faq?: Faq | null;
  onSubmit: (data: CreateFaqDto | UpdateFaqDto) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function FaqFormDrawer({ isOpen, onClose, faq, onSubmit, isLoading, error, onDismissError }: FaqFormDrawerProps) {
  const isEdit = !!faq;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      question: faq?.question ?? "",
      answer: faq?.answer ?? "",
      isActive: faq?.isActive ?? true,
      metaTitle: faq?.meta?.metaTitle ?? "",
      metaKeywords: faq?.meta?.metaKeywords ?? "",
      metaDescription: faq?.meta?.metaDescription ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      question: values.question,
      answer: values.answer,
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
      title={isEdit ? "Edit FAQ" : "New FAQ"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Create FAQ"}
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
