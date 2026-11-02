import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormSection } from "@/components/form/FormSection";
import type { ServiceSectionConfig, ServiceSectionConfigFormValues } from "@/types/service";

const schema = z.object({
  eyebrow: z.string().trim().min(1, "Section label is required").max(100),
  heading: z.string().trim().min(1, "Heading is required").max(255),
  introduction: z.string().trim().min(1, "Introduction is required").max(2000),
});

interface ServiceSectionConfigFormProps {
  config: ServiceSectionConfig;
  onSubmit: (values: ServiceSectionConfigFormValues) => void;
  isLoading: boolean;
  canEdit: boolean;
}

export function ServiceSectionConfigForm({
  config,
  onSubmit,
  isLoading,
  canEdit,
}: ServiceSectionConfigFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceSectionConfigFormValues>({
    resolver: zodResolver(schema),
    defaultValues: config,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <fieldset disabled={!canEdit || isLoading}>
        <FormSection title="Homepage Section Content" columns={2}>
          <Input label="Section Label" required error={errors.eyebrow?.message} {...register("eyebrow")} />
          <Input label="Heading" required error={errors.heading?.message} {...register("heading")} />
          <div className="sm:col-span-2">
            <Textarea
              label="Introduction"
              required
              rows={3}
              error={errors.introduction?.message}
              {...register("introduction")}
            />
          </div>
        </FormSection>
      </fieldset>
      {canEdit ? (
        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading}>Save Section Content</Button>
        </div>
      ) : null}
    </form>
  );
}
