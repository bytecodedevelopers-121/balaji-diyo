"use client";

import { useId, useMemo, useState } from "react";
import { isApiEnvelope } from "@/lib/api/api-response";
import type { Trip } from "@/features/trips/types/trip.types";
import type { InitiatePacoCheckoutPayload, InitiatePacoCheckoutResult } from "@/features/bookings/types/payment.types";
import { CreditCardIcon, LockIcon, ShieldCheckIcon } from "./icons";

interface PaymentFormProps {
  packages: Trip[];
}

const CUSTOM_PACKAGE_VALUE = "custom";
/** Matches the legacy page's own "4% bank service charge" note — see payment.controller.ts's real PACO integration this posts to. */
const PROCESSING_FEE_RATE = 0.04;

const cardClassName = "overflow-hidden rounded-2xl border border-[#fbc99d] bg-white";
const cardHeaderClassName = "flex items-center gap-2 border-b border-brand-neutral-300 bg-brand-neutral-100 px-6 py-4";
const inputClassName =
  "w-full rounded-xl border border-primary-200 bg-white px-4 py-3 font-poppins text-body-m text-brand-neutral-1000 outline-none placeholder:text-brand-neutral-600 focus:border-primary-500";
const labelClassName = "mb-1.5 block font-poppins text-body-m font-medium text-brand-neutral-800";

/**
 * Standalone payment form — legacy `/payment` had no booking behind it,
 * just a package picker (or "Custom Package / Other Service"), a
 * self-entered amount, payer details, and a 4%-surcharge summary, all
 * feeding straight into PACO checkout. Mirrors `CheckoutView`'s real
 * `POST /payments/paco/checkout` → `window.location.assign(paymentUrl)`
 * call (book-now/[slug]/_components/CheckoutView.tsx) but skips the
 * booking-creation step entirely — there's no trip/dates/travelers here,
 * just a payment.
 */
