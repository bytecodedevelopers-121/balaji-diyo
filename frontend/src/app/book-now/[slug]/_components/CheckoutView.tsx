"use client";

import { tripHref } from "@/lib/trip-href";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { isApiEnvelope } from "@/lib/api/api-response";
import { countries } from "@/config/contact-form-options";
import { Captcha, type CaptchaHandle } from "@/components/ui/Captcha/Captcha";
import { DatePicker } from "@/components/ui/DatePicker";
import type { PackageDetail } from "../../../[slug]/data";
import {
  computeEndDate,
  depositAmount,
  DEPOSIT_PERCENTAGE,
  formatDayLabel,
  pricePerPersonForAdults,
  splitContactNumber,
  tripDurationDays,
  type PaymentOption,
} from "../../../[slug]/_components/booking-helpers";
import { CheckIcon } from "../../../[slug]/_components/icons";
import type {
  AddTravellerPayload,
  CreateBookingPayload,
  CreateBookingResult,
} from "@/features/bookings/types/booking.types";
import type { InitiatePacoCheckoutPayload, InitiatePacoCheckoutResult } from "@/features/bookings/types/payment.types";
import { WhatsAppIcon } from "./icons";

interface CheckoutViewProps {
  trip: PackageDetail;
  query: { date?: string; adults?: string; addOns?: string; payment?: string };
  /** Passed down from the Server Component page rather than importing `@/config/site` here — that module pulls in `server-only` code (see `src/lib/env.ts`), which a Client Component can't import at all. */
  phone: string;
  phoneHref: string;
}

const inputClassName =
  "w-full rounded-md border border-brand-neutral-300 bg-white px-4 py-4 font-poppins text-body-m text-brand-neutral-1000 outline-none placeholder:text-brand-neutral-900 focus:border-primary-500";
const cardClassName = "rounded-md bg-white p-6 shadow-card-strong md:p-10";
const sectionHeadingClassName = "font-poppins text-heading-2xl font-semibold text-primary-500";

const tripTypeOptions = ["Trekking", "Tour", "Peak Climbing", "Expedition", "Helicopter Tour", "Other"];
const sourceOptions = ["Google", "Facebook", "Instagram", "TripAdvisor", "Friend or Family", "Travel Agent", "Other"];

interface LeadFormValues {
  firstName: string;
  lastName: string;
  country: string;
  whatsapp: string;
  dateOfBirth: string;
  tripType: string;
  source: string;
}

type UploadStatus = "idle" | "uploading" | "uploaded" | "error";

/**
 * One traveler's own identity/passport fields — repeated once per adult
 * (2026-09-03, direct request: "multiple persons section", one card per
 * traveler instead of a single "Lead traveler" form that only ever
 * captured one person no matter how many adults were booked). Traveler 1
 * is always the lead; `handleSubmit` below sends every entry to
 * `POST /bookings/:id/travellers`, not just the first.
 */
interface TravellerFormValues {
  fullName: string;
  passportNo: string;
  nationality: string;
  gender: string;
  dateOfBirth: string;
  photoPath: string | null;
  photoStatus: UploadStatus;
  photoFileName: string | null;
  passportImagePath: string | null;
  passportStatus: UploadStatus;
  passportFileName: string | null;
}

function emptyTraveller(): TravellerFormValues {
  return {
    fullName: "",
    passportNo: "",
    nationality: "",
    gender: "",
    dateOfBirth: "",
    photoPath: null,
    photoStatus: "idle",
    photoFileName: null,
    passportImagePath: null,
    passportStatus: "idle",
    passportFileName: null,
  };
}

/** Grows/shrinks a traveler list to match a new `adults` count, keeping
 *  whatever was already typed for the travelers that survive — a plain
 *  `Array.from({ length: adults })` on every change would blow away
 *  everything typed so far each time the stepper is clicked. */
function resizeTravellers(list: TravellerFormValues[], count: number): TravellerFormValues[] {
  const target = Math.max(1, count);
  if (target === list.length) return list;
  if (target < list.length) return list.slice(0, target);
  return [...list, ...Array.from({ length: target - list.length }, emptyTraveller)];
}

function isPaymentOption(value: string | undefined): value is PaymentOption {
  return value === "deposit" || value === "full";
}

