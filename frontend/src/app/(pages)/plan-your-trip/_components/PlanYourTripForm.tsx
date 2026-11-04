"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { countries } from "@/config/contact-form-options";
import { isApiEnvelope } from "@/lib/api/api-response";

const TRIP_TYPES = ["Trekking", "Peak Climbing", "Cultural Tour", "Jungle Safari", "Helicopter Tour", "Pilgrimage", "Custom Holiday"];
const HOTEL_TYPES = ["Budget / Tea house", "3 Star", "4 Star", "5 Star / Luxury", "Mixed"];
const BUDGETS = ["Under US$500", "US$500 - 1,000", "US$1,000 - 2,000", "US$2,000 - 4,000", "US$4,000+"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Italian", "Chinese", "Japanese", "Hindi"];
const SOURCES = ["Google", "Facebook / Instagram", "TripAdvisor", "Friend or family", "Travel blog", "Other"];

const box =
  "w-full rounded-[3px] border border-brand-neutral-300 bg-white px-4 pt-9 pb-3 text-[17px] text-brand-neutral-900 outline-none focus:border-logo-navy";

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute top-2.5 left-4 text-[15px] text-brand-neutral-700">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function Input({
  name,
  label,
  type = "text",
  required = true,
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label} required={required}>
      <input name={name} type={type} required={required} {...rest} className={box} />
    </Field>
  );
}

function Select({ name, label, options, required = true }: { name: string; label: string; options: readonly string[]; required?: boolean }) {
  return (
    <Field label={label} required={required}>
      <select name={name} required={required} defaultValue="" className={box}>
        <option value="" disabled>
          Choose One Option
        </option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

export function PlanYourTripForm() {
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) {
      setStatus("error");
      setMessage("Please accept the terms and conditions to continue.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    setStatus("submitting");
    setMessage(null);

    const details = [
      `Country: ${get("country")}`,
      `Trip type: ${get("tripType")}`,
      `Approx. date of travel: ${get("date")}`,
      `Duration: ${get("duration")}`,
      `Adults: ${get("adults")}, Children: ${get("children") || "0"}`,
      `Hotel type: ${get("hotel")}`,
      `Estimated budget: ${get("budget")}`,
      `Guide language: ${get("language")}`,
      `Found us via: ${get("source")}`,
      "",
      get("info"),
    ].join("\n");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: get("name"),
          email: get("email"),
          type: "plan-your-trip",
          url: window.location.pathname,
          phone: get("phone") || undefined,
          numberOfTraveller: Number(get("adults")) + Number(get("children") || 0),
          message: details,
        }),
      });
      const body: unknown = await response.json().catch(() => undefined);
      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        throw new Error((isApiEnvelope(body) ? body.message : undefined) || "Something went wrong. Please try again.");
      }
      form.reset();
      setAccepted(false);
      setStatus("success");
      setMessage("Thank you! Our team will get back to you with a personalised plan soon.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-brand-neutral-200 bg-white p-5 shadow-[0_2px_14px_rgba(6,74,112,0.1)] sm:p-10">
      <h2 className="text-[20px] font-semibold text-[#d98a00]">Personal Information</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Input name="name" label="Full Name" />
        <Input name="email" label="Email Address" type="email" />
        <Input name="phone" label="Country Code + Phone Number" type="tel" />
        <Select name="country" label="Choose Your Country" options={countries} />
      </div>

      <h2 className="mt-10 text-[20px] font-semibold text-[#d98a00]">Trip Details</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Select name="tripType" label="Select Trip Type" options={TRIP_TYPES} />
        <Input name="date" label="Approx. Date of Travel" type="date" />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-[2fr_1fr_1fr]">
        <Input name="duration" label="Trip Duration" placeholder="e.g. 14 days" />
        <Input name="adults" label="No. of Adult" type="number" min={1} />
        <Input name="children" label="No. of Children" type="number" min={0} required={false} />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Select name="hotel" label="Hotel Type" options={HOTEL_TYPES} />
        <Select name="budget" label="Estimated Budget" options={BUDGETS} />
        <Select name="language" label="Guide Language" options={LANGUAGES} />
        <Select name="source" label="Where Did You Find Us?" options={SOURCES} />
      </div>
      <div className="mt-5">
        <Field label="More Information" required>
          <textarea name="info" required rows={9} className={`${box} resize-y`} />
        </Field>
      </div>

      <label className="mt-6 flex items-center gap-2 text-[14px] text-brand-neutral-800">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="accent-[#064a70]" />
        I accept{" "}
        <a href="/company/terms-and-conditions" target="_blank" className="text-[#d98a00] underline">
          terms and conditions
        </a>
      </label>

      {message ? (
        <p role={status === "error" ? "alert" : "status"} className={`mt-4 text-[15px] ${status === "error" ? "text-red-600" : "text-logo-green"}`}>
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 rounded-[4px] bg-logo-sun px-10 py-3.5 text-[15px] font-bold tracking-wide text-logo-navy-dark uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