export function PaymentForm({ packages }: PaymentFormProps) {
  const idPrefix = useId();

  const [packageId, setPackageId] = useState("");
  const [amount, setAmount] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "redirecting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotal = useMemo(() => {
    const parsed = Number(amount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [amount]);
  const processingFee = subtotal * PROCESSING_FEE_RATE;
  const total = subtotal + processingFee;

  const selectedPackage = packages.find((item) => item.id === packageId);
  const description =
    packageId === CUSTOM_PACKAGE_VALUE ? "Custom Package / Other Service" : selectedPackage?.title;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!packageId) {
      setErrorMessage("Please select a package.");
      return;
    }
    if (subtotal <= 0) {
      setErrorMessage("Please enter a payment amount.");
      return;
    }

    setStatus("submitting");

    const payload: InitiatePacoCheckoutPayload = {
      packageId: packageId === CUSTOM_PACKAGE_VALUE ? undefined : packageId,
      customerName: fullName.trim(),
      customerEmail: email.trim(),
      amount: total,
      description,
      standalone: true,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/paco/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        const apiMessage = isApiEnvelope(body) ? body.message : undefined;
        throw new Error(apiMessage || "Something went wrong. Please try again.");
      }

      const data = isApiEnvelope(body) ? (body.data as InitiatePacoCheckoutResult) : undefined;
      if (!data?.paymentUrl) {
        throw new Error("Something went wrong. Please try again.");
      }

      setStatus("redirecting");
      window.location.assign(data.paymentUrl);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "redirecting") {
    return (
      <div className="mx-auto flex w-full max-w-160 flex-col items-center gap-4 px-6 py-24 text-center">
        <span
          aria-hidden="true"
          className="size-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        />
        <h2 className="font-poppins text-heading-2xl font-medium text-brand-neutral-1000">
          Taking you to secure payment…
        </h2>
        <p className="font-poppins text-body-l text-brand-neutral-700">
          Redirecting you to our payment provider to complete payment. This should only take a moment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        <div className={cardClassName}>
          <div className={cardHeaderClassName}>
            <ShieldCheckIcon className="size-5 text-primary-500" />
            <h2 className="font-poppins text-raleway-xl font-medium text-brand-neutral-1000">Trip Details</h2>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <label className={labelClassName} htmlFor={`${idPrefix}-package`}>
                Select Package <span className="text-secondary-500">*</span>
              </label>
              <select
                id={`${idPrefix}-package`}
                required
                value={packageId}
                onChange={(event) => setPackageId(event.target.value)}
                className={`${inputClassName} appearance-none`}
              >
                <option value="" disabled>
                  Choose your adventure...
                </option>
                <option value={CUSTOM_PACKAGE_VALUE}>Custom Package / Other Service</option>
                {packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClassName} htmlFor={`${idPrefix}-amount`}>
                Payment Amount (USD) <span className="text-secondary-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 font-poppins text-body-m font-medium text-brand-neutral-600">
                  $
                </span>
                <input
                  id={`${idPrefix}-amount`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className={`${inputClassName} pl-9`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={cardClassName}>
          <div className={cardHeaderClassName}>
            <CreditCardIcon className="size-5 text-primary-500" />
            <h2 className="font-poppins text-raleway-xl font-medium text-brand-neutral-1000">Payer Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor={`${idPrefix}-name`}>
                Full Name <span className="text-secondary-500">*</span>
              </label>
              <input
                id={`${idPrefix}-name`}
                type="text"
                required
                autoComplete="name"
                placeholder="John Doe"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor={`${idPrefix}-email`}>
                Email Address <span className="text-secondary-500">*</span>
              </label>
              <input
                id={`${idPrefix}-email`}
                type="email"
                required
                autoComplete="email"
                placeholder="john@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      </div>

      <aside className="flex h-fit flex-col gap-6">
        <div className={cardClassName}>
          <div className="flex items-center justify-between bg-brand-neutral-1000 px-6 py-4">
            <h2 className="font-poppins text-raleway-xl font-medium text-brand-neutral-000">Payment Summary</h2>
            <ShieldCheckIcon className="size-5 text-secondary-500" />
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-poppins text-body-m text-brand-neutral-700">Subtotal</span>
                <span className="font-poppins text-body-m font-semibold text-brand-neutral-1000">
                  US$ {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-poppins text-body-m text-brand-neutral-700">
                  Processing Fee
                  <span className="rounded-md bg-brand-neutral-200 px-1.5 py-0.5 font-poppins text-body-s text-brand-neutral-600">
                    4%
                  </span>
                </span>
                <span className="font-poppins text-body-m font-semibold text-brand-neutral-1000">
                  US$ {processingFee.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-dashed border-brand-neutral-300 pt-3">
                <div className="flex items-end justify-between">
                  <span className="font-poppins text-body-l font-bold text-brand-neutral-1000">Total</span>
                  <span className="font-poppins text-2xl font-extrabold text-primary-500">
                    US$ {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-pill bg-secondary-500 px-6 py-3.5 font-poppins text-body-m font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "submitting" ? "Processing…" : "Pay Now"}
              {status !== "submitting" ? <span aria-hidden="true">→</span> : null}
            </button>
            {status === "error" && errorMessage ? (
              <p className="mt-2 font-poppins text-body-s font-medium text-error-700">{errorMessage}</p>
            ) : null}

            <div className="mt-4 flex items-center justify-center gap-1.5 font-poppins text-body-s font-semibold tracking-wide text-brand-neutral-500 uppercase">
              <LockIcon className="size-3" />
              SSL Secure Payment
            </div>
          </div>
        </div>

        <div className="flex gap-4 rounded-2xl border border-primary-200 bg-primary-100 p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary-500 shadow-sm">
            <LockIcon className="size-4" />
          </span>
          <p className="font-poppins text-body-s leading-relaxed text-brand-neutral-700">
            <span className="mb-1 block font-medium text-brand-neutral-1000">Bank Processing Fee</span>
            Please note that a <span className="font-semibold text-brand-neutral-1000">4% bank service charge</span>{" "}
            is applicable on all credit card transactions. This fee is levied directly by the bank for secure
            processing.
          </p>
        </div>
      </aside>
    </form>
  );
}
