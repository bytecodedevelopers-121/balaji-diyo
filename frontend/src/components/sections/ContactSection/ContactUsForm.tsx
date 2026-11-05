"use client";

import { useRef, useState } from "react";
import { Captcha, type CaptchaHandle } from "@/components/ui/Captcha/Captcha";
import { countries } from "@/config/contact-form-options";
import { isApiEnvelope } from "@/lib/api/api-response";

const emptyValues = { fullName: "", email: "", phone: "", country: "", message: "" };

const fieldClassName =
  "w-full rounded-[4px] border border-transparent bg-white px-3.5 py-3.5 text-[13px] text-brand-neutral-1000 outline-none placeholder:text-brand-neutral-900 focus:border-primary-500";

/**
 * "Have a questions or feedback?" card on /contact. Posts to the public
 * `POST /contacts` endpoint (same one ContactForm uses) with `type: "general"`;
 * the country has no backend column, so it is folded into the message.
 */
export function ContactUsForm() {
  const [values, setValues] = useState(emptyValues);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
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

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: values.fullName.trim(),
          email: values.email.trim(),
          type: "general",
          url: window.location.pathname,
          phone: values.phone.trim(),
          message: `Country: ${values.country}\n\n${values.message.trim()}`,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-[17px] font-medium text-brand-neutral-1000">Have a questions or feedback?</h2>

      <input
        type="text"
        required
        maxLength={120}
        autoComplete="name"
        placeholder="Full Name *"
        aria-label="Full name"
        value={values.fullName}
        onChange={(event) => update("fullName", event.target.value)}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="tel"
          required
          maxLength={50}
          autoComplete="tel"
          placeholder="Phone Number *"
          aria-label="Phone number"
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
      </div>
      <textarea
        rows={4}
        required
        maxLength={2000}
        placeholder="Questions / Comments *"
        aria-label="Questions or comments"
        value={values.message}
        onChange={(event) => update("message", event.target.value)}
        className={`${fieldClassName} resize-y`}
      />

      <Captcha ref={captchaRef} onVerify={setCaptchaToken} />

      <button
        type="submit"
        disabled={status === "submitting" || (captchaRequired && !captchaToken)}
        className="flex w-fit items-center gap-2 rounded-pill border border-primary-500 bg-white px-5 py-2.5 text-[13px] text-brand-neutral-1000 transition-colors hover:bg-primary-500 hover:text-white disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send Message"} <span aria-hidden="true">→</span>
      </button>

      <div aria-live="polite">
        {status === "success" ? (
          <p className="text-[14px] font-medium text-success-800">Thanks — your message has been sent. We&apos;ll get back to you soon.</p>
        ) : null}
        {status === "error" ? <p className="text-[14px] font-medium text-error-700">{errorMessage}</p> : null}
      </div>
    </form>
  );
}
