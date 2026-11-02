import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { MultiSelectTags } from "@/components/ui/MultiSelectTags";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/form/FormSection";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { Repeater } from "@/components/form/Repeater";
import { AttachmentField } from "@/components/media/AttachmentField";
import { AttachmentGallery } from "@/components/media/AttachmentGallery";
import { PlaceLocationMap } from "@/components/place/PlaceLocationMap";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCategoriesByTypeKey } from "@/hooks/useCategoriesByTypeKey";
import { useAllPackageMaps } from "@/hooks/queries/usePackageMaps";
import { isRichTextEmpty } from "@/lib/richText";
import { parseCoordinate } from "@/lib/polyline";
import type { Place, PlaceFormValues } from "@/types/place";

const schema = z.object({
  placeName: z.string().min(5, "Name must be at least 5 characters"),
  slug: z.string().optional(),
  placeAbstract: z.string().optional(),
  placeDescription: z.string().optional(),
  placeElevation: z.string().optional(),
  placeCoordinates: z.string().refine((value) => !value || parseCoordinate(value) !== null, "Use valid latitude, longitude coordinates").optional(),
  placeMap: z.string().optional(),
  placeExtra: z.string().optional(),
  attractionOrder: z.number().int().min(0),
  regionIds: z.array(z.string()).max(10),
  primaryRegionId: z.string().optional(),
  placeTypeId: z.string().optional(),
  routeMapId: z.string().optional(),
  facts: z.array(z.object({ label: z.string().min(1, "Label is required"), value: z.string().min(1, "Value is required") })).max(30),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PlaceFormProps {
  defaultValues?: Place;
  onSubmit: (data: PlaceFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function PlaceForm({ defaultValues, onSubmit, isLoading, submitLabel }: PlaceFormProps) {
  const { isOnline } = useOnlineStatus();
  const { options: regionOptions, categoryType: regionType } = useCategoriesByTypeKey("destination");
  const { options: placeTypeOptions, categoryType: placeTypeCategory } = useCategoriesByTypeKey("place-type");
  const { data: routeMapsData, isLoading: routeMapsLoading } = useAllPackageMaps({ perPage: 100, isActive: true });
  const linkedRouteMap = defaultValues?.routeMap;
  const routeMapOptions = (routeMapsData?.data.items ?? []).map((map) => ({ value: map.id, label: map.mapTitle }));
  // Keep an already-linked map selectable even if it has since been hidden/trashed, so the dropdown never
  // silently shows "No link" for a value the record still holds.
  if (linkedRouteMap && !routeMapOptions.some((option) => option.value === linkedRouteMap.id)) {
    routeMapOptions.unshift({ value: linkedRouteMap.id, label: `${linkedRouteMap.mapTitle} (hidden)` });
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      placeName: defaultValues?.placeName ?? "",
      slug: defaultValues?.slug ?? "",
      placeAbstract: defaultValues?.placeAbstract ?? "",
      placeDescription: defaultValues?.placeDescription ?? "",
      placeElevation: defaultValues?.placeElevation ?? "",
      placeCoordinates: defaultValues?.placeCoordinates ?? "",
      placeMap: defaultValues?.placeMap ?? "",
      placeExtra: defaultValues?.placeExtra ?? "",
      attractionOrder: defaultValues?.attractionOrder ?? 0,
      regionIds: defaultValues?.regions.map((region) => region.categoryId) ?? [],
      primaryRegionId: defaultValues?.regions.find((region) => region.isPrimary)?.categoryId ?? "",
      placeTypeId: defaultValues?.placeTypeId ?? "",
      routeMapId: defaultValues?.routeMapId ?? "",
      facts: defaultValues?.facts.map(({ label, value }) => ({ label, value })) ?? [],
      isFeatured: defaultValues?.isFeatured ?? false,
      isActive: defaultValues?.isActive ?? true,
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const { fields: factFields, append: appendFact, remove: removeFact } = useFieldArray({ control, name: "facts" });
  const watchedCoordinates = useWatch({ control, name: "placeCoordinates" });

  const submit = (values: FormValues) => {
    onSubmit({
      placeName: values.placeName,
      slug: values.slug || undefined,
      placeAbstract: values.placeAbstract || undefined,
      placeDescription: isRichTextEmpty(values.placeDescription) ? undefined : values.placeDescription,
      placeElevation: values.placeElevation || undefined,
      placeCoordinates: values.placeCoordinates || undefined,
      placeMap: values.placeMap || undefined,
      placeExtra: values.placeExtra || undefined,
      attractionOrder: values.attractionOrder,
      regionIds: values.regionIds,
      primaryRegionId: values.regionIds.includes(values.primaryRegionId ?? "") ? values.primaryRegionId : undefined,
      placeTypeId: values.placeTypeId || null,
      routeMapId: values.routeMapId || null,
      facts: values.facts,
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
        <FormSection title="Place" columns={2}>
          <div className="sm:col-span-2">
            <Input label="Name" required error={errors.placeName?.message} {...register("placeName")} />
          </div>
          <Input
            label="Slug"
            hint="Leave blank to auto-generate from the name"
            error={errors.slug?.message}
            {...register("slug")}
          />
          <Input label="Elevation" error={errors.placeElevation?.message} {...register("placeElevation")} />
          <div className="sm:col-span-2">
            <Textarea label="Abstract" rows={2} error={errors.placeAbstract?.message} {...register("placeAbstract")} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <Controller
              name="placeDescription"
              control={control}
              render={({ field }) => (
                <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Describe this place…" />
              )}
            />
          </div>
          <div className="flex gap-4">
            <Checkbox label="Featured" {...register("isFeatured")} />
            <Checkbox label="Active" {...register("isActive")} />
          </div>
        </FormSection>

        <FormSection title="Attraction listing" description="Controls where this place appears on the public attractions page" columns={2}>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Regions</label>
            {regionType ? (
              <Controller
                name="regionIds"
                control={control}
                render={({ field }) => (
                  <MultiSelectTags options={regionOptions} value={field.value} onChange={field.onChange} placeholder="Add trekking regions…" />
                )}
              />
            ) : (
              <p className="text-xs text-gray-500">Create the destination category type and its region categories first.</p>
            )}
          </div>
          <Controller
            name="primaryRegionId"
            control={control}
            render={({ field }) => (
              <Select label="Primary region" placeholder="Use first selected region" options={regionOptions} {...field} />
            )}
          />
          <Controller
            name="placeTypeId"
            control={control}
            render={({ field }) => (
              <Select
                label="Attraction type"
                placeholder={placeTypeCategory ? "Select a type" : "Create a place-type category type first"}
                options={placeTypeOptions}
                disabled={!placeTypeCategory}
                {...field}
              />
            )}
          />
          <Input
            label="Listing order"
            type="number"
            min={0}
            hint="Lower numbers appear first"
            error={errors.attractionOrder?.message}
            {...register("attractionOrder", { valueAsNumber: true })}
          />
        </FormSection>

        <FormSection title="Quick information" description="Ordered facts displayed near the top of the attraction detail page">
          <div className="sm:col-span-2">
            <Repeater
              label="Facts"
              fields={factFields}
              onAdd={() => appendFact({ label: "", value: "" })}
              onRemove={removeFact}
              addLabel="+ Add fact"
              renderRow={(_, index) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Label" error={errors.facts?.[index]?.label?.message} {...register(`facts.${index}.label`)} />
                  <Input label="Value" error={errors.facts?.[index]?.value?.message} {...register(`facts.${index}.value`)} />
                </div>
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Images" description="Images used on attraction cards and the detail page" columns={2}>
          <AttachmentField
            label="Featured Image"
            hint="Shown as a 16:10 card on the attractions listing (cropped to fit). 1280 × 800 px — 16:10."
            ownerType="place"
            ownerId={defaultValues?.id}
            role="FEATURED"
          />
          <AttachmentField
            label="Banner Image"
            hint="Full-width banner at the top of the attraction's detail page (cropped to fit, at least 640px tall on desktop). 1920 × 960 px — 2:1."
            ownerType="place"
            ownerId={defaultValues?.id}
            role="BANNER"
          />
          <div className="sm:col-span-2">
            <AttachmentGallery
              label="Gallery"
              hint="Shown as 4:3 tiles in the attraction's photo gallery (cropped to fit; the first photo shows wider if the gallery has an odd photo count). 1200 × 900 px — 4:3."
              ownerType="place"
              ownerId={defaultValues?.id}
              role="GALLERY"
            />
          </div>
        </FormSection>

        <FormSection title="Location" description="Pick the location on the map or enter coordinates manually. The embed URL remains optional." columns={2}>
          <div className="sm:col-span-2">
            <Controller
              name="routeMapId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Link map to trekking route"
                  placeholder={routeMapsLoading ? "Loading trekking routes…" : "No link — keep visitors on the map"}
                  hint="When set, clicking this attraction's map opens the chosen trekking route page on this site instead of an outside map. Create trekking routes under Travel → Trip Maps."
                  options={routeMapOptions}
                  {...field}
                />
              )}
            />
          </div>
          <Controller
            name="placeCoordinates"
            control={control}
            render={({ field }) => (
              <Input
                label="Coordinates"
                hint="Latitude, longitude — e.g. 27.988100, 86.925000"
                error={errors.placeCoordinates?.message}
                {...field}
              />
            )}
          />
          <Input label="Map Embed URL" error={errors.placeMap?.message} {...register("placeMap")} />
          <div className="sm:col-span-2">
            <PlaceLocationMap
              value={watchedCoordinates ?? ""}
              onChange={(value) => setValue("placeCoordinates", value, { shouldDirty: true, shouldValidate: true })}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Extra Notes" rows={2} error={errors.placeExtra?.message} {...register("placeExtra")} />
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
