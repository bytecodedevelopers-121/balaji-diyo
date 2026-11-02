import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormSection } from "@/components/form/FormSection";
import { MediaUrlField } from "@/components/media/MediaUrlField";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { Service, ServiceFormValues } from "@/types/service";

const linkSchema = z.string().refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
  message: "Use a full http(s) URL or a site-relative path beginning with /",
});

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(10000),
  secondaryDescription: z.string().max(10000).optional(),
  imageUrl: linkSchema,
  ctaLabel: z.string().trim().min(1, "CTA label is required").max(80),
  ctaUrl: linkSchema,
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ServiceFormProps {
  defaultValues?: Service;
  onSubmit: (data: ServiceFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function ServiceForm({ defaultValues, onSubmit, isLoading, submitLabel }: ServiceFormProps) {
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
      secondaryDescription: defaultValues?.secondaryDescription ?? "",
      imageUrl: defaultValues?.imageUrl ?? "",
      ctaLabel: defaultValues?.ctaLabel ?? "Know More",
      ctaUrl: defaultValues?.ctaUrl ?? "/about-us",
      sortOrder: defaultValues?.sortOrder ?? 0,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      ...values,
      secondaryDescription: values.secondaryDescription?.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-6">
        <FormSection title="Service Content" columns={2}>
          <Input label="Title" required error={errors.title?.message} {...register("title")} />
          <Input
            label="Sort Order"
            type="number"
            required
            error={errors.sortOrder?.message}
            {...register("sortOrder", { valueAsNumber: true })}
          />
          <div className="sm:col-span-2">
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <MediaUrlField
                  label="Service Image"
                  hint="Shown as a 4:3 tile in the homepage Services section (cropped to fit, keep the subject centered). 1200 × 900 px — 4:3."
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.imageUrl?.message}
                  folder="services"
                />
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Primary Description" required rows={5} error={errors.description?.message} {...register("description")} />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Secondary Description"
              hint="Optional second paragraph displayed below the primary description"
              rows={5}
              error={errors.secondaryDescription?.message}
              {...register("secondaryDescription")}
            />
          </div>
        </FormSection>

        <FormSection title="Call to Action" columns={2}>
          <Input label="Button Label" required error={errors.ctaLabel?.message} {...register("ctaLabel")} />
          <Input label="Button URL" required error={errors.ctaUrl?.message} {...register("ctaUrl")} />
        </FormSection>

        <FormSection title="Publishing">
          <Checkbox label="Active and visible on the homepage" {...register("isActive")} />
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
