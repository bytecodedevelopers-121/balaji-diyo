"use client";

import { useId, useRef, useState } from "react";
import { Captcha, type CaptchaHandle } from "@/components/ui/Captcha/Captcha";
import { countries } from "@/config/contact-form-options";
import { isApiEnvelope } from "@/lib/api/api-response";

type Status = "idle" | "submitting" | "success" | "error";

const emptyValues = { firstName: "", lastName: "", email: "", phone: "", country: "", website: "", details: "" };

const fieldClassName =
  "w-full rounded-md border border-brand-neutral-300 bg-white px-4 py-3.5 text-body-m text-brand-neutral-1000 outline-none placeholder:text-brand-neutral-900 focus:border-primary-500";

/**
 * "Become an affiliate" form. Posts to the same public `/contacts` endpoint as
 * the other enquiry forms with `type: "affiliate"`; fields with no
 * ContactMessage column (phone, country, website) are folded into `message`
 * as "Label: value" lines, like the partner form does.
 */
export function AffiliateForm() {
  const idPrefix = useId();
  const [values, setValues] = useState(emptyValues);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const message = [
      `Phone: ${values.phone.trim()}`,
      `Country: ${values.country}`,
      `Website: ${values.website.trim()}`,
      "",
      "More information:",
      values.details.trim(),
    ].join("\n");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
          email: values.email.trim(),
          type: "affiliate",
          url: window.location.pathname,
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
      setValues(emptyValues);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      // A Turnstile token is single-use either way.
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  }

  return (
    <form
      id="affiliate-form"
      onSubmit={handleSubmit}
      className="mt-8 rounded-md bg-white p-6 shadow-card-strong md:p-7"
    >
      <h2 className="text-[18px] font-semibold text-primary-500">Become an affiliate</h2>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          type="text"
          required
          maxLength={120}
          autoComplete="given-name"
          placeholder="First Name *"
          aria-label="First name"
          value={values.firstName}
          onChange={(event) => update("firstName", event.target.value)}
          className={fieldClassName}
        />
        <input
          type="text"
          required
          maxLength={120}
          autoComplete="family-name"
          placeholder="Last Name *"
          aria-label="Last name"
          value={values.lastName}
          onChange={(event) => update("lastName", event.target.value)}
          className={fieldClassName}
        />
        <input
          type="email"
          required
          maxLength={255}
          autoComplete="email"
          placeholder="Email Address *"
          aria-label="Email address"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          className={fieldClassName}
        />
        <input
          type="tel"
          required
          maxLength={50}
          autoComplete="tel"
          placeholder="Country Code + Phone Number *"
          aria-label="Country code and phone number"
          value={values.phone}
          onChange={(event) => update("phone", event.target.value)}
          className={fieldClassName}
        />
        <select
          required
          aria-label="Choose your country"
          value={values.country}
          onChange={(event) => update("country", event.target.value)}
          className={`${fieldClassName} appearance-none`}
        >
          <option value="" disabled>
            Choose Your Country *
          </option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <input
          type="url"
          required
          maxLength={255}
          placeholder="Your Website URL *"
          aria-label="Your website URL"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
          className={fieldClassName}
        />
      </div>

      <textarea
        id={`${idPrefix}-details`}
        rows={7}
        required
        maxLength={2000}
        placeholder="More Information *"
        aria-label="More information"
        value={values.details}
        onChange={(event) => update("details", event.target.value)}
        className={`${fieldClassName} mt-4 resize-y`}
      />

      <div className="mt-4">
        <Captcha ref={captchaRef} onVerify={setCaptchaToken} />
      </div>

      <button
        type="submit"
        disabled={status === "submitting" || (captchaRequired && !captchaToken)}
        className="mt-4 rounded-md bg-primary-500 px-8 py-3 text-body-l font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Submit"}
      </button>

      <div aria-live="polite">
        {status === "success" ? (
          <p className="mt-3 text-body-m font-medium text-success-800">
            Thank you — your request has been sent. We&apos;ll get back to you soon.
          </p>
        ) : null}
        {status === "error" ? <p className="mt-3 text-body-m font-medium text-error-700">{errorMessage}</p> : null}
      </div>
    </form>
  );
}
