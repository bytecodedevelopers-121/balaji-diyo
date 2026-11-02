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
import { MediaUrlField } from "@/components/media/MediaUrlField";
import { ScopedCategoryCreateDrawer } from "@/components/category/ScopedCategoryCreateDrawer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCategoriesByTypeKey } from "@/hooks/useCategoriesByTypeKey";
import { useInlineCreate } from "@/hooks/useInlineCreate";
import { useCreateCategory } from "@/hooks/queries/useCategories";
import { isRichTextEmpty } from "@/lib/richText";
import type { TeamMember, TeamMemberFormValues } from "@/types/team-member";

const schema = z.object({
  position: z.string().min(1, "Position is required"),
  positionOrder: z.number().min(0).optional(),
  slug: z.string().optional(),
  salutation: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  photoUrl: z.string().optional(),
  countryCode: z.string().min(1, "Country code is required"),
  countryName: z.string().min(1, "Country name is required"),
  memberAddress: z.string().min(1, "Address is required"),
  memberPhone: z.string().optional(),
  memberEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  memberFacebook: z.string().optional(),
  memberTwitter: z.string().optional(),
  memberInstagram: z.string().optional(),
  memberWebsite: z.string().optional(),
  quoteAbstract: z.string().optional(),
  quote: z.string().optional(),
  description: z.string().optional(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  categoryIds: z.array(z.string()).min(1, "Select at least one category").max(5, "Up to 5 categories"),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TeamMemberFormProps {
  defaultValues?: TeamMember;
  onSubmit: (data: TeamMemberFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function TeamMemberForm({ defaultValues, onSubmit, isLoading, submitLabel }: TeamMemberFormProps) {
  const { isOnline } = useOnlineStatus();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      position: defaultValues?.position ?? "",
      positionOrder: defaultValues?.positionOrder ?? 0,
      slug: defaultValues?.slug ?? "",
      salutation: defaultValues?.salutation ?? "",
      fullName: defaultValues?.fullName ?? "",
      photoUrl: defaultValues?.photoUrl ?? "",
      countryCode: defaultValues?.countryCode ?? "",
      countryName: defaultValues?.countryName ?? "",
      memberAddress: defaultValues?.memberAddress ?? "",
      memberPhone: defaultValues?.memberPhone ?? "",
      memberEmail: defaultValues?.memberEmail ?? "",
      memberFacebook: defaultValues?.memberFacebook ?? "",
      memberTwitter: defaultValues?.memberTwitter ?? "",
      memberInstagram: defaultValues?.memberInstagram ?? "",
      memberWebsite: defaultValues?.memberWebsite ?? "",
      quoteAbstract: defaultValues?.quoteAbstract ?? "",
      quote: defaultValues?.quote ?? "",
      description: defaultValues?.description ?? "",
      isFeatured: defaultValues?.isFeatured ?? false,
      isActive: defaultValues?.isActive ?? true,
      categoryIds: defaultValues?.categories.map((c) => c.id) ?? [],
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  // Team categorization uses the generic Category/CategoryType taxonomy,
  // scoped to whichever CategoryType has key "team".
  const teamCategories = useCategoriesByTypeKey("team");
  const categoryCreate = useInlineCreate(useCreateCategory(), (res) => ({ value: res.data.id, label: res.data.title }));

  const submit = (values: FormValues) => {
    onSubmit({
      position: values.position,
      positionOrder: values.positionOrder,
      slug: values.slug || undefined,
      salutation: values.salutation || undefined,
      fullName: values.fullName,
      photoUrl: values.photoUrl || undefined,
      countryCode: values.countryCode,
      countryName: values.countryName,
      memberAddress: values.memberAddress,
      memberPhone: values.memberPhone || undefined,
      memberEmail: values.memberEmail || undefined,
      memberFacebook: values.memberFacebook || undefined,
      memberTwitter: values.memberTwitter || undefined,
      memberInstagram: values.memberInstagram || undefined,
      memberWebsite: values.memberWebsite || undefined,
      quoteAbstract: values.quoteAbstract || undefined,
      quote: values.quote || undefined,
      description: isRichTextEmpty(values.description) ? undefined : values.description,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      categoryIds: values.categoryIds,
      metaTitle: values.metaTitle || undefined,
      metaKeywords: values.metaKeywords || undefined,
      metaDescription: values.metaDescription || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-6">
        <FormSection title="Profile" columns={2}>
          <Input label="Salutation" hint="e.g. Mr, Ms, Dr" error={errors.salutation?.message} {...register("salutation")} />
          <Input label="Full Name" required error={errors.fullName?.message} {...register("fullName")} />
          <Input label="Position" required error={errors.position?.message} {...register("position")} />
          <Input
            label="Position Order"
            type="number"
            error={errors.positionOrder?.message}
            {...register("positionOrder", { valueAsNumber: true })}
          />
          <Input
            label="Slug"
            hint="Leave blank to auto-generate from the name"
            error={errors.slug?.message}
            {...register("slug")}
          />
          <div className="sm:col-span-2">
            <Controller
              name="photoUrl"
              control={control}
              render={({ field }) => (
                <MediaUrlField
                  label="Photo"
                  hint="Portrait headshot shown on the team grid and member page (cropped to fit). 800 × 1000 px — 4:5."
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.photoUrl?.message}
                  folder="team"
                />
              )}
            />
          </div>
          <div className="flex items-end gap-4">
            <Checkbox label="Featured" {...register("isFeatured")} />
            <Checkbox label="Active" {...register("isActive")} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio / Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Team member bio…" />
              )}
            />
          </div>
        </FormSection>

        <FormSection title="Contact" columns={2}>
          <Input label="Country Code" required error={errors.countryCode?.message} {...register("countryCode")} />
          <Input label="Country Name" required error={errors.countryName?.message} {...register("countryName")} />
          <div className="sm:col-span-2">
            <Textarea label="Address" rows={2} required error={errors.memberAddress?.message} {...register("memberAddress")} />
          </div>
          <Input label="Phone" error={errors.memberPhone?.message} {...register("memberPhone")} />
          <Input label="Email" type="email" error={errors.memberEmail?.message} {...register("memberEmail")} />
          <Input label="Facebook" error={errors.memberFacebook?.message} {...register("memberFacebook")} />
          <Input label="Twitter" error={errors.memberTwitter?.message} {...register("memberTwitter")} />
          <Input label="Instagram" error={errors.memberInstagram?.message} {...register("memberInstagram")} />
          <Input label="Website" error={errors.memberWebsite?.message} {...register("memberWebsite")} />
        </FormSection>

        <FormSection title="Quote" columns={2}>
          <Input label="Quote Abstract" error={errors.quoteAbstract?.message} {...register("quoteAbstract")} />
          <Input label="Quote" error={errors.quote?.message} {...register("quote")} />
        </FormSection>

        <FormSection title="Categories" columns={2}>
          <div className="sm:col-span-2">
            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Categories <span className="text-red-500">*</span>
                  </label>
                  {teamCategories.categoryType ? (
                    <MultiSelectTags
                      options={teamCategories.options}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add category…"
                      create={{
                        label: "Category",
                        render: ({ isOpen, onClose, onCreated }) => (
                          <ScopedCategoryCreateDrawer
                            isOpen={isOpen}
                            onClose={onClose}
                            typeLabel="Team"
                            onSubmit={(data) =>
                              categoryCreate.submit({ ...data, typeId: teamCategories.categoryType!.id }, onCreated)
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
                      No "team" category type exists yet — create one under Category Types first.
                    </p>
                  )}
                  {errors.categoryIds && <p className="mt-1 text-xs text-red-600">{errors.categoryIds.message}</p>}
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
