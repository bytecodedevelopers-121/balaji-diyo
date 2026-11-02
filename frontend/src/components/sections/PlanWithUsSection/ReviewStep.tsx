"use client";

import type { Ref } from "react";
import { destinations, experiences, accommodationStyles } from "@/config/plan-with-us-options";
import { Captcha, type CaptchaHandle } from "@/components/ui/Captcha/Captcha";
import { BackArrowIcon, ForwardArrowIcon } from "./icons";
import type { PlanWithUsFormState } from "./plan-with-us.types";

/**
 * Step 3 — "Trip Summary" + "Additional Preferences" (design-
 * references/"Plan with us - Review.png", y≈480–780 at 1440px).
 * Read-only summary of every earlier step's real chosen values (not
 * the design's own literal placeholder numbers — "Nepal / 12 Days /
 * 2 Persons / ... / 2026-08-29" is that mockup's sample data, not a
 * default to reproduce).
 */
export function ReviewStep({
  values,
  onChange,
  onBack,
  onSubmit,
  status,
  errorMessage,
  captchaRef,
  onCaptchaVerify,
  canSubmit,
}: {
  values: PlanWithUsFormState;
  onChange: (patch: Partial<PlanWithUsFormState>) => void;
  onBack: () => void;
  onSubmit: () => void;
  status: "idle" | "submitting" | "success" | "error";
  errorMessage: string | null;
  captchaRef: Ref<CaptchaHandle>;
  onCaptchaVerify: (token: string | null) => void;
  /** false once a Turnstile widget is configured and not yet solved — see PlanWithUsWizard's own `captchaRequired` doc comment. */
  canSubmit: boolean;
}) {
  const destinationLabel = destinations.find((d) => d.id === values.destinationId)?.label ?? "—";
  const accommodationLabel =
    accommodationStyles.find((a) => a.id === values.accommodationId)?.label ?? "—";
  const activityLabels = values.experienceIds
    .map((id) => experiences.find((experience) => experience.id === id)?.label)
    .filter(Boolean)
    .join(", ");

  const summary = [
    { label: "Destination", value: destinationLabel },
    { label: "Duration", value: `${values.tripDuration} Day${values.tripDuration === 1 ? "" : "s"}` },
    { label: "Travelers", value: `${values.groupSize} Person${values.groupSize === 1 ? "" : "s"}` },
    { label: "Activities", value: activityLabels || "Not specified" },
    { label: "Budget", value: values.budgetRange || "Not specified" },
    { label: "Accommodation", value: accommodationLabel },
    { label: "Date", value: values.departureDate || "Not specified" },
  ];

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-poppins text-[22px] leading-[35.2px] font-bold text-primary-700">
          Thanks, {values.fullName.split(" ")[0] || "there"}!
        </p>
        <p className="max-w-md font-poppins text-[15px] leading-[24px] text-brand-neutral-700">
          We&apos;ve received your trip request and will email your personalized itinerary to{" "}
          {values.email} soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <p className="font-poppins text-[16px] leading-[25.6px] font-bold text-brand-neutral-1000">
            Trip Summary
          </p>
          <dl className="mt-3 flex flex-col gap-2.5">
            {summary.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <dt className="font-poppins text-[14px] leading-[22.4px] text-brand-neutral-700">
                  {row.label}
                </dt>
                <dd className="font-poppins text-[14px] leading-[22.4px] font-bold text-brand-neutral-1000">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label
              className="font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-900"
              htmlFor="additional-preferences"
            >
              Additional Preferences
            </label>
            <textarea
              id="additional-preferences"
              rows={4}
              placeholder="Tell us about any specific interests, dietary requirements, or special occasions…"
              value={values.additionalPreferences}
              onChange={(event) => onChange({ additionalPreferences: event.target.value })}
              className="mt-2 w-full resize-none rounded-md border border-brand-neutral-300 p-3 font-poppins text-[14px] text-brand-neutral-900 placeholder:text-brand-neutral-600 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <p className="border-l-4 border-primary-500 bg-primary-100 p-3 font-poppins text-[13px] leading-[20.8px] text-primary-800">
            By submitting this form, you agree to our privacy policy. We respect your privacy
            and we will never share your information with third parties.
          </p>
        </div>
      </div>

      {status === "error" ? (
        <p className="font-poppins text-[14px] leading-[22.4px] text-error-700">{errorMessage}</p>
      ) : null}

      <Captcha ref={captchaRef} onVerify={onCaptchaVerify} />

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={status === "submitting"}
          className="flex items-center gap-2 bg-brand-neutral-200 px-6 py-3 font-poppins text-[15px] font-medium text-brand-neutral-800 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <BackArrowIcon />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={status === "submitting" || !canSubmit}
          className="flex items-center gap-2 bg-secondary-500 px-6 py-3 font-poppins text-[15px] font-medium text-brand-neutral-000 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "submitting" ? "Submitting…" : "Submit"}
          {status !== "submitting" ? <ForwardArrowIcon /> : null}
        </button>
      </div>
    </div>
  );
}
