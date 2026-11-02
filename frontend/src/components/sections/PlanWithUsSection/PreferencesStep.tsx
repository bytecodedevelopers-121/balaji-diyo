"use client";

import { cn } from "@/lib/utils";
import { destinations, experiences, accommodationStyles, budgetRanges } from "@/config/plan-with-us-options";
import { EXPERIENCE_ICONS, CalendarIcon, ForwardArrowIcon } from "./icons";
import { RangeSlider } from "./RangeSlider";
import type { PlanWithUsFormState } from "./plan-with-us.types";
import { FillImage } from "@/components/ui/FillImage";

/**
 * Step 1 — design-references/"Plan with us - Preferences.png",
 * y≈380–950 at 1440px. Destination cards + experience pills are
 * pictured with no visible "which are required" marker, so this step's
 * own Continue button only requires a destination (always set, has a
 * default) and doesn't block on the rest — matching the fields that
 * *do* carry a "*" being confined to the Details step (Full Name,
 * Email, Phone, Country).
 */
export function PreferencesStep({
  values,
  onChange,
  onContinue,
}: {
  values: PlanWithUsFormState;
  onChange: (patch: Partial<PlanWithUsFormState>) => void;
  onContinue: () => void;
}) {
  function toggleExperience(id: string) {
    onChange({
      experienceIds: values.experienceIds.includes(id)
        ? values.experienceIds.filter((experienceId) => experienceId !== id)
        : [...values.experienceIds, id],
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-poppins text-[18px] leading-[28.8px] font-bold text-primary-700">
          Where would you like to explore?
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {destinations.map((destination) => {
            const isSelected = values.destinationId === destination.id;
            return (
              <button
                key={destination.id}
                type="button"
                onClick={() => onChange({ destinationId: destination.id })}
                aria-pressed={isSelected}
                className={cn(
                  "relative aspect-[4/3] w-full overflow-hidden rounded-md text-left outline-none",
                  isSelected && "ring-2 ring-secondary-500 ring-offset-2",
                )}
              >
                <FillImage
                  src={destination.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 25vw, 50vw" />
                <div
                  className="absolute inset-0"
                  style={{ backgroundImage: "var(--gradient-photo-scrim)" }}
                  aria-hidden="true"
                />
                <div className="absolute right-2 bottom-2 left-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-brand-neutral-000",
                      isSelected && "bg-secondary-500",
                    )}
                  />
                  <span className="font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-000">
                    {destination.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="font-poppins text-[18px] leading-[28.8px] font-bold text-primary-700">
          Preferred Experiences
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {experiences.map((experience) => {
            const Icon = EXPERIENCE_ICONS[experience.id];
            const isSelected = values.experienceIds.includes(experience.id);
            return (
              <button
                key={experience.id}
                type="button"
                onClick={() => toggleExperience(experience.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-md border p-3 text-center transition-colors",
                  isSelected
                    ? "border-secondary-500 bg-secondary-500/10 text-secondary-500"
                    : "border-brand-neutral-300 text-brand-neutral-700 hover:border-brand-neutral-400",
                )}
              >
                {Icon ? <Icon className="size-5" /> : null}
                <span className="font-poppins text-[13px] leading-[20.8px] font-medium">
                  {experience.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-md border border-secondary-500/40 bg-secondary-500/5 p-5">
          <div>
            <p className="font-poppins text-[16px] leading-[25.6px] font-bold text-primary-700">
              Travelers &amp; Duration
            </p>
            <p className="mt-1 font-poppins text-[13px] leading-[20.8px] text-brand-neutral-700">
              Group discounts are exclusive to your group size only. We do not merge groups.
            </p>
          </div>
          <RangeSlider
            label="Group Size"
            min={1}
            max={30}
            value={values.groupSize}
            onChange={(groupSize) => onChange({ groupSize })}
            minLabel="1 Person"
            maxLabel="30 People"
            formatValue={(value) => `${value} Person${value === 1 ? "" : "s"}`}
          />
          <RangeSlider
            label="Trip Duration"
            min={1}
            max={30}
            value={values.tripDuration}
            onChange={(tripDuration) => onChange({ tripDuration })}
            minLabel="1 Day"
            maxLabel="30 Days"
            formatValue={(value) => `${value} Day${value === 1 ? "" : "s"}`}
          />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-900" htmlFor="departure-date">
              Departure Date
            </label>
            <div className="relative mt-2">
              <CalendarIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-neutral-600" />
              <input
                id="departure-date"
                type="date"
                value={values.departureDate}
                onChange={(event) => onChange({ departureDate: event.target.value })}
                className="w-full rounded-md border border-brand-neutral-300 py-3 pr-4 pl-10 font-poppins text-[14px] text-brand-neutral-900 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-900" htmlFor="budget-range">
              Estimated Budget (Per Person)
            </label>
            <select
              id="budget-range"
              value={values.budgetRange}
              onChange={(event) => onChange({ budgetRange: event.target.value })}
              className="mt-2 w-full rounded-md border border-brand-neutral-300 bg-brand-neutral-000 px-4 py-3 font-poppins text-[14px] text-brand-neutral-900 focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select Range</option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-900">
              Accommodation Style
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {accommodationStyles.map((style) => {
                const isSelected = values.accommodationId === style.id;
                return (
                  <label
                    key={style.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors",
                      isSelected
                        ? "border-primary-500 bg-primary-100/50"
                        : "border-brand-neutral-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="accommodation"
                      value={style.id}
                      checked={isSelected}
                      onChange={() => onChange({ accommodationId: style.id })}
                      className="accent-primary-500"
                    />
                    <span className="font-poppins text-[14px] leading-[22.4px] font-bold text-brand-neutral-900">
                      {style.label}
                    </span>
                    <span className="font-poppins text-[13px] leading-[20.8px] text-brand-neutral-700">
                      {style.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center gap-2 bg-secondary-500 px-6 py-3 font-poppins text-[15px] font-medium text-brand-neutral-000 transition-opacity hover:opacity-90"
        >
          Continue
          <ForwardArrowIcon />
        </button>
      </div>
    </div>
  );
}
