import { useForm, useFieldArray, useWatch, Controller, type Control, type Path, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/form/FormSection";
import { Repeater } from "@/components/form/Repeater";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { stripHtml } from "@/lib/richText";
import { MultiSelectTags } from "@/components/ui/MultiSelectTags";
import { CreatableSelect } from "@/components/ui/CreatableSelect";
import { SectionedLayout, SectionAnchor, type PanelSection } from "@/components/form/SectionedLayout";
import { PACKAGE_FORM_ID } from "@/components/package/packageFormTabs";
import { AttachmentField } from "@/components/media/AttachmentField";
import { AttachmentGallery } from "@/components/media/AttachmentGallery";
import { CostCategoriesEditor } from "@/components/package/CostCategoriesEditor";
import { groupCostDetails, toCostDetailPayload, type CostFormShape } from "@/components/package/costCategoryGroups";
import { LegacyPackagePhotos } from "@/components/package/LegacyPackagePhotos";
import { ScopedCategoryCreateDrawer } from "@/components/category/ScopedCategoryCreateDrawer";
import { PlaceCreateDrawer } from "@/components/place/PlaceCreateDrawer";
import { FaqFormDrawer } from "@/components/faq/FaqFormDrawer";
import { GroupFaqFormDrawer } from "@/components/group-faq/GroupFaqFormDrawer";
import { TripInfoFormDrawer } from "@/components/trip-info/TripInfoFormDrawer";
import { PackageCreateDrawer } from "@/components/package/PackageCreateDrawer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useInlineCreate } from "@/hooks/useInlineCreate";
import { useCategoriesByTypeKey } from "@/hooks/useCategoriesByTypeKey";
import { useCreateCategory } from "@/hooks/queries/useCategories";
import { usePlaces, useCreatePlace } from "@/hooks/queries/usePlaces";
import { useFaqs, useCreateFaq } from "@/hooks/queries/useFaqs";
import { useGroupFaqs, useCreateGroupFaq } from "@/hooks/queries/useGroupFaqs";
import { useTripInfos, useCreateTripInfo } from "@/hooks/queries/useTripInfos";
import { usePackages, useCreatePackage } from "@/hooks/queries/usePackages";
import { toNumber } from "@/lib/decimal";
import type { Package, PackageFormValues } from "@/types/package";
import type { CreateFaqDto } from "@/types/faq";
import type { CreateGroupFaqDto } from "@/types/group-faq";
import type { CreateTripInfoDto } from "@/types/trip-info";

/**
 * An optional number field fed by a plain `<input type="number">` via
 * `register(name, { valueAsNumber: true })`. When that input is left
 * blank, the DOM's own `input.valueAsNumber` (what `valueAsNumber: true`
 * reads) is `NaN`, not `undefined` — a native HTML quirk, not a
 * react-hook-form bug — so a bare `z.number().min(0).optional()` still
 * rejects it: `.optional()` only accepts `undefined`, and zod treats
 * `NaN` as a failed `z.number()` type check, not a missing value.
 *
 * That silently blocked the whole form (`discount`, `priceGroups[].
 * offerUnitPrice` — both genuinely optional, "leave blank if none"
 * fields): `handleSubmit` never calls `onSubmit` when validation fails,
 * and its default (`errors`-object-only) failure path shows no toast,
 * no alert, nothing beyond a small red per-field message — invisible
 * unless that exact field happens to already be in view. From the
 * "click Update Package" button's own perspective this reads as
 * "nothing happens" (confirmed live: `Everest Base Camp Trekking`'s
 * own real record has no discount set, so editing and saving *this*
 * real package hit exactly this — 2026-08-26). Preprocessing `NaN` back
 * to `undefined` before validation makes a blank input behave the way
 * "optional" already reads as meaning.
 */
const optionalNumber = (min = 0) =>
  z.preprocess(
    (v) => (typeof v === "number" && Number.isNaN(v) ? undefined : v),
    z.number().min(min).optional(),
  );

const priceGroupSchema = z.object({
  packageTier: z.string().min(1, "Tier name is required"),
  minPeople: z.number().int().min(1),
  maxPeople: z.number().int().min(1),
  shortDescription: z.string().optional(),
  unitPrice: z.number().min(0),
  offerUnitPrice: optionalNumber(),
  offerLabel: z.string().optional(),
  offerInformation: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const factSchema = z.object({
  factTitle: z.string().min(1, "Title is required"),
  factValue: z.string().min(1, "Value is required"),
});

const addOnSchema = z.object({
  addonTitle: z.string().min(1, "Title is required"),
  addonDescription: z.string().optional(),
  addonPrice: z.number().min(0),
  addonUnit: z.string().optional(),
  chargeBy: z.enum(["PERSON", "ROOM", "FLAT"]),
  peoplePerRoom: z.number().int().min(1),
});

const tierSchema = z.object({
  packageTier: z.string().min(1, "Tier name is required"),
  packageTierAlias: z.string().min(1, "Alias is required"),
  packageTierDescription: z.string().min(1, "Description is required"),
  costIncludes: z.string().optional(),
  costExcludes: z.string().optional(),
  wetravelUuid: z.string().optional(),
});

const costGroupSchema = z.object({
  costCategoryId: z.string(),
  detailKey: z.string(),
  html: z.string(),
});

const extraFaqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  // Plain .min(1) doesn't actually catch an empty answer here — the rich
  // text editor emits "<p></p>" for empty content, which trivially satisfies
  // .min(1). stripHtml() checks the visible text instead.
  answer: z.string().refine((v) => stripHtml(v).length >= 1, "Answer is required"),
});

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().optional(),
  urlTitle: z.string().optional(),
  canonical: z.string().optional(),
  abstract: z.string().optional(),
  details: z.string().optional(),
  tripInfoText: z.string().optional(),
  highlights: z.string().optional(),
  packingListIntro: z.string().optional(),

  price: z.number().min(0, "Price is required"),
  duration: z.number().min(0, "Duration is required"),
  durationType: z.string().min(1, "Duration type is required"),
  groupSize: z.string().optional(),
  discount: optionalNumber(),
  maxAltitude: z.string().optional(),
  geoLongitude: z.string().optional(),
  geoLatitude: z.string().optional(),
  usefulInfo: z.string().optional(),
  departureNote: z.string().optional(),
  additionalField1: z.string().optional(),
  additionalField2: z.string().optional(),
  isFeatured: z.boolean(),
  isPopular: z.boolean(),
  isActive: z.boolean(),
  publishedAt: z.string().optional(),

  destinationId: z.string().min(1, "Destination is required"),
  gradeId: z.string().optional(),
  styleId: z.string().optional(),
  transportationId: z.string().optional(),
  mealsId: z.string().optional(),
  accommodationId: z.string().optional(),

  categoryIds: z.array(z.string()),
  faqCategoryIds: z.array(z.string()),
  placeIds: z.array(z.string()),
  faqIds: z.array(z.string()),
  groupFaqIds: z.array(z.string()),
  tripInfoIds: z.array(z.string()),
  customRelatedIds: z.array(z.string()),

  priceGroups: z.array(priceGroupSchema),
  facts: z.array(factSchema),
  addOns: z.array(addOnSchema),
  tiers: z.array(tierSchema),
  extraFaqs: z.array(extraFaqSchema),
  costIncludes: z.array(costGroupSchema),
  costExcludes: z.array(costGroupSchema),

  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const OVERVIEW_SECTIONS: PanelSection[] = [
  { id: "basic-information", label: "Basic Information" },
  { id: "categorization", label: "Categorization" },
  { id: "pricing", label: "Pricing" },
  { id: "meta-details", label: "Meta Details" },
  { id: "introduction", label: "Introduction" },
  { id: "status", label: "Status" },
];

const INCLUSION_SECTIONS: PanelSection[] = [
  { id: "cost-includes", label: "Includes" },
  { id: "cost-excludes", label: "Excludes" },
  { id: "package-tiers", label: "Package Tiers" },
  { id: "add-ons", label: "Add-ons" },
];

const FACTS_SECTIONS: PanelSection[] = [
  { id: "trip-facts", label: "Trip Facts" },
  { id: "trip-highlights", label: "Trip Highlights" },
  { id: "departure-note", label: "Departure Note" },
  { id: "good-to-know", label: "Good to Know" },
  { id: "trip-info", label: "Trip Info" },
  { id: "faqs", label: "FAQs" },
  { id: "related", label: "Related" },
  { id: "additional", label: "Additional" },
  { id: "trip-map", label: "Trip Map" },
];

const GEAR_SECTIONS: PanelSection[] = [{ id: "packing-list", label: "Packing List" }];

const PACKAGE_OWNER_TYPE = "package";

interface PackageFormProps {
  defaultValues?: Package;
  onSubmit: (data: PackageFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
  /** Which of PACKAGE_FORM_TABS to show. The tab bar is owned by the page. */
  activeTab: string;
}

export function PackageForm({ defaultValues, onSubmit, isLoading, submitLabel, activeTab }: PackageFormProps) {
  const { isOnline } = useOnlineStatus();
  const tab = activeTab;

  /**
   * `Package.extraFaqs` is typed as `ExtraFaqItem[] | null`, but the real
   * migrated data doesn't always agree: some packages (legacy raw-HTML FAQ
   * content, never restructured into question/answer pairs) store an
   * object shape instead — `{ raw: "<h2>FAQs</h2>..." }` — confirmed live
   * against "Everest Base Camp Trekking"'s own real record. This form's
   * "FAQs" repeater can only edit the structured array shape, so:
   * - the array-typed default below falls back to `[]` for a non-array
   *   value, so `zodResolver`'s `z.array(extraFaqSchema)` doesn't reject
   *   the whole form outright (it used to: "Invalid input: expected
   *   array, received object" — a *silent* failure, since `handleSubmit`
   *   has no `onInvalid` handler and this field's error never renders on
   *   whichever tab happens to be active — exactly what made "Update
   *   Package" look like it did nothing, 2026-08-26)
   * - `submit()` below only sends `extraFaqs` back if it started out
   *   array-shaped, so an edit to some *other* field on a raw-HTML
   *   package doesn't silently overwrite that real content with `[]`.
   */
  const extraFaqsIsStructured = Array.isArray(defaultValues?.extraFaqs);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      slug: defaultValues?.slug ?? "",
      urlTitle: defaultValues?.urlTitle ?? "",
      canonical: defaultValues?.canonical ?? "",
      abstract: defaultValues?.abstract ?? "",
      details: defaultValues?.details ?? "",
      tripInfoText: defaultValues?.tripInfoText ?? "",
      highlights: defaultValues?.highlights ?? "",
      packingListIntro: defaultValues?.packingListIntro ?? "",

      price: toNumber(defaultValues?.price) ?? 0,
      duration: toNumber(defaultValues?.duration) ?? 0,
      durationType: defaultValues?.durationType ?? "",
      groupSize: defaultValues?.groupSize ?? "",
      discount: toNumber(defaultValues?.discount),
      maxAltitude: defaultValues?.maxAltitude ?? "",
      geoLongitude: defaultValues?.geoLongitude ?? "",
      geoLatitude: defaultValues?.geoLatitude ?? "",
      usefulInfo: defaultValues?.usefulInfo ?? "",
      departureNote: defaultValues?.departureNote ?? "",
      additionalField1: defaultValues?.additionalField1 ?? "",
      additionalField2: defaultValues?.additionalField2 ?? "",
      isFeatured: defaultValues?.isFeatured ?? false,
      isPopular: defaultValues?.isPopular ?? false,
      isActive: defaultValues?.isActive ?? true,
      publishedAt: defaultValues?.publishedAt?.slice(0, 10) ?? "",

      destinationId: defaultValues?.destinationId ?? "",
      gradeId: defaultValues?.gradeId ?? "",
      styleId: defaultValues?.styleId ?? "",
      transportationId: defaultValues?.transportationId ?? "",
      mealsId: defaultValues?.mealsId ?? "",
      accommodationId: defaultValues?.accommodationId ?? "",

      categoryIds: defaultValues?.categories.map((c) => c.id) ?? [],
      faqCategoryIds: defaultValues?.faqCategories.map((c) => c.id) ?? [],
      placeIds: defaultValues?.places.map((p) => p.id) ?? [],
      faqIds: defaultValues?.faqs.map((f) => f.id) ?? [],
      groupFaqIds: defaultValues?.groupFaqs.map((f) => f.id) ?? [],
      tripInfoIds: defaultValues?.tripInfos.map((t) => t.id) ?? [],
      customRelatedIds: defaultValues?.customRelated.map((p) => p.id) ?? [],

      priceGroups:
        defaultValues?.priceGroups.map((p) => ({
          packageTier: p.packageTier,
          minPeople: p.minPeople,
          maxPeople: p.maxPeople,
          shortDescription: p.shortDescription ?? "",
          unitPrice: toNumber(p.unitPrice) ?? 0,
          offerUnitPrice: toNumber(p.offerUnitPrice),
          offerLabel: p.offerLabel ?? "",
          offerInformation: p.offerInformation ?? "",
          isDefault: p.isDefault,
        })) ?? [],
      facts: defaultValues?.facts.map((f) => ({ factTitle: f.factTitle, factValue: f.factValue })) ?? [],
      addOns:
        defaultValues?.addOns.map((a) => ({
          addonTitle: a.addonTitle,
          addonDescription: a.addonDescription ?? "",
          addonPrice: toNumber(a.addonPrice) ?? 0,
          addonUnit: a.addonUnit ?? "",
          chargeBy: a.chargeBy,
          peoplePerRoom: a.peoplePerRoom,
        })) ?? [],
      tiers:
        defaultValues?.tiers.map((t) => ({
          packageTier: t.packageTier,
          packageTierAlias: t.packageTierAlias,
          packageTierDescription: t.packageTierDescription,
          costIncludes: t.costIncludes ?? "",
          costExcludes: t.costExcludes ?? "",
          wetravelUuid: t.wetravelUuid ?? "",
        })) ?? [],
      extraFaqs: Array.isArray(defaultValues?.extraFaqs) ? defaultValues.extraFaqs : [],
      costIncludes: groupCostDetails(defaultValues?.costDetails, "INCLUDE"),
      costExcludes: groupCostDetails(defaultValues?.costDetails, "EXCLUDE"),

      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const priceGroupsArray = useFieldArray({ control, name: "priceGroups" });
  const factsArray = useFieldArray({ control, name: "facts" });
  const addOnsArray = useFieldArray({ control, name: "addOns" });
  const watchedAddOns = useWatch({ control, name: "addOns" });
  const tiersArray = useFieldArray({ control, name: "tiers" });
  const extraFaqsArray = useFieldArray({ control, name: "extraFaqs" });

  // Classification pickers — each scoped to the CategoryType of the same key,
  // per the schema's own comment listing these as example keys.
  const destination = useCategoriesByTypeKey("destination");
  const grade = useCategoriesByTypeKey("trip_gradings");
  const style = useCategoriesByTypeKey("trip_style");
  const transportation = useCategoriesByTypeKey("transportation");
  const meals = useCategoriesByTypeKey("meals");
  const accommodation = useCategoriesByTypeKey("accommodation");
  // The "Categories" tags (Nepal Tours, Everest Region Treks, ...) that decide
  // which public category pages a package appears on live in the same
  // "destination" tree as the single Destination field above — that's how the
  // legacy data is modeled (there is no separate "package" category type).
  const generalCategories = useCategoriesByTypeKey("destination");
  // Package's "FAQ categories" pulls from the same taxonomy GroupFAQ questions are grouped under.
  const faqCategories = useCategoriesByTypeKey("faq-group");

  const { data: placesData } = usePlaces({ perPage: 200, isActive: true });
  const placeOptions = (placesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.placeName }));

  const { data: faqsData } = useFaqs({ perPage: 200, isActive: true });
  const faqOptions = (faqsData?.data.items ?? []).map((f) => ({ value: f.id, label: f.question }));

  const { data: groupFaqsData } = useGroupFaqs({ perPage: 200, isActive: true });
  const groupFaqOptions = (groupFaqsData?.data.items ?? []).map((f) => ({ value: f.id, label: f.question }));

  const { data: tripInfosData } = useTripInfos({ perPage: 200, isActive: true });
  const tripInfoOptions = (tripInfosData?.data.items ?? []).map((t) => ({ value: t.id, label: t.title }));

  const { data: relatedPackagesData } = usePackages({ perPage: 200 });
  const relatedPackageOptions = (relatedPackagesData?.data.items ?? [])
    .filter((p) => p.id !== defaultValues?.id)
    .map((p) => ({ value: p.id, label: p.title }));

  // One useCreateCategory() mutation, reused for all 8 category-based pickers
  // (each ScopedCategoryCreateDrawer attaches its own scope's typeId on submit).
  const categoryCreate = useInlineCreate(useCreateCategory(), (res) => ({ value: res.data.id, label: res.data.title }));
  const placeCreate = useInlineCreate(useCreatePlace(), (res) => ({ value: res.data.id, label: res.data.placeName }));
  const faqCreate = useInlineCreate(useCreateFaq(), (res) => ({ value: res.data.id, label: res.data.question }));
  const groupFaqCreate = useInlineCreate(useCreateGroupFaq(), (res) => ({ value: res.data.id, label: res.data.question }));
  const tripInfoCreate = useInlineCreate(useCreateTripInfo(), (res) => ({ value: res.data.id, label: res.data.title }));
  const relatedPackageCreate = useInlineCreate(useCreatePackage(), (res) => ({ value: res.data.id, label: res.data.title }));

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      urlTitle: values.urlTitle || undefined,
      canonical: values.canonical || undefined,
      abstract: values.abstract || undefined,
      details: values.details || undefined,
      tripInfoText: values.tripInfoText || undefined,
      highlights: values.highlights || undefined,
      packingListIntro: values.packingListIntro || undefined,
      // Omitted entirely (not sent as `[]`) for a package whose real
      // extraFaqs isn't the structured shape this form can edit — see
      // `extraFaqsIsStructured`'s own doc comment above. `extraFaqs` is
      // optional on both `PackageFormValues` and the backend's update DTO,
      // so leaving the key out is a real no-op, not a workaround.
      ...(extraFaqsIsStructured ? { extraFaqs: values.extraFaqs } : {}),

      price: values.price,
      duration: values.duration,
      durationType: values.durationType,
      groupSize: values.groupSize || undefined,
      discount: values.discount,
      maxAltitude: values.maxAltitude || undefined,
      geoLongitude: values.geoLongitude || undefined,
      geoLatitude: values.geoLatitude || undefined,
      usefulInfo: values.usefulInfo || undefined,
      departureNote: values.departureNote || undefined,
      additionalField1: values.additionalField1 || undefined,
      additionalField2: values.additionalField2 || undefined,
      isFeatured: values.isFeatured,
      isPopular: values.isPopular,
      isActive: values.isActive,
      publishedAt: values.publishedAt || undefined,

      destinationId: values.destinationId,
      gradeId: values.gradeId || undefined,
      styleId: values.styleId || undefined,
      transportationId: values.transportationId || undefined,
      mealsId: values.mealsId || undefined,
      accommodationId: values.accommodationId || undefined,

      categoryIds: values.categoryIds,
      faqCategoryIds: values.faqCategoryIds,
      placeIds: values.placeIds,
      faqIds: values.faqIds,
      groupFaqIds: values.groupFaqIds,
      tripInfoIds: values.tripInfoIds,
      customRelatedIds: values.customRelatedIds,

      priceGroups: values.priceGroups,
      facts: values.facts,
      addOns: values.addOns,
      tiers: values.tiers,
      costIncludes: toCostDetailPayload(values.costIncludes),
      costExcludes: toCostDetailPayload(values.costExcludes),

      metaTitle: values.metaTitle || undefined,
      metaKeywords: values.metaKeywords || undefined,
      metaDescription: values.metaDescription || undefined,
    });
  };

  type ScopedCategories = { categoryType: { id: string } | undefined; options: { value: string; label: string }[] };

  const categoryCreateDrawer = (scoped: ScopedCategories, label: string) => ({
    label: "Category",
    render: ({
      isOpen,
      onClose,
      onCreated,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onCreated: (opt: { value: string; label: string }) => void;
    }) => (
      <ScopedCategoryCreateDrawer
        isOpen={isOpen}
        onClose={onClose}
        typeLabel={label}
        onSubmit={(data) => categoryCreate.submit({ ...data, typeId: scoped.categoryType!.id }, onCreated)}
        isLoading={categoryCreate.isLoading}
        error={categoryCreate.error}
        onDismissError={categoryCreate.clearError}
      />
    ),
  });

  const scopedPicker = (scoped: ScopedCategories, name: "categoryIds" | "faqCategoryIds", label: string, keyLabel: string) => (
    <div className="sm:col-span-2">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
            {scoped.categoryType ? (
              <MultiSelectTags
                options={scoped.options}
                value={field.value}
                onChange={field.onChange}
                placeholder={`Add ${label.toLowerCase()}…`}
                create={categoryCreateDrawer(scoped, label)}
              />
            ) : (
              <p className="text-xs text-gray-500">
                No "{keyLabel}" category type exists yet — create one under Category Types first.
              </p>
            )}
          </div>
        )}
      />
    </div>
  );

  const singleScopedPicker = (
    scoped: ScopedCategories,
    name: "destinationId" | "gradeId" | "styleId" | "transportationId" | "mealsId" | "accommodationId",
    label: string,
    keyLabel: string,
    required = false,
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {scoped.categoryType ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <CreatableSelect
              options={scoped.options}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder={required ? `Select ${label.toLowerCase()}…` : "None"}
              error={errors[name]?.message}
              create={categoryCreateDrawer(scoped, label)}
            />
          )}
        />
      ) : (
        <p className="text-xs text-gray-500">No "{keyLabel}" category type exists yet — create one under Category Types first.</p>
      )}
    </div>
  );

  // Multi-select over another module's records, each with its own inline
  // "+ Create New" drawer. Same shape for places/FAQs/group FAQs/trip infos/
  // related packages, so it's one helper rather than five copies.
  const relationPicker = (
    name: "placeIds" | "faqIds" | "groupFaqIds" | "tripInfoIds" | "customRelatedIds",
    label: string,
    options: { value: string; label: string }[],
    createLabel: string,
    renderDrawer: (props: {
      isOpen: boolean;
      onClose: () => void;
      onCreated: (opt: { value: string; label: string }) => void;
    }) => React.ReactNode,
  ) => (
    <div className="sm:col-span-2">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
            <MultiSelectTags
              options={options}
              value={field.value}
              onChange={field.onChange}
              placeholder={`Add ${label.toLowerCase()}…`}
              create={{ label: createLabel, render: renderDrawer }}
            />
          </div>
        )}
      />
    </div>
  );

  const placesPicker = relationPicker("placeIds", "Places", placeOptions, "Place", ({ isOpen, onClose, onCreated }) => (
    <PlaceCreateDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(data) => placeCreate.submit(data, onCreated)}
      isLoading={placeCreate.isLoading}
      error={placeCreate.error}
      onDismissError={placeCreate.clearError}
    />
  ));

  const faqsPicker = relationPicker("faqIds", "FAQs", faqOptions, "FAQ", ({ isOpen, onClose, onCreated }) => (
    <FaqFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      faq={null}
      onSubmit={(data) => faqCreate.submit(data as CreateFaqDto, onCreated)}
      isLoading={faqCreate.isLoading}
      error={faqCreate.error}
      onDismissError={faqCreate.clearError}
    />
  ));

  const groupFaqsPicker = relationPicker("groupFaqIds", "Group FAQs", groupFaqOptions, "Group FAQ", ({ isOpen, onClose, onCreated }) => (
    <GroupFaqFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      groupFaq={null}
      onSubmit={(data) => groupFaqCreate.submit(data as CreateGroupFaqDto, onCreated)}
      isLoading={groupFaqCreate.isLoading}
      error={groupFaqCreate.error}
      onDismissError={groupFaqCreate.clearError}
    />
  ));

  const tripInfosPicker = relationPicker("tripInfoIds", "Trip Info", tripInfoOptions, "Trip Info", ({ isOpen, onClose, onCreated }) => (
    <TripInfoFormDrawer
      isOpen={isOpen}
      onClose={onClose}
      tripInfo={null}
      onSubmit={(data) => tripInfoCreate.submit(data as CreateTripInfoDto, onCreated)}
      isLoading={tripInfoCreate.isLoading}
      error={tripInfoCreate.error}
      onDismissError={tripInfoCreate.clearError}
    />
  ));

  const relatedPackagesPicker = relationPicker(
    "customRelatedIds",
    "Related Packages",
    relatedPackageOptions,
    "Package",
    ({ isOpen, onClose, onCreated }) => (
      <PackageCreateDrawer
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={(data) => relatedPackageCreate.submit(data, onCreated)}
        isLoading={relatedPackageCreate.isLoading}
        error={relatedPackageCreate.error}
        onDismissError={relatedPackageCreate.clearError}
      />
    ),
  );

  const richText = (
    name: "abstract" | "details" | "highlights" | "tripInfoText" | "usefulInfo" | "departureNote" | "packingListIntro",
    label: string,
    placeholder?: string,
  ) => (
    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder={placeholder} />}
      />
    </div>
  );

  // Same as `richText` above, but for fields inside a Repeater row — the
  // field path includes the row's dynamic index (e.g. `costIncludes.0.detailDescription`),
  // so it can't be typed against the same fixed name union.
  const repeaterRichText = (name: Path<FormValues>, label: string, minHeight = 130) => (
    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RichTextEditor value={(field.value as string | null | undefined) ?? ""} onChange={field.onChange} minHeight={minHeight} />
        )}
      />
    </div>
  );

  return (
    <form id={PACKAGE_FORM_ID} onSubmit={handleSubmit(submit)} className="space-y-6">
      {!isOnline && <Alert variant="warning" message="You are offline. Changes are disabled." />}

      <fieldset disabled={!isOnline} className="space-y-6">
        {/* Every panel stays mounted (just hidden) so react-hook-form state —
            including field arrays and the rich text editors — survives tab switches. */}
        <div className={tab === "overview" ? "" : "hidden"}>
          <SectionedLayout sections={OVERVIEW_SECTIONS}>
            <SectionAnchor id="basic-information">
              <FormSection title="Basic Information" columns={2}>
                <div className="sm:col-span-2">
                  <Input label="Package Title" required error={errors.title?.message} {...register("title")} />
                </div>
                <Input label="URL Title" hint="Defaults to the package title" error={errors.urlTitle?.message} {...register("urlTitle")} />
                <Input label="Slug" hint="Leave blank to auto-generate" error={errors.slug?.message} {...register("slug")} />
                <div className="sm:col-span-2">
                  <Input label="Canonical" hint="Leave blank to use this package's own URL" error={errors.canonical?.message} {...register("canonical")} />
                </div>
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="categorization">
              <FormSection title="Categorization" columns={2}>
                <Input label="Package Duration" type="number" step="0.5" required error={errors.duration?.message} {...register("duration", { valueAsNumber: true })} />
                <Input label="Duration Unit" hint='e.g. "Days", "Nights"' required error={errors.durationType?.message} {...register("durationType")} />
                {singleScopedPicker(destination, "destinationId", "Package Destination", "destination", true)}
                <div />
                {scopedPicker(generalCategories, "categoryIds", "Categories", "destination")}
                {placesPicker}
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="pricing">
              <FormSection title="Pricing" description="Headline price — group-size tiers live under Group Price" columns={2}>
                <Input label="Price" type="number" step="0.01" required error={errors.price?.message} {...register("price", { valueAsNumber: true })} />
                <Input label="Discount" type="number" step="0.01" error={errors.discount?.message} {...register("discount", { valueAsNumber: true })} />
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="meta-details">
              <FormSection title="Meta Details" description="Overrides for search engines" columns={2}>
                <Input label="Meta Title" error={errors.metaTitle?.message} {...register("metaTitle")} />
                <Input label="Meta Keywords" error={errors.metaKeywords?.message} {...register("metaKeywords")} />
                <div className="sm:col-span-2">
                  <Textarea label="Meta Description" rows={3} error={errors.metaDescription?.message} {...register("metaDescription")} />
                </div>
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="introduction">
              <FormSection title="Introduction">
                {richText("abstract", "Abstract", "Short intro shown in listings…")}
                {richText("details", "Details", "Describe the trip…")}
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="status">
              <FormSection title="Tour Status" columns={2}>
                <Input
                  label="Published Date"
                  type="date"
                  hint="Shown in the Packages list — defaults to when the package was created"
                  error={errors.publishedAt?.message}
                  {...register("publishedAt")}
                />
                <div className="flex items-end gap-4">
                  <Checkbox label="Publish" {...register("isActive")} />
                  <Checkbox
                    label="Featured"
                    title="Shows in the Featured carousel and The 2026/27 Lineup"
                    {...register("isFeatured")}
                  />
                  <Checkbox
                    label="Popular"
                    title="Shows in the homepage's Most Popular Journeys section"
                    {...register("isPopular")}
                  />
                </div>
              </FormSection>
            </SectionAnchor>
          </SectionedLayout>
        </div>

        <div className={tab === "inclusion" ? "" : "hidden"}>
          <SectionedLayout sections={INCLUSION_SECTIONS}>
            {/* The editor only touches `costIncludes`/`costExcludes`, so it takes the form's control narrowed to just those two fields. */}
            <SectionAnchor id="cost-includes">
              <FormSection title="What's Included" description="Pick a category, then write what this package includes under it. Create new categories under Travel → Include / Exclude.">
                <CostCategoriesEditor control={control as unknown as Control<CostFormShape>} register={register as unknown as UseFormRegister<CostFormShape>} name="costIncludes" type="INCLUDE" />
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="cost-excludes">
              <FormSection title="What's Excluded" description="Same, for what the package does not cover.">
                <CostCategoriesEditor control={control as unknown as Control<CostFormShape>} register={register as unknown as UseFormRegister<CostFormShape>} name="costExcludes" type="EXCLUDE" />
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="package-tiers">
              <Repeater
                label="Package Tiers"
                description="Named tiers (e.g. Silver / Gold / Platinum)"
                fields={tiersArray.fields}
                onAdd={() => tiersArray.append({ packageTier: "", packageTierAlias: "", packageTierDescription: "" })}
                onRemove={tiersArray.remove}
                addLabel="+ Add package tier"
                emptyMessage="No tiers yet."
                renderRow={(_field, index) => (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Tier" required {...register(`tiers.${index}.packageTier`)} error={errors.tiers?.[index]?.packageTier?.message} />
                    <Input label="Alias" required {...register(`tiers.${index}.packageTierAlias`)} error={errors.tiers?.[index]?.packageTierAlias?.message} />
                    <div className="sm:col-span-2">
                      <Textarea label="Short Words" required rows={2} {...register(`tiers.${index}.packageTierDescription`)} error={errors.tiers?.[index]?.packageTierDescription?.message} />
                    </div>
                    {/* Cost Includes/Excludes used to be edited here as one rich-text blob per tier. They're now edited as categories in the Includes/Excludes sections above. The tier's existing values stay in form state (defaultValues) so saving doesn't wipe the legacy text. */}
                    <Input label="WeTravel UUID" {...register(`tiers.${index}.wetravelUuid`)} />
                  </div>
                )}
              />
            </SectionAnchor>

            <SectionAnchor id="add-ons">
              <Repeater
                label="Add-ons"
                description="Optional paid extras"
                fields={addOnsArray.fields}
                onAdd={() => addOnsArray.append({ addonTitle: "", addonDescription: "", addonPrice: 0, addonUnit: "", chargeBy: "PERSON", peoplePerRoom: 2 })}
                onRemove={addOnsArray.remove}
                emptyMessage="No add-ons yet."
                renderRow={(_field, index) => (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input label="Title" required {...register(`addOns.${index}.addonTitle`)} error={errors.addOns?.[index]?.addonTitle?.message} />
                    <Input label="Price" type="number" step="0.01" required {...register(`addOns.${index}.addonPrice`, { valueAsNumber: true })} />
                    <Input label="Unit" hint='Display text, e.g. "per person"' {...register(`addOns.${index}.addonUnit`)} />
                    <Select
                      label="Charged"
                      hint="Per person: price × travellers. Per room: price × rooms needed. Flat: fixed amount, whatever the group size."
                      options={[
                        { value: "PERSON", label: "Per person" },
                        { value: "ROOM", label: "Per room (shared)" },
                        { value: "FLAT", label: "Flat (once per booking)" },
                      ]}
                      {...register(`addOns.${index}.chargeBy`)}
                    />
                    {watchedAddOns?.[index]?.chargeBy === "ROOM" ? (
                      <Input
                        label="People per room"
                        type="number"
                        min={1}
                        hint="Travellers sharing one room. 5 people at 2 per room = 3 rooms."
                        {...register(`addOns.${index}.peoplePerRoom`, { valueAsNumber: true })}
                      />
                    ) : null}
                    {repeaterRichText(`addOns.${index}.addonDescription`, "Description")}
                  </div>
                )}
              />
            </SectionAnchor>
          </SectionedLayout>
        </div>

        <div className={tab === "photos" ? "space-y-6" : "hidden"}>
          <FormSection
            title="Images"
            description="The photo collage at the top of the package page. Whole photos are shown (never cropped), so upload at the exact size below for a clean fit. JPG or WebP, ideally under 1 MB each."
            columns={2}
          >
            <AttachmentField
              label="Featured Image"
              hint="Large photo, top-left of the package page (also the card photo on trip listings). 1600 × 1000 px — 16:10."
              ownerType={PACKAGE_OWNER_TYPE}
              ownerId={defaultValues?.id}
              role="FEATURED"
              aspect="16 / 10"
            />
            <AttachmentField
              label="Banner Image"
              hint="Second photo, top-right of the package page. 1100 × 600 px — 11:6."
              ownerType={PACKAGE_OWNER_TYPE}
              ownerId={defaultValues?.id}
              role="BANNER"
              aspect="11 / 6"
            />
          </FormSection>

          <FormSection
            title="Photo Gallery"
            description="The 1st and 2nd gallery photos fill the two small tiles under the Banner; any more open in the full-screen viewer (“+N photos”). Fewer photos in total means bigger tiles, but the sizes here are for the full layout."
          >
            <div className="sm:col-span-2">
              <AttachmentGallery
                ownerType={PACKAGE_OWNER_TYPE}
                ownerId={defaultValues?.id}
                role="GALLERY"
                label="Gallery"
                hint="Small tiles: 800 × 540 px — 3:2. Photos beyond the 2nd are only seen in the viewer, so any size ≥ 1200 px wide is fine."
              />
            </div>
          </FormSection>

          <FormSection
            title="Photos from the old site"
            description="Extra photos imported from the previous website. They still show on the package page (after the Featured and Banner images) but aren't the Featured/Banner image above. Hover a photo to remove it. Picking a new Banner Image above replaces the Banner photos listed here."
          >
            <div className="sm:col-span-2">
              <LegacyPackagePhotos ownerType={PACKAGE_OWNER_TYPE} ownerId={defaultValues?.id} />
            </div>
          </FormSection>
        </div>

        <div className={tab === "facts" ? "" : "hidden"}>
          <SectionedLayout sections={FACTS_SECTIONS}>
            <SectionAnchor id="trip-facts">
              <FormSection title="Trip Facts" columns={2}>
                {singleScopedPicker(grade, "gradeId", "Trip Grade", "trip_gradings")}
                {singleScopedPicker(style, "styleId", "Trip Style", "trip_style")}
                {singleScopedPicker(transportation, "transportationId", "Transportation", "transportation")}
                {singleScopedPicker(accommodation, "accommodationId", "Accommodation", "accommodation")}
                {singleScopedPicker(meals, "mealsId", "Meals", "meals")}
                <Input label="Group Size" error={errors.groupSize?.message} {...register("groupSize")} />
                <Input label="Max Altitude" error={errors.maxAltitude?.message} {...register("maxAltitude")} />
                <div />
                <Input label="Latitude" error={errors.geoLatitude?.message} {...register("geoLatitude")} />
                <Input label="Longitude" error={errors.geoLongitude?.message} {...register("geoLongitude")} />
              </FormSection>

              <div className="mt-4">
                <Repeater
                  label="Facts"
                  description="Key/value facts shown on the trip page"
                  fields={factsArray.fields}
                  onAdd={() => factsArray.append({ factTitle: "", factValue: "" })}
                  onRemove={factsArray.remove}
                  addLabel="+ Add more facts"
                  emptyMessage="No facts yet."
                  renderRow={(_field, index) => (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input label="Title" required {...register(`facts.${index}.factTitle`)} error={errors.facts?.[index]?.factTitle?.message} />
                      <Input label="Value" required {...register(`facts.${index}.factValue`)} error={errors.facts?.[index]?.factValue?.message} />
                    </div>
                  )}
                />
              </div>
            </SectionAnchor>

            <SectionAnchor id="trip-highlights">
              <FormSection title="Trip Highlights">{richText("highlights", "Highlights")}</FormSection>
            </SectionAnchor>

            <SectionAnchor id="departure-note">
              <FormSection title="Departure Note">{richText("departureNote", "Departure Note")}</FormSection>
            </SectionAnchor>

            <SectionAnchor id="good-to-know">
              <FormSection title="Good to Know">{richText("usefulInfo", "Useful Info")}</FormSection>
            </SectionAnchor>

            <SectionAnchor id="trip-info">
              <FormSection title="Trip Info" columns={2}>
                {tripInfosPicker}
                {richText("tripInfoText", "Trip Note")}
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="faqs">
              <FormSection title="FAQs" columns={2}>
                {scopedPicker(faqCategories, "faqCategoryIds", "FAQ Categories", "faq-group")}
                {faqsPicker}
                {groupFaqsPicker}
              </FormSection>

              <div className="mt-4">
                {!extraFaqsIsStructured && (
                  <div className="mb-4">
                    <Alert
                      variant="warning"
                      message="This package's FAQ content is legacy raw HTML, not the structured question/answer pairs below — it still renders on the public site, but isn't editable from this form. Adding an item here starts a fresh structured list instead; saving afterward replaces the legacy HTML with whatever's in this list."
                    />
                  </div>
                )}
                <Repeater
                  label="Extra FAQs"
                  description="Ad-hoc question/answer pairs specific to this package — not linked to the shared FAQ library"
                  fields={extraFaqsArray.fields}
                  onAdd={() => extraFaqsArray.append({ question: "", answer: "" })}
                  onRemove={extraFaqsArray.remove}
                  emptyMessage="No extra FAQs yet."
                  renderRow={(_field, index) => (
                    <div className="space-y-3">
                      <Input label="Question" required {...register(`extraFaqs.${index}.question`)} error={errors.extraFaqs?.[index]?.question?.message} />
                      {repeaterRichText(`extraFaqs.${index}.answer`, "Answer")}
                    </div>
                  )}
                />
              </div>
            </SectionAnchor>

            <SectionAnchor id="related">
              <FormSection title="Related" columns={2}>
                {relatedPackagesPicker}
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="additional">
              <FormSection title="Additional Fields" description="Free-form fields carried over from the legacy system, no fixed purpose" columns={2}>
                <Input label="Additional Field 1" error={errors.additionalField1?.message} {...register("additionalField1")} />
                <Input label="Additional Field 2" error={errors.additionalField2?.message} {...register("additionalField2")} />
              </FormSection>
            </SectionAnchor>

            <SectionAnchor id="trip-map">
              <FormSection title="Trip Map" description="Route/trek map shown on the package page" columns={2}>
                <AttachmentField label="Map Image" ownerType={PACKAGE_OWNER_TYPE} ownerId={defaultValues?.id} role="MAP" />
              </FormSection>
            </SectionAnchor>
          </SectionedLayout>
        </div>

        <div className={tab === "gear" ? "" : "hidden"}>
          <SectionedLayout sections={GEAR_SECTIONS}>
            {/*
              One rich-text (TipTap) field for the whole tab (2026-09-03,
              direct request: "let's just have a tiptap editor section for
              this instead of separating into diff categories") —
              supersedes the same-day-earlier "Intro" textarea + a
              category-grouped `gearItems` Repeater (with its own optional
              per-item photo). `packingListIntro` is the same field/column
              as that old "Intro" text; it just holds the entire Packing
              List content now, checklist and all — images go in inline
              via the editor's own Image tool (toolbar), so there's no
              separate photo picker to wire up here.
            */}
            <SectionAnchor id="packing-list">
              <FormSection title="Packing List" description="Shown on the public page's Gear tab">
                {richText("packingListIntro", "Packing List")}
              </FormSection>
            </SectionAnchor>
          </SectionedLayout>
        </div>

        <div className={tab === "group-price" ? "space-y-6" : "hidden"}>
          <Repeater
            label="Group Price"
            description="Per-group-size pricing tiers"
            fields={priceGroupsArray.fields}
            onAdd={() =>
              priceGroupsArray.append({ packageTier: "", minPeople: 1, maxPeople: 1, shortDescription: "", unitPrice: 0, isDefault: false })
            }
            onRemove={priceGroupsArray.remove}
            addLabel="+ Add price group"
            emptyMessage="No price groups yet."
            renderRow={(_field, index) => (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input label="Tier" required {...register(`priceGroups.${index}.packageTier`)} error={errors.priceGroups?.[index]?.packageTier?.message} />
                <Input label="Min People" type="number" required {...register(`priceGroups.${index}.minPeople`, { valueAsNumber: true })} />
                <Input label="Max People" type="number" required {...register(`priceGroups.${index}.maxPeople`, { valueAsNumber: true })} />
                <Input label="Unit Price" type="number" step="0.01" required {...register(`priceGroups.${index}.unitPrice`, { valueAsNumber: true })} />
                <Input label="Offer Price" type="number" step="0.01" {...register(`priceGroups.${index}.offerUnitPrice`, { valueAsNumber: true })} />
                <Input label="Offer Label" {...register(`priceGroups.${index}.offerLabel`)} />
                <div className="sm:col-span-3">
                  <Textarea label="Short Description" rows={2} {...register(`priceGroups.${index}.shortDescription`)} />
                </div>
                <div className="sm:col-span-3">
                  <Checkbox label="Default tier" {...register(`priceGroups.${index}.isDefault`)} />
                </div>
              </div>
            )}
          />
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <Button type="submit" isLoading={isLoading} disabled={!isOnline}>
            {submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
