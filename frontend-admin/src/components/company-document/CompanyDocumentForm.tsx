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
import { MediaUrlField } from "@/components/media/MediaUrlField";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { CompanyDocument, CompanyDocumentFormValues } from "@/types/company-document";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.enum(["legal", "association"]),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CompanyDocumentFormProps {
  defaultValues?: CompanyDocument;
  onSubmit: (data: CompanyDocumentFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function CompanyDocumentForm({ defaultValues, onSubmit, isLoading, submitLabel }: CompanyDocumentFormProps) {
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
      description: defaultValues?.description ?? "",
      imageUrl: defaultValues?.imageUrl ?? "",
      category: defaultValues?.category ?? "legal",
      sortOrder: defaultValues?.sortOrder ?? 0,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      // null (not undefined) so clearing a field is sent and actually removed
      description: values.description?.trim() ? values.description : null,
      imageUrl: values.imageUrl || null,
      category: values.category,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-6">
        <FormSection title="Document" columns={2}>
          <Input label="Title" required error={errors.title?.message} {...register("title")} />
          <Select
            label="Document type"
            required
            hint="Decides which group of the website's Legal Documents page it appears in."
            options={[
              { value: "legal", label: "Legal Document" },
              { value: "association", label: "Travel and Trade Association" },
            ]}
            error={errors.category?.message}
            {...register("category")}
          />
          <Input
            label="Sort Order"
            type="number"
            error={errors.sortOrder?.message}
            {...register("sortOrder", { valueAsNumber: true })}
          />
          <div className="sm:col-span-2">
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <MediaUrlField
                  label="Document Image"
                  hint="Upload a scan/photo of the document, or choose one already in the media library. Portrait scan, roughly A4. 850 × 1100 px — 17:22."
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.imageUrl?.message}
                  folder="company-documents"
                />
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              rows={3}
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
          <Checkbox label="Active" {...register("isActive")} />
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
