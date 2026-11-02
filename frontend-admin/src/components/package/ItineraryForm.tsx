import { useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { CreatableSelect } from "@/components/ui/CreatableSelect";
import { FormSection } from "@/components/form/FormSection";
import { Repeater } from "@/components/form/Repeater";
import { RichTextEditor } from "@/components/form/RichTextEditor";
import { AttachmentGallery } from "@/components/media/AttachmentGallery";
import { PlaceCreateDrawer } from "@/components/place/PlaceCreateDrawer";
import { ItineraryRouteMap } from "@/components/package/ItineraryRouteMap";
import { buildRouteLegs } from "@/lib/polyline";
import { usePlaces, useCreatePlace } from "@/hooks/queries/usePlaces";
import { useInlineCreate, type CreatedOption } from "@/hooks/useInlineCreate";
import type { Itinerary, ItineraryDetail, ItineraryFormValues } from "@/types/itinerary";
import type { PlaceFormValues } from "@/types/place";

const STOP_OWNER_TYPE = "itineraryDetail";

const factSchema = z.object({
  factTitle: z.string().min(1, "Title is required"),
  factValue: z.string().min(1, "Value is required"),
});

const stopSchema = z.object({
  // The saved ItineraryDetail id, so the per-stop gallery can scope its
  // Attachment lookups. Undefined for a stop that hasn't been saved yet.
  dbId: z.string().optional(),
  itineraryTitle: z.string().optional(),
  itineraryShortDescription: z.string().optional(),
  itineraryDescription: z.string().optional(),
  accommodation: z.string().optional(),
  lunchPlace: z.string().optional(),
  meals: z.string().optional(),
  origin: z.string().optional(),
  originCoordinate: z.string().optional(),
  originElevation: z.string().optional(),
  originPlaceId: z.string().optional(),
  destination: z.string().optional(),
  destinationCoordinate: z.string().optional(),
  destinationElevation: z.string().optional(),
  destinationPlaceId: z.string().optional(),
  travelMode: z.string().optional(),
  distance: z.string().optional(),
  duration: z.string().optional(),
  encodedPolyline: z.string().optional(),
  footnote: z.string().optional(),
  isActive: z.boolean(),
  facts: z.array(factSchema),
});

const daySchema = z.object({
  dayLabel: z.string().min(1, "Day label is required"),
  stops: z.array(stopSchema),
});

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().optional(),
  detailsText: z.string().optional(),
  days: z.array(daySchema),
  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type StopValue = z.infer<typeof stopSchema>;

const emptyStop = (): StopValue => ({ isActive: true, facts: [] });

const toStopValue = (d: ItineraryDetail): StopValue => ({
  dbId: d.id,
  itineraryTitle: d.itineraryTitle ?? "",
  itineraryShortDescription: d.itineraryShortDescription ?? "",
  itineraryDescription: d.itineraryDescription ?? "",
  accommodation: d.accommodation ?? "",
  lunchPlace: d.lunchPlace ?? "",
  meals: d.meals ?? "",
  origin: d.origin ?? "",
  originCoordinate: d.originCoordinate ?? "",
  originElevation: d.originElevation ?? "",
  originPlaceId: d.originPlaceId ?? "",
  destination: d.destination ?? "",
  destinationCoordinate: d.destinationCoordinate ?? "",
  destinationElevation: d.destinationElevation ?? "",
  destinationPlaceId: d.destinationPlaceId ?? "",
  travelMode: d.travelMode ?? "",
  distance: d.distance ?? "",
  duration: d.duration ?? "",
  encodedPolyline: d.encodedPolyline ?? "",
  footnote: d.footnote ?? "",
  isActive: d.isActive ?? true,
  facts: d.facts.map((f) => ({ factTitle: f.factTitle, factValue: f.factValue })),
});

/**
 * The API stores one flat row per *stop* — `itineraryDay` is the grouping
 * label and `itineraryStop` the position within that day. The form edits them
 * grouped (Day -> Stops), matching how the legacy admin presented them, so the
 * flat list is folded on load and unfolded again on submit.
 */
function groupIntoDays(details: ItineraryDetail[]): FormValues["days"] {
  const order: string[] = [];
  const byDay = new Map<string, ItineraryDetail[]>();

  for (const detail of details) {
    const key = detail.itineraryDay;
    if (!byDay.has(key)) {
      byDay.set(key, []);
      order.push(key);
    }
    byDay.get(key)!.push(detail);
  }

  return order.map((dayLabel) => ({
    dayLabel,
    stops: [...byDay.get(dayLabel)!]
      .sort((a, b) => Number(a.itineraryStop ?? 0) - Number(b.itineraryStop ?? 0))
      .map(toStopValue),
  }));
}

function flattenDays(days: FormValues["days"]) {
  return days.flatMap((day) =>
    day.stops.map((stop, index) => {
      const { dbId, originPlaceId, destinationPlaceId, ...rest } = stop;
      return {
        ...rest,
        // Round-tripped so the backend updates this row in place instead
        // of replacing it — a fresh id on every save silently deleted the
        // row's own Attachment-based photo/video gallery each time (see
        // ItineraryDetailInput's own comment and itinerary.repository.ts's
        // `reconcileDetails`). Undefined for a stop added in this same
        // edit, which hasn't been saved yet and has no dbId.
        id: dbId || undefined,
        // A left-blank PlacePicker's field value is `""` (its own
        // `value={field.value ?? ""}` default), not `undefined` — send it
        // as omitted like every other optional field on this form already
        // does (`slug || undefined` etc. in `submit` below), not as a
        // literal empty string. The backend now also guards against this
        // itself (create-itinerary.dto.ts's `optionalPlaceId`), but fixing
        // it here too means a blank picker was never sent as a fake FK
        // value in the first place.
        originPlaceId: originPlaceId || undefined,
        destinationPlaceId: destinationPlaceId || undefined,
        itineraryDay: day.dayLabel,
        itineraryStop: index + 1,
      };
    }),
  );
}

// Each nested useFieldArray lives in its own component — hooks must run in a
// stable order, which they wouldn't if called inside a parent's row-render
// callback whose iteration count changes.
function StopFacts({
  control,
  register,
  errors,
  dayIndex,
  stopIndex,
}: {
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  dayIndex: number;
  stopIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: `days.${dayIndex}.stops.${stopIndex}.facts` });
  const factErrors = errors.days?.[dayIndex]?.stops?.[stopIndex]?.facts;

  return (
    <Repeater
      label="Facts"
      description="Key/value facts for this stop (e.g. max altitude, walking hours)"
      fields={fields}
      onAdd={() => append({ factTitle: "", factValue: "" })}
      onRemove={remove}
      addLabel="+ Add fact"
      emptyMessage="No facts yet."
      renderRow={(_field, factIndex) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Title"
            required
            {...register(`days.${dayIndex}.stops.${stopIndex}.facts.${factIndex}.factTitle`)}
            error={factErrors?.[factIndex]?.factTitle?.message}
          />
          <Input
            label="Value"
            required
            {...register(`days.${dayIndex}.stops.${stopIndex}.facts.${factIndex}.factValue`)}
            error={factErrors?.[factIndex]?.factValue?.message}
          />
        </div>
      )}
    />
  );
}