/**
 * "Book Now" checkout — Figma node 845:29789. Traveler details + payment
 * preference, submitted to the real `POST /bookings` endpoint
 * (backend/src/modules/booking), then immediately chained into the real
 * PACO payment-gateway redirect (`POST /payments/paco/checkout` →
 * `window.location.assign(paymentUrl)`) — both real, live-verified backend
 * calls (booking creation and payment initiation are still two
 * independent requests, matching flamingo-base's own
 * `packageBooking`/`hblPayment` split, just chained here into one
 * continuous user action). Figma's own "Pay Now" frame (raw card-number
 * fields) is superseded by this — card entry happens on PACO's own
 * hosted page (`/payment-success`, `/payment-failed`, `/payment-cancel`
 * are where the browser lands after), never on this page.
 *
 * The booking is committed before payment is ever attempted, so a failed
 * *payment-initiation* call (network blip, gateway down) must not look
 * like a failed booking — falls back to a "booking received, contact us
 * to pay" screen instead of a hard error in that case (see `status ===
 * "success"` below).
 *
 * Traveler section (2026-09-03, direct request): one card per adult
 * (`travellers`, resized to match the "Adults" stepper — see
 * `resizeTravellers`), each with exactly the fields asked for — Full
 * Name, Passport No, Country, Gender, Date of Birth, Photo, Passport
 * Photo — with no visible `<label>` on the text/select fields, a
 * placeholder (plus an `aria-label` so screen readers still get a real
 * accessible name) standing in for it instead. Date of Birth uses the
 * shared `DatePicker` (its closed-state button shows "Date of Birth" as
 * a real placeholder) rather than a native `<input type="date">` —
 * browsers render their own locale-format hint over a native date
 * input's `placeholder` attribute and ignore the value entirely, so it
 * never actually showed. The passport-photo file input uses the custom
 * `FileUploadField` below rather than a bare `<input type="file">` — see
 * its own doc comment for why.
 *
 * The "PP Size Photo" field was pulled from the UI 2026-09-22 (direct
 * request) — its state (`photoPath`/`photoStatus`/`photoFileName`),
 * upload plumbing (`uploadTravellerFile`/`handleFileChange("photo")`),
 * and the optional `photo` field on the submit payload are all still
 * here, just with nothing left rendering that `FileUploadField`, in case
 * it needs to come back. Email/Contact Number stay a single,
 * once-only "how do we reach you" block (not one per traveler — nothing
 * asked for that, and the backend has nowhere to send 6 different
 * confirmation emails anyway); every traveler sent to
 * `POST /bookings/:id/travellers` reuses that same contact info, since
 * the per-traveler DTO still requires `email`/`countryCode` on each row.
 */
