import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/form/FormSection";
import { AttachmentField } from "@/components/media/AttachmentField";
import { AttachmentGallery } from "@/components/media/AttachmentGallery";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCategoriesByTypeKey } from "@/hooks/useCategoriesByTypeKey";
import type { GalleryAlbum, GalleryAlbumFormValues } from "@/types/gallery-album";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  destinationId: z.string().min(1, "Destination is required"),
  displayOrder: z.number().int().min(0),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface GalleryAlbumFormProps {
  defaultValues?: GalleryAlbum;
  onSubmit: (data: GalleryAlbumFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function GalleryAlbumForm({ defaultValues, onSubmit, isLoading, submitLabel }: GalleryAlbumFormProps) {
  const { isOnline } = useOnlineStatus();
  const { options: destinationOptions, categoryType: destinationType } = useCategoriesByTypeKey("destination");

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
      description: defaultValues?.description ?? "",
      destinationId: defaultValues?.destinationId ?? "",
      displayOrder: defaultValues?.displayOrder ?? 0,
      isFeatured: defaultValues?.isFeatured ?? false,
      isActive: defaultValues?.isActive ?? true,
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      description: values.description || undefined,
      destinationId: values.destinationId,
      displayOrder: values.displayOrder,
      isFeatured: values.isFeatured,
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
        <FormSection title="Album" columns={2}>
          <div className="sm:col-span-2">
            <Input label="Title" required error={errors.title?.message} {...register("title")} />
          </div>
          <Input
            label="Slug"
            hint="Leave blank to auto-generate from the title"
            error={errors.slug?.message}
            {...register("slug")}
          />
          <Controller
            name="destinationId"
            control={control}
            render={({ field }) => (
              <Select
                label="Destination"
                required
                placeholder={destinationType ? "Select a destination" : "Create the destination category type first"}
                options={destinationOptions}
                disabled={!destinationType}
                error={errors.destinationId?.message}
                {...field}
              />
            )}
          />
          <div className="sm:col-span-2">
            <Textarea label="Description" rows={2} error={errors.description?.message} {...register("description")} />
          </div>
          <Input
            label="Listing order"
            type="number"
            min={0}
            hint="Lower numbers appear first"
            error={errors.displayOrder?.message}
            {...register("displayOrder", { valueAsNumber: true })}
          />
          <div className="flex items-end gap-4">
            <Checkbox label="Featured" {...register("isFeatured")} />
            <Checkbox label="Active" {...register("isActive")} />
          </div>
        </FormSection>

        <FormSection title="Images" description="Cover shows on gallery cards; photos are the album's full set" columns={2}>
          <AttachmentField
            label="Cover Image"
            hint="Shown as a wide tile on the gallery page and as the full-width banner on the album's own page (cropped to fit). 1600 × 960 px — 5:3."
            ownerType="gallery-album"
            ownerId={defaultValues?.id}
            role="FEATURED"
          />
          <div className="sm:col-span-2">
            <AttachmentGallery
              label="Photos"
              hint="Shown as 4:3 tiles inside the opened album (cropped to fit). 1200 × 900 px — 4:3."
              ownerType="gallery-album"
              ownerId={defaultValues?.id}
              role="GALLERY"
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
