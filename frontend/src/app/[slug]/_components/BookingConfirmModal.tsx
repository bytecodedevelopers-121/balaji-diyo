"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/DatePicker";
import type { PackageDetail } from "../data";
import type { BookingSelection } from "./booking-flow-context";
import { computeEndDate, formatDayLabel, pricePerPersonForAdults, tripDurationDays } from "./booking-helpers";
import { CheckIcon, CrossIcon } from "./icons";

interface BookingConfirmModalProps {
  trip: PackageDetail;
  selection: BookingSelection;
  onChangeSelection: (next: BookingSelection) => void;
  onClose: () => void;
}

/**
 * "Booking Confirm" — Figma node 845:28090: a review-and-confirm modal
 * layered over the itinerary page (departure date, traveler count,
 * cancellation/deposit terms, add-ons, running total) that hands off to
 * the full /book-now checkout for traveler details and payment.
 *
 * Built on the native <dialog> element, the same foundation as
 * ImageGallery's Lightbox — `showModal()` gives a free focus trap,
 * Escape-to-close, and real top-layer stacking, so this only adds what
 * <dialog> doesn't cover: the booking fields themselves and the
 * backdrop-click handler.
 *
 * Figma shows this content as two static informational lines ("Free
 * cancellation" / "Reserve with $X deposit — pay the rest later") —
 * kept as one static "Free cancellation" badge, full stop. An earlier
 * version of this modal also added a real add-ons checklist and a
 * deposit-vs-full payment toggle, but both duplicated the *same* real
 * pickers `CheckoutView.tsx` already has on the actual "/book-now" page
 * (2026-09-03, direct request: "two duplication[s]... add [this] only
 * in last phase of booking") — a traveler picking add-ons or a payment
 * option here just had to reconsider/re-pick them again one click
 * later. This step now only ever asks what's needed to move on: which
 * date, how many adults — add-ons and payment method are decided once,
 * at checkout.
 */
export function BookingConfirmModal({ trip, selection, onChangeSelection, onClose }: BookingConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  // See Lightbox.tsx's own comment on why there's deliberately no
  // cleanup here: `dialog.close()` fires a synchronous "close" event
  // that this component treats as a real close, so calling it from an
  // effect cleanup would fight React Strict Mode's mount/cleanup/mount.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  const durationDays = tripDurationDays(trip);
  const endDate = computeEndDate(selection.departureDate, durationDays);
  const start = formatDayLabel(selection.departureDate);
  const end = formatDayLabel(endDate);

  // No add-ons math here any more (see this component's own doc
  // comment) — `selection.addOnLabels` stays whatever `openBooking`
  // defaulted it to (empty) since nothing in this modal mutates it,
  // that choice happens once, at checkout.
  const pricePerPax = pricePerPersonForAdults(trip, selection.adults);
  const total = pricePerPax * selection.adults;

  function setAdults(adults: number) {
    onChangeSelection({ ...selection, adults: Math.max(1, adults) });
  }

  function handleBookNow() {
    const params = new URLSearchParams({
      date: selection.departureDate,
      adults: String(selection.adults),
    });
    router.push(`/book-now/${trip.slug}?${params.toString()}`);
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-label={`Confirm booking for ${trip.title}`}
      className="m-auto max-h-[90vh] w-[min(560px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border-0 bg-white p-0 outline-none backdrop:bg-brand-neutral-1000/60"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#f4dd9a] p-6">
        <div>
          <h2 className="font-poppins text-heading-2xl font-medium text-brand-neutral-1000">{trip.title}</h2>
          <p className="mt-1 font-poppins text-body-m font-medium text-brand-neutral-700">{durationDays} days</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand-neutral-700 transition-colors hover:bg-brand-neutral-200"
        >
          <CrossIcon className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <DatePicker
          label="Departure Date"
          value={selection.departureDate}
          onChange={(next) => onChangeSelection({ ...selection, departureDate: next })}
        />

        <div className="flex items-center justify-between rounded-xl bg-primary-100 px-4 py-3">
          <div className="text-center">
            <p className="font-poppins text-body-s font-medium text-brand-neutral-700">{start.weekday}</p>
            <p className="font-poppins text-body-l font-medium text-brand-neutral-1000">{start.date}</p>
          </div>
          <span
            aria-hidden="true"
            className="font-poppins text-2xl font-semibold text-logo-navy"
          >
            →
          </span>
          <div className="text-center">
            <p className="font-poppins text-body-s font-medium text-brand-neutral-700">{end.weekday}</p>
            <p className="font-poppins text-body-l font-medium text-brand-neutral-1000">{end.date}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#f4dd9a] pb-4">
          <span className="font-poppins text-body-m font-medium text-brand-neutral-800">Number of Persons</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAdults(selection.adults - 1)}
              disabled={selection.adults <= 1}
              aria-label="Decrease travelers"
              className="flex size-9 items-center justify-center rounded-full bg-primary-100 font-poppins text-body-l text-brand-neutral-700 disabled:opacity-40"
            >
              −
            </button>
            <span className="flex size-9 items-center justify-center rounded-full border border-[#ebebeb] font-poppins text-body-l font-medium text-brand-neutral-700">
              {selection.adults}
            </span>
            <button
              type="button"
              onClick={() => setAdults(selection.adults + 1)}
              aria-label="Increase travelers"
              className="flex size-9 items-center justify-center rounded-full bg-primary-100 font-poppins text-body-l text-brand-neutral-700"
            >
              +
            </button>
          </div>
        </div>

        {/*
          Add-ons and the deposit-vs-full payment choice used to both
          live here too — removed 2026-09-03 (see this component's own
          doc comment): both are real, functional pickers on the actual
          checkout page (`CheckoutView.tsx`), so asking again here was
          pure duplication, not a second independent decision. This step
          now closes with just a plain price recap for the date/headcount
          actually chosen above.
        */}
        <p className="flex items-center gap-2 rounded-xl bg-primary-100 p-4 font-poppins text-body-m font-medium text-success-900">
          <CheckIcon className="size-4 shrink-0" />
          Free cancellation
        </p>

        <div className="flex flex-col gap-1 border-t border-[#f4dd9a] pt-4">
          <div className="flex items-center justify-between">
            <span className="font-poppins text-body-m font-medium text-brand-neutral-700">
              Persons × {selection.adults}
            </span>
            <span className="font-poppins text-body-l font-medium text-brand-neutral-1000">
              ${total.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-poppins text-body-l font-medium text-brand-neutral-700">Total</span>
            <span className="font-poppins text-2xl font-medium text-primary-500">${total.toLocaleString()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBookNow}
          className="mt-1 flex items-center justify-center rounded-pill bg-logo-sun px-6 py-3.5 font-poppins text-body-m font-medium text-logo-navy-dark transition-opacity hover:opacity-90"
        >
          Book Now
        </button>
      </div>
    </dialog>
  );
}
