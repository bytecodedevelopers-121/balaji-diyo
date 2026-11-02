"use client";

import { useRef, useState } from "react";
import { isApiEnvelope } from "@/lib/api/api-response";
import { destinations, experiences, accommodationStyles } from "@/config/plan-with-us-options";
import type { CaptchaHandle } from "@/components/ui/Captcha/Captcha";
import { StepIndicator, type WizardStep } from "./StepIndicator";
import { PreferencesStep } from "./PreferencesStep";
import { DetailsStep } from "./DetailsStep";
import { ReviewStep } from "./ReviewStep";
import { INITIAL_PLAN_WITH_US_STATE, type PlanWithUsFormState } from "./plan-with-us.types";

const STEPS: WizardStep[] = [
  { id: "preferences", label: "Preferences" },
  { id: "details", label: "Details" },
  { id: "review", label: "Review" },
];

/**
 * The 3-step "Plan With Us" wizard card — design-references/
 * "Plan with us - Preferences.png" / "Plan With Us Details.png" /
 * "Plan with us - Review.png" (same white card, one screenshot per
 * step). A single Client Component owns all the state across steps
 * (not three separate ones) so nothing resets on Back/Continue.
 *
 * Submits to the same public `POST /contacts` endpoint every other
 * enquiry form on this site uses (ContactForm), not a dedicated
 * endpoint: `CustomBooking` (backend/src/modules/custom-booking) looks
 * like the obvious fit at a glance, but it requires an existing real
 * `packageId` — this wizard has no such thing, it's an open-ended
 * "help me plan a trip" enquiry with no package selected yet. `type:
 * "plan-with-us"` distinguishes it in the admin's contact-message list;
 * the structured preferences (destination, experiences, group size,
 * duration, budget, accommodation, date) have no matching DTO fields
 * so they're folded into `message` as a readable summary, same
 * "message is the flexible catch-all" precedent ContactForm's own
 * comment documents for /contact's "Country" field.
 */
export function PlanWithUsWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<PlanWithUsFormState>(INITIAL_PLAN_WITH_US_STATE);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);
  // Same "unconfigured = not required" read every captcha call site uses —
  // see Captcha.tsx's own doc comment.
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function update(patch: Partial<PlanWithUsFormState>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  function goBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function goToDetails() {
    setStepIndex(1);
  }

  function goToReview() {
    setStepIndex(2);
  }

  async function handleSubmit() {
    setStatus("submitting");
    setErrorMessage(null);

    const destinationLabel = destinations.find((d) => d.id === values.destinationId)?.label ?? values.destinationId;
    const accommodationLabel =
      accommodationStyles.find((a) => a.id === values.accommodationId)?.label ?? values.accommodationId;
    const activityLabels = values.experienceIds
      .map((id) => experiences.find((experience) => experience.id === id)?.label)
      .filter(Boolean)
      .join(", ");

    const message = [
      `Destination: ${destinationLabel}`,
      `Preferred experiences: ${activityLabels || "Not specified"}`,
      `Group size: ${values.groupSize}`,
      `Trip duration: ${values.tripDuration} day(s)`,
      `Departure date: ${values.departureDate || "Not specified"}`,
      `Estimated budget: ${values.budgetRange || "Not specified"}`,
      `Accommodation style: ${accommodationLabel}`,
      `Residence country: ${values.residenceCountry}`,
      "",
      values.additionalPreferences.trim() || "No additional preferences provided.",
    ].join("\n");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: values.fullName,
          email: values.email,
          phone: values.phone,
          type: "plan-with-us",
          url: "/plan-with-us",
          numberOfTraveller: values.groupSize,
          message,
          captchaToken,
        }),
      });
      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        const apiMessage = isApiEnvelope(body) ? body.message : undefined;
        throw new Error(apiMessage || "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      // A Turnstile token is single-use — clear it and re-render the widget
      // so a retry after this failure can't silently resend a spent token.
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  }

  return (
    <div
      className="w-full max-w-[900px] bg-brand-neutral-000 p-6 shadow-card-strong sm:p-8"
      style={{ border: "var(--border-card-contact)" }}
    >
      <StepIndicator steps={STEPS} currentIndex={stepIndex} />

      <div className="mt-6">
        {stepIndex === 0 ? (
          <PreferencesStep values={values} onChange={update} onContinue={goToDetails} />
        ) : null}
        {stepIndex === 1 ? (
          <DetailsStep values={values} onChange={update} onBack={goBack} onContinue={goToReview} />
        ) : null}
        {stepIndex === 2 ? (
          <ReviewStep
            values={values}
            onChange={update}
            onBack={goBack}
            onSubmit={handleSubmit}
            status={status}
            errorMessage={errorMessage}
            captchaRef={captchaRef}
            onCaptchaVerify={setCaptchaToken}
            canSubmit={!captchaRequired || Boolean(captchaToken)}
          />
        ) : null}
      </div>
    </div>
  );
}
