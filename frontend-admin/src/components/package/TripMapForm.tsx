import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/form/FormSection";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { AttachmentField } from "@/components/media/AttachmentField";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isRichTextEmpty } from "@/lib/richText";
import type { PackageMap } from "@/types/package-map";

export const PACKAGE_MAP_OWNER_TYPE = "package-map";

const schema = z.object({
  packageId: z.string().min(1, "Package is required"),
  mapTitle: z.string().min(1, "Title is required").max(255),
  slug: z.string().optional(),
  mapAbstract: z.string().optional(),
  mapDetails: z.string().optional(),
  isActive: z.boolean(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export interface TripMapFormValues {
  packageId: string;
  mapTitle: string;
  slug?: string;
  mapAbstract?: string;
  mapDetails?: string;
  isActive: boolean;
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
}

interface TripMapFormProps {
  defaultValues?: PackageMap;
  packageOptions: SelectOption[];
  /** Preselects and locks the package picker — used when creating from a package's own Trip Map tab. */
  fixedPackageId?: string;
  onSubmit: (data: TripMapFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function TripMapForm({ defaultValues, packageOptions, fixedPackageId, onSubmit, isLoading, submitLabel }: TripMapFormProps) {
  const { isOnline } = useOnlineStatus();
  const isEdit = !!defaultValues;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageId: defaultValues?.packageId ?? fixedPackageId ?? "",
      mapTitle: defaultValues?.mapTitle ?? "",
      slug: defaultValues?.slug ?? "",
      mapAbstract: defaultValues?.mapAbstract ?? "",
      mapDetails: defaultValues?.mapDetails ?? "",
      isActive: defaultValues?.isActive ?? true,
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      packageId: values.packageId,
      mapTitle: values.mapTitle,
      slug: values.slug || undefined,
      mapAbstract: isRichTextEmpty(values.mapAbstract) ? undefined : values.mapAbstract,
      mapDetails: isRichTextEmpty(values.mapDetails) ? undefined : values.mapDetails,
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
        <FormSection title="Trip Map" columns={2}>
          <div className="sm:col-span-2">
            <Input label="Title" required error={errors.mapTitle?.message} {...register("mapTitle")} />
          </div>
          <Input
            label="Slug"
            hint="Leave blank to auto-generate from the title"
            error={errors.slug?.message}
            {...register("slug")}
          />
          <Select
            label="Package"
            required
            disabled={isEdit || !!fixedPackageId}
            options={packageOptions}
            placeholder="Select a package…"
            error={errors.packageId?.message}
            {...register("packageId")}
          />
          <Checkbox label="Active" {...register("isActive")} />
        </FormSection>

        <FormSection title="Content">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Abstract</label>
            <Controller
              name="mapAbstract"
              control={control}
              render={({ field }) => (
                <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Short summary…" minHeight={100} />
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Details</label>
            <Controller
              name="mapDetails"
              control={control}
              render={({ field }) => (
                <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Full route description…" />
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Featured Image" description="Shown on this trip map's public page">
          <AttachmentField
            label="Featured Image"
            hint="Shown as a 4:3 card on the map listing, and larger (uncropped) on the route's own page — a route map graphic or landscape photo. 1200 × 900 px — 4:3."
            ownerType={PACKAGE_MAP_OWNER_TYPE}
            ownerId={defaultValues?.id}
            role="FEATURED"
          />
        </FormSection>

        <FormSection title="SEO" description="Overrides for search engines" columns={2}>
          <Input label="Meta Title" error={errors.metaTitle?.message} {...register("metaTitle")} />
          <Input label="Meta Keywords" error={errors.metaKeywords?.message} {...register("metaKeywords")} />
          <div className="sm:col-span-2">
            <Textarea
              label="Meta Description"
              rows={3}
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
