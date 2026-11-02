"use client";

import { countries } from "@/config/contact-form-options";
import { PersonIcon, MailIcon, PhoneIcon, GlobeIcon, BackArrowIcon, ForwardArrowIcon } from "./icons";
import type { PlanWithUsFormState } from "./plan-with-us.types";

/**
 * Step 2 — "Contact Details" (design-references/"Plan With Us
 * Details.png", y≈350–700 at 1440px). Bordered icon-prefixed inputs —
 * a different field treatment than ContactForm's underline inputs
 * (this wizard's own design, not shared with /contact's card), reused
 * as-is for both fields on this step. Country list reuses
 * `@/config/contact-form-options`'s `countries` — same real list
 * /contact's "Your Country" select already uses, not a second one.
 */
export function DetailsStep({
  values,
  onChange,
  onBack,
  onContinue,
}: {
  values: PlanWithUsFormState;
  onChange: (patch: Partial<PlanWithUsFormState>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue =
    values.fullName.trim() !== "" &&
    values.email.trim() !== "" &&
    values.phone.trim() !== "" &&
    values.residenceCountry !== "";

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="font-poppins text-[20px] leading-[32px] font-bold text-primary-700">
          Contact Details
        </p>
        <p className="mt-1 font-poppins text-[14px] leading-[22.4px] text-brand-neutral-700">
          So we can send you your personalized itinerary.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field icon={PersonIcon}>
          <input
            type="text"
            required
            placeholder="Full Name *"
            autoComplete="name"
            value={values.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            className="w-full bg-transparent font-poppins text-[14px] text-brand-neutral-900 placeholder:text-brand-neutral-600 focus:outline-none"
          />
        </Field>
        <Field icon={MailIcon}>
          <input
            type="email"
            required
            placeholder="Email Address *"
            autoComplete="email"
            value={values.email}
            onChange={(event) => onChange({ email: event.target.value })}
            className="w-full bg-transparent font-poppins text-[14px] text-brand-neutral-900 placeholder:text-brand-neutral-600 focus:outline-none"
          />
        </Field>
        <Field icon={PhoneIcon}>
          <input
            type="tel"
            required
            placeholder="Phone Number *"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            className="w-full bg-transparent font-poppins text-[14px] text-brand-neutral-900 placeholder:text-brand-neutral-600 focus:outline-none"
          />
        </Field>
        <Field icon={GlobeIcon}>
          <select
            required
            value={values.residenceCountry}
            onChange={(event) => onChange({ residenceCountry: event.target.value })}
            className="w-full bg-transparent font-poppins text-[14px] text-brand-neutral-900 focus:outline-none"
          >
            <option value="">Residence Country *</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 bg-brand-neutral-200 px-6 py-3 font-poppins text-[15px] font-medium text-brand-neutral-800 transition-opacity hover:opacity-90"
        >
          <BackArrowIcon />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="flex items-center gap-2 bg-secondary-500 px-6 py-3 font-poppins text-[15px] font-medium text-brand-neutral-000 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Continue
          <ForwardArrowIcon />
        </button>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  children,
}: {
  icon: (props: { className?: string }) => React.JSX.Element;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-brand-neutral-300 px-4 py-3 focus-within:border-primary-500">
      <Icon className="size-4 shrink-0 text-brand-neutral-600" />
      {children}
    </div>
  );
}
