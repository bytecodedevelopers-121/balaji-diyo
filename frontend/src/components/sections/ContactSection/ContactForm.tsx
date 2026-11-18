"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isApiEnvelope } from "@/lib/api/api-response";
import { salutations, countries } from "@/config/contact-form-options";
import { Captcha, type CaptchaHandle } from "@/components/ui/Captcha/Captcha";
import { toast } from "@/components/ui/Toast/toast";

/**
 * The card on the right half of ContactSection (design-references/
 * contact.png, y≈699–1258 at 1440px, x≈657–1377 — "Simply fill out the
 * form below..."). Client Component: it's the site's first real form
 * submission (the footer newsletter form is deliberately inert, see
 * Footer.tsx's own doc comment) — POSTs straight to the public
 * `POST /contacts` endpoint (backend/src/modules/contact-message) via
 * `NEXT_PUBLIC_API_URL` and a plain `fetch`, per api-client.ts's own
 * guidance for Client Components that need the API directly.
 *
 * Field mapping, since the design's fields don't line up 1:1 with
 * CreateContactMessageDto:
 * - Salutation + Full Name combine into `name`.
 * - "Your Country" has no field on the backend DTO — folded into the
 *   top of `message` as a "Country: …" line instead of being dropped.
 * - Contact → `phone` (optional, matches the DTO and the design's lack
 *   of a "*" on this field).
 * - No. of Travelers → `numberOfTraveller`.
 * - `type`/`url` aren't shown anywhere in the design — they're the
 *   DTO's own required bookkeeping fields, set here automatically
 *   ("general" and the current path) rather than surfaced as UI.
 * - The design shows no "*" on the message field, but the DTO requires
 *   a non-empty `message`; an empty message is sent as a placeholder
 *   string instead of blocking submission or inventing a visible
 *   required-field marker the design doesn't have.
 *
 * Reused as-is (same fields, same card styling) on a trekking route's
 * detail page under the heading "Make an Inquiry" instead of "Simply
 * fill out the form..." (design-references/trekking-route-details.png,
 * y≈870–1120 at 1440px) — `heading`/`type`/`packageId` exist for that
 * reuse: `type` distinguishes a route-specific enquiry from /contact's
 * general one for anyone reading the admin's contact-message list later,
 * and `packageId` (CreateContactMessageDto already has this field) links
 * the enquiry to the route's underlying trek package.
 *
 * A third reuse, under "Ask Question" on a blog post's own page
 * (design-references/"Travel Blogs - Individual.png", y≈1720–2080 at
 * 1440px) — kept `layout="one-column"` from when this form used to sit
 * in that page's ~280px ToC sidebar column (moved into the wide content
 * column instead once a sticky ToC there needed nothing left directly
 * below it to slide over, see BlogDetailSection's own comment): the
 * two-column field pairs this component always used before were paired
 * via a viewport breakpoint (`sm:flex-row`), not a container one — at
 * any viewport ≥640px they'd force two fields side by side regardless
 * of how narrow the column itself is. `layout` makes that pairing
 * opt-out rather than reaching for CSS container queries (not used
 * anywhere else in this codebase yet) for one call site.
 */