function StopGallery({ control, dayIndex, stopIndex }: { control: Control<FormValues>; dayIndex: number; stopIndex: number }) {
  const dbId = useWatch({ control, name: `days.${dayIndex}.stops.${stopIndex}.dbId` });
  return (
    <AttachmentGallery
      ownerType={STOP_OWNER_TYPE}
      ownerId={dbId}
      role="GALLERY"
      label="Gallery"
      hint="Up to 3 items — 3 photos, or 2 photos + 1 video. Shown as 4:3 tiles, so upload photos at 1200 × 900 px (whole photo is shown, never cropped)."
      allowVideo
      maxItems={3}
      maxVideos={1}
    />
  );
}

/** The slice of useInlineCreate's return that a picker needs. */
interface InlineCreateApi<TVars> {
  error: string | null;
  submit: (vars: TVars, onCreated: (option: CreatedOption) => void) => void;
  isLoading: boolean;
  clearError: () => void;
}

interface PlacePickerProps {
  control: Control<FormValues>;
  name: `days.${number}.stops.${number}.originPlaceId` | `days.${number}.stops.${number}.destinationPlaceId`;
  label: string;
  options: { value: string; label: string }[];
  onCreate: InlineCreateApi<PlaceFormValues>;
}

function PlacePicker({ control, name, label, options, onCreate }: PlacePickerProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
          <CreatableSelect
            options={options}
            value={field.value ?? ""}
            onChange={field.onChange}
            placeholder="None"
            create={{
              label: "Place",
              render: ({ isOpen, onClose, onCreated }) => (
                <PlaceCreateDrawer
                  isOpen={isOpen}
                  onClose={onClose}
                  onSubmit={(data) => onCreate.submit(data, onCreated)}
                  isLoading={onCreate.isLoading}
                  error={onCreate.error}
                  onDismissError={onCreate.clearError}
                />
              ),
            }}
          />
        </div>
      )}
    />
  );
}

