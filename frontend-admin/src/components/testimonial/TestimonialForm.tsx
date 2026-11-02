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
import { PackageCreateDrawer } from "@/components/package/PackageCreateDrawer";
import { TeamMemberCreateDrawer } from "@/components/team-member/TeamMemberCreateDrawer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useInlineCreate } from "@/hooks/useInlineCreate";
import { usePackages, useCreatePackage } from "@/hooks/queries/usePackages";
import { useTeamMembers, useCreateTeamMember } from "@/hooks/queries/useTeamMembers";
import { toNumber } from "@/lib/decimal";
import { stripHtml } from "@/lib/richText";
import type { Testimonial, TestimonialFormValues } from "@/types/testimonial";

const schema = z.object({
  slug: z.string().optional(),
  salutation: z.string().optional(),
  fullName: z.string().min(1, "Full name is required"),
  reviewAbstract: z.string().optional(),
  reviewTitle: z.string().optional(),
  review: z.string().refine((v) => stripHtml(v).length >= 1, "Review is required"),
  reviewRating: z.number().min(0).max(10).optional(),
  reviewDate: z.string().optional(),
  countryCode: z.string().min(1, "Country code is required"),
  countryName: z.string().min(1, "Country name is required"),
  address: z.string().optional(),
  affiliateOrganization: z.string().optional(),
  organizationAddress: z.string().optional(),
  organizationPosition: z.string().optional(),
  organizationDescription: z.string().optional(),
  organizationLink: z.string().optional(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  packageIds: z.array(z.string()).min(1, "Select at least one package"),
  memberIds: z.array(z.string()),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TestimonialFormProps {
  defaultValues?: Testimonial;
  onSubmit: (data: TestimonialFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function TestimonialForm({ defaultValues, onSubmit, isLoading, submitLabel }: TestimonialFormProps) {
  const { isOnline } = useOnlineStatus();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: defaultValues?.slug ?? "",
      salutation: defaultValues?.salutation ?? "",
      fullName: defaultValues?.fullName ?? "",
      reviewAbstract: defaultValues?.reviewAbstract ?? "",
      reviewTitle: defaultValues?.reviewTitle ?? "",
      review: defaultValues?.review ?? "",
      reviewRating: toNumber(defaultValues?.reviewRating),
      reviewDate: defaultValues?.reviewDate?.slice(0, 10) ?? "",
      countryCode: defaultValues?.countryCode ?? "",
      countryName: defaultValues?.countryName ?? "",
      address: defaultValues?.address ?? "",
      affiliateOrganization: defaultValues?.affiliateOrganization ?? "",
      organizationAddress: defaultValues?.organizationAddress ?? "",
      organizationPosition: defaultValues?.organizationPosition ?? "",
      organizationDescription: defaultValues?.organizationDescription ?? "",
      organizationLink: defaultValues?.organizationLink ?? "",
      isFeatured: defaultValues?.isFeatured ?? false,
      isActive: defaultValues?.isActive ?? true,
      packageIds: defaultValues?.packages.map((p) => p.id) ?? [],
      memberIds: defaultValues?.members.map((m) => m.id) ?? [],
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const { data: packagesData, isError: packagesError } = usePackages({ perPage: 200 });
  const packageOptions = (packagesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.title }));

  const { data: membersData } = useTeamMembers({ perPage: 200, isActive: true });
  const memberOptions = (membersData?.data.items ?? []).map((m) => ({ value: m.id, label: m.fullName }));

  const packageCreate = useInlineCreate(useCreatePackage(), (res) => ({ value: res.data.id, label: res.data.title }));
  const memberCreate = useInlineCreate(useCreateTeamMember(), (res) => ({ value: res.data.id, label: res.data.fullName }));

  const submit = (values: FormValues) => {
    onSubmit({
      slug: values.slug || undefined,
      salutation: values.salutation || undefined,
      fullName: values.fullName,
      reviewAbstract: values.reviewAbstract || undefined,
      reviewTitle: values.reviewTitle || undefined,
      review: values.review,
      reviewRating: values.reviewRating,
      reviewDate: values.reviewDate || undefined,
      countryCode: values.countryCode,
      countryName: values.countryName,
      address: values.address || undefined,
      affiliateOrganization: values.affiliateOrganization || undefined,
      organizationAddress: values.organizationAddress || undefined,
      organizationPosition: values.organizationPosition || undefined,
      organizationDescription: values.organizationDescription || undefined,
      organizationLink: values.organizationLink || undefined,
      isFeatured: values.isFeatured,
      isActive: values.isActive,
      packageIds: values.packageIds,
      memberIds: values.memberIds,
      metaTitle: values.metaTitle || undefined,
      metaKeywords: values.metaKeywords || undefined,
      metaDescription: values.metaDescription || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-6">
        <FormSection title="Reviewer" columns={2}>
          <Input label="Salutation" hint="e.g. Mr, Ms, Dr" error={errors.salutation?.message} {...register("salutation")} />
          <Input label="Full Name" required error={errors.fullName?.message} {...register("fullName")} />
          <Input
            label="Slug"
            hint="Leave blank to auto-generate from the name"
            error={errors.slug?.message}
            {...register("slug")}
          />
          <Input label="Country Code" required error={errors.countryCode?.message} {...register("countryCode")} />
          <Input label="Country Name" required error={errors.countryName?.message} {...register("countryName")} />
          <div className="sm:col-span-2">
            <Textarea label="Address" rows={2} error={errors.address?.message} {...register("address")} />
          </div>
          <div className="flex gap-4">
            <Checkbox label="Featured" {...register("isFeatured")} />
            <Checkbox label="Active" {...register("isActive")} />
          </div>
        </FormSection>

        <FormSection title="Review" columns={2}>
          <Input label="Review Title" error={errors.reviewTitle?.message} {...register("reviewTitle")} />
          <Input
            label="Rating"
            type="number"
            step="0.1"
            min={0}
            max={10}
            error={errors.reviewRating?.message}
            {...register("reviewRating", { valueAsNumber: true })}
          />
          <Input label="Review Date" type="date" error={errors.reviewDate?.message} {...register("reviewDate")} />
          <div className="sm:col-span-2">
            <Textarea label="Review Abstract" rows={2} error={errors.reviewAbstract?.message} {...register("reviewAbstract")} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Review <span className="text-red-500">*</span>
            </label>
            <Controller
              name="review"
              control={control}
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Write the review…" />
              )}
            />
            {errors.review && <p className="mt-1 text-xs text-red-600">{errors.review.message}</p>}
          </div>
        </FormSection>

        <FormSection title="Affiliate Organization" description="Optional — for corporate or agency reviewers" columns={2}>
          <Input label="Organization Name" error={errors.affiliateOrganization?.message} {...register("affiliateOrganization")} />
          <Input label="Position" error={errors.organizationPosition?.message} {...register("organizationPosition")} />
          <Input label="Organization Address" error={errors.organizationAddress?.message} {...register("organizationAddress")} />
          <Input label="Organization Link" error={errors.organizationLink?.message} {...register("organizationLink")} />
          <div className="sm:col-span-2">
            <Textarea
              label="Organization Description"
              rows={2}
              error={errors.organizationDescription?.message}
              {...register("organizationDescription")}
            />
          </div>
        </FormSection>

        <FormSection title="Links" columns={2}>
          <div className="sm:col-span-2">
            <Controller
              name="packageIds"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Packages <span className="text-red-500">*</span>
                  </label>
                  {packagesError ? (
                    <p className="text-xs text-gray-500">
                      Couldn't load packages — you may not have permission, or none exist yet.
                    </p>
                  ) : (
                    <MultiSelectTags
                      options={packageOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add package…"
                      create={{
                        label: "Package",
                        render: ({ isOpen, onClose, onCreated }) => (
                          <PackageCreateDrawer
                            isOpen={isOpen}
                            onClose={onClose}
                            onSubmit={(data) => packageCreate.submit(data, onCreated)}
                            isLoading={packageCreate.isLoading}
                            error={packageCreate.error}
                            onDismissError={packageCreate.clearError}
                          />
                        ),
                      }}
                    />
                  )}
                  {errors.packageIds && <p className="mt-1 text-xs text-red-600">{errors.packageIds.message}</p>}
                </div>
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <Controller
              name="memberIds"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Team Members</label>
                  <MultiSelectTags
                    options={memberOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Tag a team member…"
                    create={{
                      label: "Team Member",
                      render: ({ isOpen, onClose, onCreated }) => (
                        <TeamMemberCreateDrawer
                          isOpen={isOpen}
                          onClose={onClose}
                          onSubmit={(data) => memberCreate.submit(data, onCreated)}
                          isLoading={memberCreate.isLoading}
                          error={memberCreate.error}
                          onDismissError={memberCreate.clearError}
                        />
                      ),
                    }}
                  />
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