export function CheckoutView({ trip, query, phone, phoneHref }: CheckoutViewProps) {
  const idPrefix = useId();
  const durationDays = tripDurationDays(trip);

  const [adults, setAdults] = useState(() => {
    const parsed = Number(query.adults);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [tripDate, setTripDate] = useState(query.date ?? trip.departures[0]?.startDate ?? "");
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>(() =>
    Object.fromEntries((query.addOns ? query.addOns.split("|") : []).map((label) => [label, 1])),
  );
  const [lead, setLead] = useState<LeadFormValues>({
    firstName: "",
    lastName: "",
    country: "",
    whatsapp: "",
    dateOfBirth: "",
    tripType: "",
    source: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [tiersOpen, setTiersOpen] = useState(false);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>(
    isPaymentOption(query.payment) ? query.payment : "full",
  );

  const [travellers, setTravellers] = useState<TravellerFormValues[]>(() =>
    Array.from({ length: adults }, emptyTraveller),
  );
  const [contact, setContact] = useState({ email: "", contactNumber: "", specialRequests: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "redirecting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Customer-facing "BA-<number>" reference (direct client request
  // 2026-09-07) — see `CreateBookingResult.bookingNumber`'s own doc
  // comment. This replaces what used to be a `bookingId` state holding
  // the raw cuid for display — the travellers follow-up call below never
  // actually read that state, it closes over its own local
  // `newBookingId` instead, so there was nothing else keeping it alive.
  const [bookingNumber, setBookingNumber] = useState<number | null>(null);
  // "BA-<package title>-<number>" — mirrors the backend's own
  // `bookingCode()` in `booking.mail.ts`. Built from `trip.title` (this
  // checkout is always for one specific package) rather than stored, so
  // it stays correct even if the package is later renamed.
  const bookingCode = bookingNumber !== null ? `BA-${trip.title}-${bookingNumber}` : null;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);
  // Same "unconfigured = not required" read every captcha call site uses —
  // see Captcha.tsx's own doc comment.
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  // Sticky order-summary sidebar (client-requested, 2026-09-02) — was
  // just `h-fit`, so it scrolled away with the rest of the form on a
  // tall multi-field checkout and ended up stranded well below the
  // submit button by the time a traveler reached the bottom fields.
  // Same "track the header's actual rendered height" approach as
  // BookingSidebar's `<aside>` (see that file's comment) instead of a
  // fixed `top` guess, since the site header's own height changes.
  const [stickyTop, setStickyTop] = useState(96);
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;

    function syncStickyTop() {
      setStickyTop(Math.max(0, header!.getBoundingClientRect().bottom) + 24);
    }

    syncStickyTop();
    window.addEventListener("scroll", syncStickyTop, { passive: true });
    window.addEventListener("resize", syncStickyTop);
    header.addEventListener("transitionend", syncStickyTop);
    return () => {
      window.removeEventListener("scroll", syncStickyTop);
      window.removeEventListener("resize", syncStickyTop);
      header.removeEventListener("transitionend", syncStickyTop);
    };
  }, []);

  function updateAdults(next: number) {
    const clamped = Math.max(1, next);
    setAdults(clamped);
    setTravellers((prev) => resizeTravellers(prev, clamped));
  }

  function updateContact<K extends keyof typeof contact>(key: K, value: (typeof contact)[K]) {
    setContact((prev) => ({ ...prev, [key]: value }));
  }

  function updateTraveller<K extends keyof TravellerFormValues>(index: number, key: K, value: TravellerFormValues[K]) {
    setTravellers((prev) => prev.map((traveller, i) => (i === index ? { ...traveller, [key]: value } : traveller)));
  }

  function updateLead<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
    setLead((prev) => ({ ...prev, [key]: value }));
  }

  function setAddOnQuantity(label: string, qty: number) {
    setAddOnQty((prev) => ({ ...prev, [label]: Math.max(0, qty) }));
  }

  // Uploads immediately on file selection (rather than holding the raw File
  // in state and uploading at submit time) so a slow/failed upload surfaces
  // before the traveler has filled out the rest of the form — and because
  // `POST /bookings/:id/travellers` needs the storage `path` this returns,
  // not the file itself. Storage is private (see the backend route's own
  // comment) even though this endpoint takes no auth: a passport scan/photo
  // is sensitive PII regardless of who can submit one.
  async function uploadTravellerFile(index: number, field: "photo" | "passport", file: File) {
    const pathKey = field === "photo" ? "photoPath" : "passportImagePath";
    const statusKey = field === "photo" ? "photoStatus" : "passportStatus";

    updateTraveller(index, statusKey, "uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/upload/${field}`, {
        method: "POST",
        body: formData,
      });
      const body: unknown = await response.json().catch(() => undefined);
      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        throw new Error("upload failed");
      }
      const data = isApiEnvelope(body) ? (body.data as { path?: string }) : undefined;
      if (!data?.path) throw new Error("upload failed");

      setTravellers((prev) =>
        prev.map((traveller, i) =>
          i === index ? { ...traveller, [pathKey]: data.path as string, [statusKey]: "uploaded" } : traveller,
        ),
      );
    } catch {
      setTravellers((prev) =>
        prev.map((traveller, i) => (i === index ? { ...traveller, [pathKey]: null, [statusKey]: "error" } : traveller)),
      );
    }
  }

  function handleFileChange(index: number, field: "photo" | "passport") {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      updateTraveller(index, field === "photo" ? "photoFileName" : "passportFileName", file.name);
      void uploadTravellerFile(index, field, file);
    };
  }

  const departureDate = tripDate || new Date().toISOString().slice(0, 10);
  const endDate = computeEndDate(departureDate, durationDays);
  const start = formatDayLabel(departureDate);
  const pricePerPax = pricePerPersonForAdults(trip, adults);
  const addOnsList = trip.addOns
    .filter((addOn) => (addOnQty[addOn.label] ?? 0) > 0)
    .map((addOn) => {
      const qty = addOnQty[addOn.label];
      return { ...addOn, qty, lineTotal: addOn.price * qty };
    });
  const addOnsTotal = addOnsList.reduce((sum, addOn) => sum + addOn.lineTotal, 0);
  const total = pricePerPax * adults + addOnsTotal;
  const deposit = depositAmount(total);
  const dueNow = paymentOption === "deposit" ? deposit : total;
  const anyUploadInProgress = travellers.some((t) => t.photoStatus === "uploading" || t.passportStatus === "uploading");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    if (!tripDate) {
      setStatus("error");
      setErrorMessage("Please choose a trip date.");
      return;
    }
    const leadFullName = `${lead.firstName.trim()} ${lead.lastName.trim()}`.trim();
    // The lead card is split into first/last name + country + DOB in the
    // form, so fold those back into traveler 1 for the payloads below.
    const allTravellers = travellers.map((traveller, i) =>
      i === 0
        ? { ...traveller, fullName: leadFullName, nationality: lead.country, dateOfBirth: lead.dateOfBirth }
        : traveller,
    );
    if (!lead.dateOfBirth) {
      setStatus("error");
      setErrorMessage("Please enter the lead traveler's date of birth.");
      return;
    }
    const pickupDetailsParts: string[] = [];
    pickupDetailsParts.push(`Trip type: ${lead.tripType}`, `Found us via: ${lead.source}`);
    if (lead.whatsapp.trim()) pickupDetailsParts.push(`WhatsApp: ${lead.whatsapp.trim()}`);
    if (addOnsList.length > 0) {
      pickupDetailsParts.push(`Add-ons: ${addOnsList.map((a) => `${a.label} x ${a.qty}`).join(", ")}`);
    }
    if (contact.specialRequests.trim()) {
      pickupDetailsParts.push(`Pickup/extra requirements: ${contact.specialRequests.trim()}`);
    }

    const { countryCode, mobileNumber } = splitContactNumber(contact.contactNumber);

    const payload: CreateBookingPayload = {
      packageId: trip.id,
      startDate: departureDate,
      endDate,
      numberOfTraveller: adults,
      fullName: leadFullName,
      email: contact.email.trim(),
      dateOfBirth: lead.dateOfBirth,
      nationality: lead.country,
      countryCode,
      mobileNumber: mobileNumber || undefined,
      pickupDetails: pickupDetailsParts.length > 0 ? pickupDetailsParts.join("\n") : undefined,
      paymentOptions: paymentOption,
      totalPrice: total,
      payablePercentage: paymentOption === "deposit" ? DEPOSIT_PERCENTAGE : 100,
      captchaToken: captchaToken ?? undefined,
    };

    let newBookingId: string | null = null;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        const apiMessage = isApiEnvelope(body) ? body.message : undefined;
        throw new Error(apiMessage || "Something went wrong. Please try again.");
      }

      const data = isApiEnvelope(body) ? (body.data as CreateBookingResult) : undefined;
      newBookingId = data?.id ?? null;
      setBookingNumber(data?.bookingNumber ?? null);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      // A Turnstile token is single-use — clear it and re-render the widget
      // so a retry after this failure can't silently resend a spent token.
      setCaptchaToken(null);
      captchaRef.current?.reset();
      return;
    }

    // The booking record itself only ever carries the lead's own identity
    // (see `payload` above) — every traveler's own passport/photo/gender,
    // lead included, only exists via this follow-up call. Best-effort: the
    // booking above already succeeded, so a failure here must not surface
    // as a booking failure, same reasoning as the payment-initiation step
    // below.
    if (newBookingId) {
      try {
        const travellerPayloads: AddTravellerPayload[] = allTravellers.map((traveller, i) => ({
          fullName: traveller.fullName.trim(),
          gender: traveller.gender || undefined,
          email: contact.email.trim(),
          nationality: traveller.nationality,
          countryCode,
          mobileNumber: mobileNumber || undefined,
          dateOfBirth: traveller.dateOfBirth || undefined,
          passportNo: traveller.passportNo.trim() || undefined,
          passportImage: traveller.passportImagePath ?? undefined,
          photo: traveller.photoPath ?? undefined,
          isLead: i === 0,
        }));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/${newBookingId}/travellers`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ travellers: travellerPayloads }),
        });
      } catch {
        // Ignored — see comment above.
      }
    }

    // The booking is committed at this point — any failure past here is a
    // payment-initiation problem, not a booking problem, and must not be
    // shown as one (see this component's own doc comment).
    setStatus("redirecting");

    try {
      const pacoPayload: InitiatePacoCheckoutPayload = {
        packageId: trip.id,
        bookingId: newBookingId ?? undefined,
        customerName: leadFullName,
        customerEmail: contact.email.trim(),
        amount: dueNow,
        percentage: paymentOption === "deposit" ? DEPOSIT_PERCENTAGE : 100,
        description: trip.title,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/paco/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(pacoPayload),
      });
      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
        throw new Error("payment initiation failed");
      }

      const data = isApiEnvelope(body) ? (body.data as InitiatePacoCheckoutResult) : undefined;
      if (!data?.paymentUrl) {
        throw new Error("payment initiation failed");
      }

      window.location.assign(data.paymentUrl);
    } catch {
      // Booking already succeeded — fall back to the "we'll help you pay"
      // screen rather than an error, since nothing about the booking
      // itself failed.
      setStatus("success");
    }
  }

  if (status === "redirecting") {
    return (
      <div className="mx-auto flex w-full max-w-160 flex-col items-center gap-4 px-6 py-24 text-center">
        <span
          aria-hidden="true"
          className="size-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        />
        <h1 className="font-poppins text-heading-2xl font-medium text-brand-neutral-1000">
          Taking you to secure payment…
        </h1>
        <p className="font-poppins text-body-l text-brand-neutral-700">
          Your booking for <strong>{trip.title}</strong>
          {bookingCode ? (
            <>
              {" "}
              (code <span className="font-medium text-brand-neutral-1000">{bookingCode}</span>)
            </>
          ) : null}{" "}
          is confirmed — redirecting you to our payment provider to complete payment. This should only take a
          moment.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mx-auto flex w-full max-w-160 flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success-200 text-success-900">
          <CheckIcon className="size-8" />
        </span>
        <h1 className="font-poppins text-heading-2xl font-medium text-brand-neutral-1000">Booking received</h1>
        <p className="font-poppins text-body-l text-brand-neutral-700">
          Thanks, {lead.firstName.trim() || "traveler"} — we&apos;ve received your booking for{" "}
          <strong>{trip.title}</strong>
          {bookingCode ? (
            <>
              {" "}
              (code <span className="font-medium text-brand-neutral-1000">{bookingCode}</span>)
            </>
          ) : null}
          . We couldn&apos;t start the payment step automatically — message us on WhatsApp or call {phone} and
          we&apos;ll help you complete payment for <strong>${dueNow.toLocaleString()}</strong>.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`https://wa.me/${phoneHref.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-pill bg-secondary-500 px-6 py-3 font-poppins text-body-m font-medium text-white"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp us
          </a>
          <Link
            href={tripHref(trip.slug)}
            className="rounded-pill border border-primary-200 px-6 py-3 font-poppins text-body-m font-medium text-brand-neutral-800"
          >
            Back to trip page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-320 px-6 pb-16 md:px-16">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 pt-5 font-poppins text-body-s text-brand-neutral-700"
      >
        <Link href="/" className="hover:text-brand-neutral-1000">
          Home
        </Link>
        <span aria-hidden="true">→</span>
        <Link href={tripHref(trip.slug)} className="hover:text-brand-neutral-1000">
          {trip.title}
        </Link>
        <span aria-hidden="true">→</span>
        <span className="text-brand-neutral-1000">Booking</span>
      </nav>

      <h1 className="mt-6 font-poppins text-heading-4xl font-semibold text-brand-neutral-1000">Booking</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[2fr_1fr]"
      >
        <div className="flex flex-col gap-8">
          <section className={cardClassName}>
            <h2 className={sectionHeadingClassName}>Date and Travelers</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <DatePicker
                  label="Trip Date *"
                  value={tripDate}
                  onChange={setTripDate}
                  placeholder="YYYY-MM-DD"
                  id={`${idPrefix}-trip-date`}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-brand-neutral-300 px-4 py-3">
                <span className="font-poppins text-body-m text-brand-neutral-900">Number of Travelers</span>
                <Stepper
                  value={adults}
                  min={1}
                  onChange={updateAdults}
                  decreaseLabel="Decrease travelers"
                  increaseLabel="Increase travelers"
                />
              </div>
            </div>
          </section>

          {trip.addOns.length > 0 ? (
            <section className={cardClassName}>
              <h2 className={sectionHeadingClassName}>Add-Ons and Extra Options</h2>
              <ul className="mt-6 border-t border-brand-neutral-300">
                {trip.addOns.map((addOn) => (
                  <li
                    key={addOn.label}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-brand-neutral-300 py-4 last:border-b-0"
                  >
                    <span className="font-poppins text-body-l font-medium text-brand-neutral-1000">{addOn.label}</span>
                    <span className="flex items-center gap-4">
                      <span className="font-poppins text-body-m text-brand-neutral-900">
                        <strong className="text-body-l font-semibold">+ US${addOn.price.toLocaleString()}</strong>{" "}
                        <span className="text-body-s font-medium text-brand-neutral-700">
                          {addOn.chargeBy === "ROOM" ? "per room" : addOn.chargeBy === "FLAT" ? "flat" : "per person"}
                        </span>
                      </span>
                      <Stepper
                        boxed
                        value={addOnQty[addOn.label] ?? 0}
                        min={0}
                        onChange={(next) => setAddOnQuantity(addOn.label, next)}
                        decreaseLabel={`Decrease ${addOn.label}`}
                        increaseLabel={`Increase ${addOn.label}`}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={cardClassName}>
            <h2 className={sectionHeadingClassName}>Lead Traveler Details</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                required
                autoComplete="given-name"
                placeholder="First Name *"
                aria-label="First name"
                value={lead.firstName}
                onChange={(event) => updateLead("firstName", event.target.value)}
                className={inputClassName}
              />
              <input
                type="text"
                required
                autoComplete="family-name"
                placeholder="Last Name *"
                aria-label="Last name"
                value={lead.lastName}
                onChange={(event) => updateLead("lastName", event.target.value)}
                className={inputClassName}
              />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email Address *"
                aria-label="Email address"
                value={contact.email}
                onChange={(event) => updateContact("email", event.target.value)}
                className={inputClassName}
              />
              <select
                required
                aria-label="Choose your country"
                value={lead.country}
                onChange={(event) => updateLead("country", event.target.value)}
                className={`${inputClassName} appearance-none`}
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
                type="tel"
                required
                autoComplete="tel"
                placeholder="Country Code + Phone Number *"
                aria-label="Country code and phone number"
                value={contact.contactNumber}
                onChange={(event) => updateContact("contactNumber", event.target.value)}
                className={inputClassName}
              />
              <input
                type="tel"
                placeholder="WhatsApp Number"
                aria-label="WhatsApp number"
                value={lead.whatsapp}
                onChange={(event) => updateLead("whatsapp", event.target.value)}
                className={inputClassName}
              />
              <DatePicker
                value={lead.dateOfBirth || null}
                onChange={(value) => updateLead("dateOfBirth", value)}
                minDate={null}
                placeholder="Date of Birth *"
                id={`${idPrefix}-lead-dob`}
              />
              <select
                required
                aria-label="Trip type"
                value={lead.tripType}
                onChange={(event) => updateLead("tripType", event.target.value)}
                className={`${inputClassName} appearance-none`}
              >
                <option value="" disabled>
                  Trip Type * — Choose One Option
                </option>
                {tripTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                required
                aria-label="Where did you find us"
                value={lead.source}
                onChange={(event) => updateLead("source", event.target.value)}
                className={`${inputClassName} appearance-none md:col-span-2`}
              >
                <option value="" disabled>
                  Where Did You Find Us? * — Choose One Option
                </option>
                {sourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {travellers.slice(1).map((traveller, offset) => {
              const index = offset + 1;
              return (
                <div key={index} className="mt-6 rounded-md border border-brand-neutral-300 p-4">
                  <p className="mb-3 font-poppins text-body-m font-semibold text-brand-neutral-900">
                    Traveler {index + 1}
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      placeholder="Full Name *"
                      aria-label={`Traveler ${index + 1} full name`}
                      value={traveller.fullName}
                      onChange={(event) => updateTraveller(index, "fullName", event.target.value)}
                      className={inputClassName}
                    />
                    <input
                      type="text"
                      placeholder="Passport No"
                      aria-label={`Traveler ${index + 1} passport number`}
                      value={traveller.passportNo}
                      onChange={(event) => updateTraveller(index, "passportNo", event.target.value)}
                      className={inputClassName}
                    />
                    <select
                      required
                      aria-label={`Traveler ${index + 1} country`}
                      value={traveller.nationality}
                      onChange={(event) => updateTraveller(index, "nationality", event.target.value)}
                      className={`${inputClassName} appearance-none`}
                    >
                      <option value="" disabled>
                        Country *
                      </option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={`Traveler ${index + 1} gender`}
                      value={traveller.gender}
                      onChange={(event) => updateTraveller(index, "gender", event.target.value)}
                      className={`${inputClassName} appearance-none`}
                    >
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <DatePicker
                      value={traveller.dateOfBirth || null}
                      onChange={(value) => updateTraveller(index, "dateOfBirth", value)}
                      minDate={null}
                      placeholder="Date of Birth"
                      id={`${idPrefix}-traveller-${index}-dob`}
                    />
                  </div>
                </div>
              );
            })}

            <textarea
              rows={6}
              placeholder="Pickup Details and Extra Requirements (If Any)"
              aria-label="Pickup details and extra requirements"
              value={contact.specialRequests}
              onChange={(event) => updateContact("specialRequests", event.target.value)}
              className={`${inputClassName} mt-4 resize-y`}
            />

            <div className="mt-4">
              <FileUploadField
                id={`${idPrefix}-lead-passport`}
                placeholder="Attach Your Passport (optional)"
                ariaLabel="Lead traveler — attach your passport"
                fileName={travellers[0]?.passportFileName ?? null}
                onChange={handleFileChange(0, "passport")}
              />
              {travellers[0]?.passportStatus === "uploading" ? (
                <p className="mt-1.5 font-poppins text-body-s text-brand-neutral-700">Uploading…</p>
              ) : null}
              {travellers[0]?.passportStatus === "uploaded" ? (
                <p className="mt-1.5 flex items-center gap-1.5 font-poppins text-body-s text-success-900">
                  <CheckIcon className="size-3.5" />
                  Passport uploaded.
                </p>
              ) : null}
              {travellers[0]?.passportStatus === "error" ? (
                <p className="mt-1.5 font-poppins text-body-s text-error-700">Upload failed — please try again.</p>
              ) : null}
            </div>

            <fieldset className="mt-6">
              <legend className="font-poppins text-body-l font-medium text-brand-neutral-1000">
                How would you like to pay?
              </legend>
              <div role="radiogroup" aria-label="Payment option" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentOption === "deposit"}
                  onClick={() => setPaymentOption("deposit")}
                  className={`rounded-md border px-4 py-3 text-left font-poppins transition-colors ${
                    paymentOption === "deposit" ? "border-primary-500 bg-primary-100" : "border-brand-neutral-300 bg-white"
                  }`}
                >
                  <span className="block text-body-m font-medium text-brand-neutral-1000">
                    Reserve with {DEPOSIT_PERCENTAGE}% advance
                  </span>
                  <span className="block text-heading-xl font-medium text-brand-neutral-1000">
                    ${deposit.toLocaleString()}{" "}
                    <span className="text-body-s font-medium text-brand-neutral-700">now</span>
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={paymentOption === "full"}
                  onClick={() => setPaymentOption("full")}
                  className={`rounded-md border px-4 py-3 text-left font-poppins transition-colors ${
                    paymentOption === "full" ? "border-primary-500 bg-primary-100" : "border-brand-neutral-300 bg-white"
                  }`}
                >
                  <span className="block text-body-m font-medium text-brand-neutral-1000">Pay in full</span>
                  <span className="block text-heading-xl font-medium text-brand-neutral-1000">
                    ${total.toLocaleString()}{" "}
                    <span className="text-body-s font-medium text-brand-neutral-700">now</span>
                  </span>
                </button>
              </div>
            </fieldset>

            <label className="mt-6 flex cursor-pointer items-center gap-3 font-poppins text-body-m text-brand-neutral-900">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="size-5 accent-primary-500"
              />
              <span>
                I accept{" "}
                <Link
                  href="/company/terms-and-conditions"
                  target="_blank"
                  className="text-primary-500 hover:underline"
                >
                  terms and conditions
                </Link>
              </span>
            </label>

            <div className="mt-4">
              <Captcha ref={captchaRef} onVerify={setCaptchaToken} />
            </div>

            <button
              type="submit"
              disabled={status === "submitting" || anyUploadInProgress || (captchaRequired && !captchaToken)}
              className="mt-4 rounded-md bg-primary-500 px-8 py-3.5 font-poppins text-body-l font-semibold tracking-wide text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "submitting" ? "Submitting…" : "Submit"}
            </button>
            {status === "error" ? (
              <p className="mt-2 font-poppins text-body-s font-medium text-error-700">{errorMessage}</p>
            ) : null}
          </section>
        </div>

        <aside style={{ top: stickyTop }} className="h-fit overflow-hidden rounded-md bg-white shadow-card-strong lg:sticky">
          <h2 className="bg-[#064a70] px-5 py-4 font-poppins text-heading-xl font-semibold text-white">
            Your Trip Details
          </h2>
          <div className="p-5">
            <div className="flex gap-4">
              {trip.heroImages[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trip.heroImages[0]} alt="" className="size-25 shrink-0 rounded-sm object-cover" />
              ) : null}
              <div>
                <p className="font-poppins text-heading-xl font-semibold text-brand-neutral-1000">{trip.title}</p>
                <p className="mt-2 font-poppins text-body-m text-brand-neutral-800">Duration: {durationDays} Days</p>
              </div>
            </div>

            {trip.costTiers.length > 0 ? (
              <div className="mt-4 rounded-md bg-[#eef1f6]">
                <button
                  type="button"
                  onClick={() => setTiersOpen((open) => !open)}
                  aria-expanded={tiersOpen}
                  className="flex w-full items-center justify-between px-5 py-4 font-poppins text-body-l font-medium text-brand-neutral-900"
                >
                  Group Discount Price
                  <span aria-hidden="true" className="text-2xl leading-none">
                    {tiersOpen ? "−" : "+"}
                  </span>
                </button>
                {tiersOpen ? (
                  <ul className="border-t border-brand-neutral-300 px-5 pb-3">
                    {trip.costTiers.map((tier) => (
                      <li
                        key={tier.groupSize}
                        className="flex justify-between py-2 font-poppins text-body-m text-brand-neutral-900"
                      >
                        <span>{tier.groupSize}</span>
                        <span>US${tier.pricePerPerson.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <dl className="mt-6 flex flex-col gap-3 font-poppins text-body-m text-brand-neutral-900">
              <div className="flex justify-between gap-4">
                <dt>Trip Date:</dt>
                <dd>{tripDate ? start.date : ""}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Number of Traveler:</dt>
                <dd>{adults} traveler(s)</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-col gap-3 border-t border-brand-neutral-300 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-poppins text-body-l text-brand-neutral-900">Package Price</p>
                  <p className="font-poppins text-body-s text-brand-neutral-700">
                    US${pricePerPax.toLocaleString()} x {adults} traveler(s)
                  </p>
                </div>
                <span className="font-poppins text-heading-xl font-semibold text-brand-neutral-1000">
                  US${(pricePerPax * adults).toLocaleString()}
                </span>
              </div>
              {addOnsList.map((addOn) => (
                <div key={addOn.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-poppins text-body-m text-brand-neutral-900">{addOn.label}</p>
                    <p className="font-poppins text-body-s text-brand-neutral-700">
                      US${addOn.price.toLocaleString()} x {addOn.qty}
                    </p>
                  </div>
                  <span className="font-poppins text-body-l font-semibold text-brand-neutral-1000">
                    US${addOn.lineTotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-brand-neutral-300 pt-4">
              <span className="font-poppins text-body-l text-brand-neutral-900">Total Price</span>
              <span className="font-poppins text-heading-xl font-semibold text-brand-neutral-1000">
                US${total.toLocaleString()}
              </span>
            </div>
            {paymentOption === "deposit" ? (
              <p className="mt-1 font-poppins text-body-s text-brand-neutral-700">
                US${deposit.toLocaleString()} due now, US${(total - deposit).toLocaleString()} due before departure.
              </p>
            ) : null}
          </div>
        </aside>
      </form>
    </div>
  );
}

function Stepper({
  value,
  min,
  onChange,
  decreaseLabel,
  increaseLabel,
  boxed = false,
}: {
  value: number;
  min: number;
  onChange: (next: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  boxed?: boolean;
}) {
  const buttonClassName = boxed
    ? "flex size-9 items-center justify-center text-xl text-brand-neutral-900 disabled:opacity-40"
    : "flex size-9 items-center justify-center rounded-sm bg-primary-100 text-xl text-brand-neutral-900 disabled:opacity-40";
  return (
    <span
      className={`flex items-center font-poppins ${boxed ? "w-40 justify-between rounded-md border border-brand-neutral-300 px-3 py-2" : "gap-3"}`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={decreaseLabel}
        className={buttonClassName}
      >
        −
      </button>
      <span className="min-w-6 text-center text-body-l text-brand-neutral-1000">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label={increaseLabel} className={buttonClassName}>
        +
      </button>
    </span>
  );
}

/**
 * A native `<input type="file">` always renders its own "No file chosen"
 * text next to the button — that's browser chrome, not real DOM text, so
 * no amount of CSS (including the `file:` pseudo-element utilities the
 * rest of this form's inputs use) can restyle or replace it. To show
 * a real placeholder there instead (2026-09-22, direct
 * request), the real input is visually hidden (`sr-only`, not `hidden` —
 * still focusable/keyboard-operable) behind a styled `<label>` that owns
 * that text itself, swapping to the picked file's name once one's chosen.
 */
function FileUploadField({
  id,
  placeholder,
  ariaLabel,
  fileName,
  onChange,
}: {
  id: string;
  placeholder: string;
  ariaLabel: string;
  fileName: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`${inputClassName} flex cursor-pointer items-center gap-3 !py-2`}
    >
      <span className="shrink-0 rounded-lg bg-primary-100 px-4 py-2 font-poppins text-body-s font-medium text-brand-neutral-900">
        Choose File
      </span>
      <span className="truncate text-body-s text-brand-neutral-700">{fileName ?? placeholder}</span>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={ariaLabel}
        onChange={onChange}
        className="sr-only"
      />
    </label>
  );
}
