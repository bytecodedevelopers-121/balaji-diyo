"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countries, salutations } from "@/config/contact-form-options";
import type { Trip } from "@/features/trips/types/trip.types";
import { isApiEnvelope } from "@/lib/api/api-response";

interface CustomizeTripFormProps {
  packages: Trip[];
}

export function CustomizeTripForm({ packages }: CustomizeTripFormProps) {
  const idPrefix = useId();
  const packagePickerRef = useRef<HTMLDivElement>(null);
  const [isPackagePickerOpen, setIsPackagePickerOpen] = useState(false);
  const [packageQuery, setPackageQuery] = useState("");
  const [values, setValues] = useState({
    packageId: "",
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

  const selectedPackage = packages.find((item) => item.id === values.packageId);
  const filteredPackages = useMemo(() => {
    const query = packageQuery.trim().toLocaleLowerCase();
    return query
      ? packages.filter((item) => item.title.toLocaleLowerCase().includes(query))
      : packages;
  }, [packageQuery, packages]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!packagePickerRef.current?.contains(event.target as Node)) {
        setIsPackagePickerOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsPackagePickerOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function choosePackage(packageId: string) {
    update("packageId", packageId);
    setPackageQuery("");
    setIsPackagePickerOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const countryLine = values.country ? `Country: ${values.country}\n\n` : "";
    const message = `${countryLine}${values.message.trim() || "No additional message provided."}`;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: `${values.salutation} ${values.fullName}`.trim(),
          email: values.email,
          type: "customize-trip",
          url: typeof window === "undefined" ? "/customize-trip" : window.location.pathname,
          phone: values.contact || undefined,
          numberOfTraveller: Number(values.travelers),
          packageId: values.packageId,
          message,
        }),
      });
      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        throw new Error(
          (isApiEnvelope(body) ? body.message : undefined) ||
            "Something went wrong. Please try again.",
        );
      }

      setStatus("success");
      setValues({
        packageId: "",
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
    }
  }

  const fieldClassName =
    "w-full min-w-0 bg-transparent pb-2 font-poppins text-body-l font-medium text-brand-neutral-900 placeholder:text-brand-neutral-700 focus:outline-none";
  const fieldStyle = { borderBottom: "1px solid #6b6b6b" };

  return (
    <div className="relative w-full bg-brand-neutral-000 p-4 shadow-card-strong sm:p-8">
      <p className="max-w-[620px] font-poppins text-[22px] leading-[1.6] font-medium text-brand-neutral-1000">
        Simply fill out the form below, and we&apos;ll get back to you as soon as possible.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
        <div ref={packagePickerRef} className="relative z-20">
          <label className="sr-only" htmlFor={`${idPrefix}-package-search`}>
            Select a Package
          </label>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isPackagePickerOpen}
            onClick={() => setIsPackagePickerOpen((open) => !open)}
            className={`${fieldClassName} flex items-center justify-between text-left`}
            style={fieldStyle}
          >
            <span className={selectedPackage ? "text-brand-neutral-900" : "text-brand-neutral-700"}>
              {selectedPackage?.title ?? "Select a Package *"}
            </span>
            <ChevronDownIcon className="size-4 shrink-0" />
          </button>

          {isPackagePickerOpen ? (
            <div className="absolute top-full right-0 left-0 overflow-hidden rounded-[16px] bg-brand-neutral-000 shadow-card-strong">
              <div className="flex h-14 items-center gap-3 border-b border-brand-neutral-300 px-4">
                <SearchIcon className="size-5 shrink-0 text-brand-neutral-800" />
                <input
                  id={`${idPrefix}-package-search`}
                  type="search"
                  autoFocus
                  value={packageQuery}
                  onChange={(event) => setPackageQuery(event.target.value)}
                  placeholder="Search"
                  className="size-full bg-transparent font-poppins text-body-m text-brand-neutral-900 placeholder:text-brand-neutral-600 focus:outline-none"
                />
              </div>
              <ul role="listbox" className="max-h-[340px] overflow-y-auto">
                {filteredPackages.length > 0 ? (
                  filteredPackages.map((item) => (
                    <li key={item.id} role="option" aria-selected={item.id === values.packageId}>
                      <button
                        type="button"
                        onClick={() => choosePackage(item.id)}
                        className="flex min-h-14 w-full items-center border-b border-brand-neutral-300 px-4 text-left font-poppins text-body-m text-brand-neutral-800 last:border-b-0 hover:bg-brand-neutral-100"
                      >
                        {item.title}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-5 font-poppins text-body-m text-brand-neutral-700">
                    No packages found.
                  </li>
                )}
              </ul>
            </div>
          ) : null}
          <select
            required
            tabIndex={-1}
            aria-hidden="true"
            value={values.packageId}
            onChange={(event) => update("packageId", event.target.value)}
            className="pointer-events-none absolute size-px opacity-0"
          >
            <option value="">Select a package</option>
            {packages.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
          <FieldSelect
            id={`${idPrefix}-salutation`}
            label="Salutation"
            value={values.salutation}
            options={salutations}
            onChange={(value) => update("salutation", value)}
            className={fieldClassName}
          />
          <FieldInput id={`${idPrefix}-name`} label="Full Name" required value={values.fullName} onChange={(value) => update("fullName", value)} className={fieldClassName} />
          <FieldSelect id={`${idPrefix}-country`} label="Your Country" value={values.country} options={countries} placeholder="Your Country" onChange={(value) => update("country", value)} className={fieldClassName} />
          <FieldInput id={`${idPrefix}-contact`} label="Contact" type="tel" value={values.contact} onChange={(value) => update("contact", value)} className={fieldClassName} />
          <FieldInput id={`${idPrefix}-email`} label="Email" type="email" required value={values.email} onChange={(value) => update("email", value)} className={fieldClassName} />
          <FieldInput id={`${idPrefix}-travelers`} label="No. of Travelers" type="number" min={1} required value={values.travelers} onChange={(value) => update("travelers", value)} className={fieldClassName} />
        </div>

        <div className="h-[100px]" style={fieldStyle}>
          <label className="sr-only" htmlFor={`${idPrefix}-message`}>Your Message</label>
          <textarea id={`${idPrefix}-message`} placeholder="Your Message Here" value={values.message} onChange={(event) => update("message", event.target.value)} className={`${fieldClassName} h-full resize-none`} />
        </div>

        <div className="flex flex-col items-start gap-3">
          <button type="submit" disabled={status === "submitting" || packages.length === 0} className="flex h-14 items-center justify-center bg-primary-500 px-5 font-poppins text-button-m font-medium text-brand-neutral-000 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {status === "submitting" ? "Sending…" : "Submit"}
          </button>
          {packages.length === 0 ? <p className="font-poppins text-body-m text-error-700">No packages are currently available.</p> : null}
          {status === "success" ? <p className="font-poppins text-body-m text-success-800">Thanks — your request has been sent. We&apos;ll get back to you soon.</p> : null}
          {status === "error" ? <p className="font-poppins text-body-m text-error-700">{errorMessage}</p> : null}
        </div>
      </form>
    </div>
  );
}

function FieldInput({ id, label, type = "text", required, min, value, onChange, className }: { id: string; label: string; type?: string; required?: boolean; min?: number; value: string; onChange: (value: string) => void; className: string }) {
  return <div><label className="sr-only" htmlFor={id}>{label}</label><input id={id} type={type} min={min} required={required} placeholder={`${label}${required ? " *" : ""}`} value={value} onChange={(event) => onChange(event.target.value)} className={className} style={{ borderBottom: "1px solid #6b6b6b" }} /></div>;
}

function FieldSelect({ id, label, value, options, placeholder, onChange, className }: { id: string; label: string; value: string; options: readonly string[]; placeholder?: string; onChange: (value: string) => void; className: string }) {
  return <div className="relative"><label className="sr-only" htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${className} appearance-none pr-6`} style={{ borderBottom: "1px solid #6b6b6b" }}>{placeholder ? <option value="">{placeholder}</option> : null}{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDownIcon className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2" /></div>;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}

function SearchIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}
