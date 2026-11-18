"use client";

import { useId, useRef, useState } from "react";
import { Captcha, type CaptchaHandle } from "@/components/ui/Captcha/Captcha";
import {
  partnerForms,
  type PartnerFormDefinition,
  type PartnerFormId,
} from "@/config/partner-content";
import { isApiEnvelope } from "@/lib/api/api-response";
import { toast } from "@/components/ui/Toast/toast";

type Status = "idle" | "submitting" | "success" | "error";

const inputClassName =
  "w-full rounded-chip border border-brand-neutral-400 bg-brand-neutral-000 px-4 py-3 text-input-m text-brand-neutral-900 outline-none transition-colors placeholder:text-brand-neutral-800 focus:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/30";

/**
 * Tabbed partnership inquiry form (Brand / Creator / Agency). One panel is
 * mounted at a time, so there is only ever one captcha widget on screen.
 *
 * Tabs follow the WAI-ARIA tabs pattern (roving tabindex, arrow/Home/End
 * keys). All three variants post to the same public `/contacts` endpoint
 * the site's other enquiry forms use, distinguished by `type`
 * (`partner-brand` / `partner-creator` / `partner-agency`); fields with no
 * ContactMessage column (industry, platform, following, ...) are folded
 * into `message` as "Label: value" lines, same as the country line on the
 * Customize Trip form.
 */
export function PartnerInquiryForm() {
  const baseId = useId();
  const [activeId, setActiveId] = useState<PartnerFormId>("brand");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusTab(id: PartnerFormId) {
    setActiveId(id);
    tabRefs.current[id]?.focus();
  }

  function handleTabKeyDown(event: React.KeyboardEvent, index: number) {
    const last = partnerForms.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    focusTab(partnerForms[next]!.id);
  }

  const active = partnerForms.find((form) => form.id === activeId)!;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Partnership type"
        className="mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-brand-neutral-200"
      >
        {partnerForms.map((form, index) => {
          const selected = form.id === activeId;
          return (
            <button
              key={form.id}
              ref={(node) => {
                tabRefs.current[form.id] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${form.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${form.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(form.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`-mb-px border-b pb-3 text-body-l transition-colors duration-200 ${
                selected
                  ? "border-primary-500 font-bold text-primary-500"
                  : "border-transparent text-brand-neutral-800 hover:text-primary-500"
              }`}
            >
              {form.tabLabel}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active.id}`}
        aria-labelledby={`${baseId}-tab-${active.id}`}
      >
        <PartnerFormPanel key={active.id} form={active} />
      </div>
    </div>
  );
}

function PartnerFormPanel({ form }: { form: PartnerFormDefinition }) {
  const idPrefix = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);
  // Same "unconfigured = not required" read every captcha call site uses —
  // see Captcha.tsx's own doc comment.
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function buildPayload() {
    const name = form.nameKeys
      .map((key) => values[key]?.trim())
      .filter(Boolean)
      .join(" ");

    const nameAndEmailKeys = new Set([...form.nameKeys, form.emailKey]);
    const detailLines = form.fields
      .filter((field) => !nameAndEmailKeys.has(field.key))
      .map((field) => `${field.label}: ${values[field.key]?.trim() ?? ""}`);

    const message = [
      ...detailLines,
      "",
      `${form.textareaLabel}`,
      details.trim() || "No additional message provided.",
    ].join("\n");

    return {
      name,
      email: values[form.emailKey]?.trim() ?? "",
      type: form.submitType,
      url: window.location.pathname,
      message,
      captchaToken,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        const apiMessage = isApiEnvelope(body) ? body.message : undefined;
        throw new Error(apiMessage || "Something went wrong. Please try again.");
      }

      setStatus("success");
      toast.success("Thank you — your inquiry has been sent. We'll reply within 48 hours.");
      setValues({});
      setDetails("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      // A Turnstile token is single-use either way — clear it and re-render
      // the widget so a retry can't silently resend a spent token.
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {form.fields.map((field) => {
          const id = `${idPrefix}-${field.key}`;
          return (
            <div key={field.key} className={field.half ? "" : "sm:col-span-2"}>
              <label htmlFor={id} className="sr-only">
                {field.label}
              </label>
              {field.kind === "select" ? (
                <div className="relative">
                  <select
                    id={id}
                    required={field.required}
                    value={values[field.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                    }
                    className={`${inputClassName} appearance-none pr-10 ${values[field.key] ? "" : "text-brand-neutral-800"}`}
                  >
                    <option value="" disabled>
                      {field.label}
                    </option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-brand-neutral-800"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              ) : (
                <input
                  id={id}
                  type={field.kind}
                  required={field.required}
                  maxLength={255}
                  placeholder={field.label}
                  autoComplete={field.kind === "email" ? "email" : undefined}
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                  }
                  className={inputClassName}
                />
              )}
            </div>
          );
        })}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-details`}
          className="mb-2 block text-body-m font-bold text-brand-neutral-900"
        >
          {form.textareaLabel}
        </label>
        <textarea
          id={`${idPrefix}-details`}
          rows={4}
          required
          maxLength={2000}
          placeholder={form.textareaPlaceholder}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className={`${inputClassName} resize-none`}
        />
      </div>

      <Captcha ref={captchaRef} onVerify={setCaptchaToken} />

      <button
        type="submit"
        disabled={status === "submitting" || (captchaRequired && !captchaToken)}
        className="mt-2 w-full rounded-pill bg-secondary-500 py-4 text-button-l font-bold text-brand-neutral-000 transition-colors duration-200 hover:bg-[#e67512] disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : form.submitLabel}
      </button>

      <div aria-live="polite">
        {status === "error" ? (
          <p className="text-center text-body-m font-medium text-error-700">{errorMessage}</p>
        ) : null}
      </div>

      <p className="text-center text-body-s font-medium text-brand-neutral-800">{form.note}</p>
    </form>
  );
}