export function ContactForm({
  heading = "Simply fill out the form below, and we'll get back to you as soon as possible.",
  type = "general",
  packageId,
  maxWidthClassName = "max-w-[720px]",
  layout = "two-column",
  redirectOnSuccess,
  captchaSize = "flexible",
}: {
  heading?: string;
  type?: string;
  packageId?: string;
  /** Overrides the card's width cap — /contact's own 720px card vs. the wider one on a trekking route's detail page (design-references/trekking-route-details.png shows ~916px there, a wider single-column page vs. /contact's two-column one). Replaces the default rather than merging with it (this file's `cn()` is plain concatenation, not a Tailwind-merge, so two conflicting `max-w-*` classes would both land in the stylesheet with no guaranteed winner). */
  maxWidthClassName?: string;
  /** "one-column" stacks every field full-width regardless of viewport — for embedding in a narrow container (a blog post's sidebar) where the usual `sm:flex-row` pairing would overflow it. */
  layout?: "two-column" | "one-column";
  /** When set, a successful submission navigates here instead of showing the inline "Thanks — ..." success message below the form — TripEnquiryModal's only reuse (2026-09-02, client-requested) sends the visitor to a themed thank-you page instead of leaving the result buried inside the still-open modal. Every other reuse (the plain /contact page, the trekking-route and blog "Ask Question" forms) leaves this unset and keeps the original inline-success behavior. */
  redirectOnSuccess?: string;
  /** Forwarded to `Captcha`'s own `size` prop — see its doc comment. Only `BlogAskQuestionSidebar`'s truly narrow (~216px) card overrides this to `"compact"`; every other reuse is wide enough for the default `"flexible"`. */
  captchaSize?: "flexible" | "compact";
} = {}) {
  const rowClassName =
    layout === "one-column" ? "flex flex-col gap-6" : "flex flex-col gap-6 sm:flex-row sm:gap-6";
  const idPrefix = useId();
  const router = useRouter();
  const [values, setValues] = useState({
    salutation: salutations[0] as string,
    fullName: "",
    country: "",
    contact: "",
    email: "",
    travelers: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);
  // Same "unconfigured = not required" read every captcha call site uses —
  // see Captcha.tsx's own doc comment.
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const trimmedMessage = values.message.trim();
    const message = values.country
      ? `Country: ${values.country}\n\n${trimmedMessage || "No additional message provided."}`
      : trimmedMessage || "No additional message provided.";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: `${values.salutation} ${values.fullName}`.trim(),
          email: values.email,
          type,
          url: typeof window !== "undefined" ? window.location.pathname : "/contact",
          phone: values.contact || undefined,
          numberOfTraveller: values.travelers ? Number(values.travelers) : undefined,
          packageId,
          message,
          captchaToken,
        }),
      });
      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        const apiMessage = isApiEnvelope(body) ? body.message : undefined;
        throw new Error(apiMessage || "Something went wrong. Please try again.");
      }

      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
        return;
      }

      setStatus("success");
      toast.success("Thanks — your message has been sent. We'll get back to you soon.");
      setValues({
        salutation: salutations[0],
        fullName: "",
        country: "",
        contact: "",
        email: "",
        travelers: "",
        message: "",
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      // A Turnstile token is single-use either way — clear it and re-render
      // the widget so a retry (success's reset or a failed submit) can't
      // silently resend a spent token.
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  }

  const fieldClassName =
    "w-full min-w-0 bg-transparent pb-2 font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-900 placeholder:text-brand-neutral-500 focus:outline-none";
  const fieldStyle = { borderBottom: "var(--border-input)" };

  return (
    <div
      className={`order-1 flex w-full ${maxWidthClassName} flex-col gap-8 bg-brand-neutral-000 p-8 shadow-card-strong lg:order-2 lg:shrink-0`}
      style={{ border: "var(--border-card-contact)" }}
    >
      <p className="font-poppins text-[22px] leading-[35.2px] font-medium text-brand-neutral-1000">
        {heading}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className={rowClassName}>
          <div className="flex-1">
            <label className="sr-only" htmlFor={`${idPrefix}-salutation`}>
              Salutation
            </label>
            <div className="relative">
              <select
                id={`${idPrefix}-salutation`}
                value={values.salutation}
                onChange={(event) => update("salutation", event.target.value)}
                className={`${fieldClassName} appearance-none pr-6`}
                style={fieldStyle}
              >
                {salutations.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-brand-neutral-900" />
            </div>
          </div>
          <div className="flex-1">
            <label className="sr-only" htmlFor={`${idPrefix}-full-name`}>
              Full Name
            </label>
            <input
              id={`${idPrefix}-full-name`}
              type="text"
              required
              placeholder="Full Name *"
              autoComplete="name"
              value={values.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              className={fieldClassName}
              style={fieldStyle}
            />
          </div>
        </div>

        <div className={rowClassName}>
          <div className="flex-1">
            <label className="sr-only" htmlFor={`${idPrefix}-country`}>
              Your Country
            </label>
            <div className="relative">
              <select
                id={`${idPrefix}-country`}
                value={values.country}
                onChange={(event) => update("country", event.target.value)}
                className={`${fieldClassName} appearance-none pr-6 ${values.country ? "" : "text-brand-neutral-800"}`}
                style={fieldStyle}
              >
                <option value="">Your Country</option>
                {countries.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-brand-neutral-900" />
            </div>
          </div>
          <div className="flex-1">
            <label className="sr-only" htmlFor={`${idPrefix}-contact`}>
              Contact
            </label>
            <input
              id={`${idPrefix}-contact`}
              type="tel"
              placeholder="Contact"
              autoComplete="tel"
              value={values.contact}
              onChange={(event) => update("contact", event.target.value)}
              className={fieldClassName}
              style={fieldStyle}
            />
          </div>
        </div>

        <div className={rowClassName}>
          <div className="flex-1">
            <label className="sr-only" htmlFor={`${idPrefix}-email`}>
              Email
            </label>
            <input
              id={`${idPrefix}-email`}
              type="email"
              required
              placeholder="Email *"
              autoComplete="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              className={fieldClassName}
              style={fieldStyle}
            />
          </div>
          <div className="flex-1">
            <label className="sr-only" htmlFor={`${idPrefix}-travelers`}>
              No. of Travelers
            </label>
            <input
              id={`${idPrefix}-travelers`}
              type="number"
              min={1}
              required
              placeholder="No. of Travelers *"
              value={values.travelers}
              onChange={(event) => update("travelers", event.target.value)}
              className={fieldClassName}
              style={fieldStyle}
            />
          </div>
        </div>

        <div className="h-[100px]" style={fieldStyle}>
          <label className="sr-only" htmlFor={`${idPrefix}-message`}>
            Your Message
          </label>
          <textarea
            id={`${idPrefix}-message`}
            placeholder="Your Message Here"
            value={values.message}
            onChange={(event) => update("message", event.target.value)}
            className={`${fieldClassName} h-full resize-none`}
          />
        </div>

        <Captcha ref={captchaRef} onVerify={setCaptchaToken} size={captchaSize} />

        <div className="flex flex-col items-start gap-3">
          <button
            type="submit"
            disabled={status === "submitting" || (captchaRequired && !captchaToken)}
            className="flex h-14 items-center justify-center bg-primary-500 px-5 py-[6px] font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-white-00 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === "submitting" ? "Sending…" : "Submit"}
          </button>
          {status === "error" ? (
            <p className="font-poppins text-[14px] leading-[22.4px] text-error-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