interface DayPanelProps {
  control: Control<FormValues>;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  dayIndex: number;
  onRemoveDay: () => void;
  placeOptions: { value: string; label: string }[];
  placeCreate: PlacePickerProps["onCreate"];
}

function DayPanel({ control, register, errors, dayIndex, onRemoveDay, placeOptions, placeCreate }: DayPanelProps) {
  const [open, setOpen] = useState(dayIndex === 0);
  const { fields, append, remove } = useFieldArray({ control, name: `days.${dayIndex}.stops` });
  const dayErrors = errors.days?.[dayIndex];

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/70 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-gray-900"
          aria-expanded={open}
        >
          {open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
          <span>Day {dayIndex + 1}</span>
          <span className="text-xs font-normal text-gray-500">
            ({fields.length} {fields.length === 1 ? "stop" : "stops"})
          </span>
        </button>
        <Button type="button" variant="secondary" size="sm" onClick={() => append(emptyStop())}>
          + Add stop
        </Button>
        <button
          type="button"
          onClick={onRemoveDay}
          aria-label={`Remove day ${dayIndex + 1}`}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="space-y-4 p-3">
          <Input
            label="Day label"
            required
            hint='Shown on the public site, e.g. "Day 1" or "Day 1–2"'
            {...register(`days.${dayIndex}.dayLabel`)}
            error={dayErrors?.dayLabel?.message}
          />

          {fields.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500">
              No stops yet — add one to describe this day.
            </p>
          ) : (
            fields.map((field, stopIndex) => (
              <div key={field.id} className="relative rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stop {stopIndex + 1}</h5>
                  <button
                    type="button"
                    onClick={() => remove(stopIndex)}
                    aria-label={`Remove stop ${stopIndex + 1}`}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input label="Title" {...register(`days.${dayIndex}.stops.${stopIndex}.itineraryTitle`)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea label="Short Description" rows={2} {...register(`days.${dayIndex}.stops.${stopIndex}.itineraryShortDescription`)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                    <Controller
                      name={`days.${dayIndex}.stops.${stopIndex}.itineraryDescription`}
                      control={control}
                      render={({ field: rte }) => (
                        <RichTextEditor value={rte.value ?? ""} onChange={rte.onChange} placeholder="Describe this stop…" />
                      )}
                    />
                  </div>

                  <Input label="Meals" {...register(`days.${dayIndex}.stops.${stopIndex}.meals`)} />
                  <Input label="Accommodation" {...register(`days.${dayIndex}.stops.${stopIndex}.accommodation`)} />
                  <Input label="Lunch Place" {...register(`days.${dayIndex}.stops.${stopIndex}.lunchPlace`)} />

                  <PlacePicker
                    control={control}
                    name={`days.${dayIndex}.stops.${stopIndex}.originPlaceId`}
                    label="Origin Place"
                    options={placeOptions}
                    onCreate={placeCreate}
                  />
                  <PlacePicker
                    control={control}
                    name={`days.${dayIndex}.stops.${stopIndex}.destinationPlaceId`}
                    label="Destination Place"
                    options={placeOptions}
                    onCreate={placeCreate}
                  />

                  <Input label="Origin (free text)" {...register(`days.${dayIndex}.stops.${stopIndex}.origin`)} />
                  <Input label="Destination (free text)" {...register(`days.${dayIndex}.stops.${stopIndex}.destination`)} />
                  <Input
                    label="Origin Coordinate"
                    hint="lat,lng — plots on the map"
                    {...register(`days.${dayIndex}.stops.${stopIndex}.originCoordinate`)}
                  />
                  <Input
                    label="Destination Coordinate"
                    hint="lat,lng — plots on the map"
                    {...register(`days.${dayIndex}.stops.${stopIndex}.destinationCoordinate`)}
                  />
                  <Input label="Origin Elevation" {...register(`days.${dayIndex}.stops.${stopIndex}.originElevation`)} />
                  <Input label="Destination Elevation" {...register(`days.${dayIndex}.stops.${stopIndex}.destinationElevation`)} />

                  <Input label="Distance" {...register(`days.${dayIndex}.stops.${stopIndex}.distance`)} />
                  <Input label="Duration" hint='e.g. "15 Min"' {...register(`days.${dayIndex}.stops.${stopIndex}.duration`)} />
                  <Input label="Mode of Transportation" {...register(`days.${dayIndex}.stops.${stopIndex}.travelMode`)} />
                  <Input label="Footnote" {...register(`days.${dayIndex}.stops.${stopIndex}.footnote`)} />

                  <div className="sm:col-span-2">
                    <Textarea
                      label="Encoded Polyline"
                      rows={2}
                      hint="Google-encoded polyline — draws this leg's real route on the map"
                      {...register(`days.${dayIndex}.stops.${stopIndex}.encodedPolyline`)}
                    />
                  </div>

                  <div className="flex items-end">
                    <Checkbox label="Stop active" {...register(`days.${dayIndex}.stops.${stopIndex}.isActive`)} />
                  </div>

                  <div className="sm:col-span-2">
                    <StopFacts control={control} register={register} errors={errors} dayIndex={dayIndex} stopIndex={stopIndex} />
                  </div>
                  <div className="sm:col-span-2">
                    <StopGallery control={control} dayIndex={dayIndex} stopIndex={stopIndex} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RouteMapPanel({ control }: { control: Control<FormValues> }) {
  const days = useWatch({ control, name: "days" });

  const legs = useMemo(
    () =>
      buildRouteLegs(
        (days ?? []).flatMap((day) =>
          (day?.stops ?? []).map((stop) => ({
            itineraryTitle: stop?.itineraryTitle,
            itineraryDay: day?.dayLabel,
            originCoordinate: stop?.originCoordinate,
            destinationCoordinate: stop?.destinationCoordinate,
            encodedPolyline: stop?.encodedPolyline,
          })),
        ),
      ),
    [days],
  );

  return (
    <div className="lg:sticky lg:top-4">
      <h4 className="mb-2 text-sm font-semibold text-gray-900">Route Map</h4>
      <ItineraryRouteMap legs={legs} />
    </div>
  );
}

interface ItineraryFormProps {
  defaultValues?: Itinerary;
  onSubmit: (data: Omit<ItineraryFormValues, "packageId">) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function ItineraryForm({ defaultValues, onSubmit, isLoading, submitLabel }: ItineraryFormProps) {
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
      detailsText: defaultValues?.detailsText ?? "",
      days: groupIntoDays(defaultValues?.details ?? []),
      metaTitle: defaultValues?.meta?.metaTitle ?? "",
      metaKeywords: defaultValues?.meta?.metaKeywords ?? "",
      metaDescription: defaultValues?.meta?.metaDescription ?? "",
    },
  });

  const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({ control, name: "days" });

  const { data: placesData } = usePlaces({ perPage: 200, isActive: true });
  const placeOptions = (placesData?.data.items ?? []).map((p) => ({ value: p.id, label: p.placeName }));
  const placeCreate = useInlineCreate(useCreatePlace(), (res) => ({ value: res.data.id, label: res.data.placeName }));

  const submit = (values: FormValues) => {
    onSubmit({
      title: values.title,
      slug: values.slug || undefined,
      detailsText: values.detailsText || undefined,
      details: flattenDays(values.days),
      metaTitle: values.metaTitle || undefined,
      metaKeywords: values.metaKeywords || undefined,
      metaDescription: values.metaDescription || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <FormSection title="Itinerary" columns={2}>
        <Input label="Title" required error={errors.title?.message} {...register("title")} />
        <Input label="Slug" hint="Leave blank to auto-generate from the title" error={errors.slug?.message} {...register("slug")} />
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Itinerary Note</label>
          <Controller
            name="detailsText"
            control={control}
            render={({ field }) => (
              <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Notes shown above the day list…" />
            )}
          />
        </div>
      </FormSection>

      <section>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Day-by-Day Itinerary</h3>
            <p className="mt-0.5 text-xs text-gray-500">Each day holds one or more stops</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => appendDay({ dayLabel: `Day ${dayFields.length + 1}`, stops: [emptyStop()] })}
          >
            + Add day
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {dayFields.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
                No days yet.
              </p>
            ) : (
              dayFields.map((field, dayIndex) => (
                <DayPanel
                  key={field.id}
                  control={control}
                  register={register}
                  errors={errors}
                  dayIndex={dayIndex}
                  onRemoveDay={() => removeDay(dayIndex)}
                  placeOptions={placeOptions}
                  placeCreate={placeCreate}
                />
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            <RouteMapPanel control={control} />
          </div>
        </div>
      </section>

      <FormSection title="SEO" description="Overrides for search engines" columns={2}>
        <Input label="Meta Title" error={errors.metaTitle?.message} {...register("metaTitle")} />
        <Input label="Meta Keywords" error={errors.metaKeywords?.message} {...register("metaKeywords")} />
        <div className="sm:col-span-2">
          <Textarea label="Meta Description" rows={2} error={errors.metaDescription?.message} {...register("metaDescription")} />
        </div>
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
