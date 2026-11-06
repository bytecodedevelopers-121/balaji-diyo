"use client";

import { useEffect, useRef } from "react";
import { ContactForm } from "@/components/sections/ContactSection/ContactForm";
import type { PackageDetail } from "../data";
import { CrossIcon } from "./icons";

interface TripEnquiryModalProps {
  trip: PackageDetail;
  onClose: () => void;
}

/**
 * "Trip Enquiry" pop-up — the sticky BookingSidebar's own enquiry button
 * used to just `<Link href="/contact">`, sending someone already looking
 * at a specific trip off to the generic contact page and losing that
 * context. This opens the same reusable `ContactForm` (already built for
 * exactly this kind of per-trip reuse — see its own doc comment on the
 * trekking-route and blog "Ask Question" call sites) in a modal instead,
 * so the enquiry stays on the trip page. Built on the native <dialog>
 * element, same foundation as BookingConfirmModal/Lightbox.
 *
 * `redirectOnSuccess` (2026-09-02, client-requested): a successful
 * submission navigates to `/thank-you` instead of showing ContactForm's
 * usual inline success message — that message would render inside this
 * still-open modal, easy to miss/dismiss by accident, and gives no next
 * step. The dedicated page also gets an "Explore More Trips" section
 * ContactForm's own success state has no room for.
 *
 * Clicking outside the form does NOT close it (direct request: a stray click
 * lost whatever the visitor had typed); only the X button, Escape or a
 * successful submit close it.
 */
export function TripEnquiryModal({ trip, onClose }: TripEnquiryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Enquire about ${trip.title}`}
      className="m-auto max-h-[90vh] w-[min(720px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border-0 bg-transparent p-0 outline-none backdrop:bg-brand-neutral-1000/60"
    >
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-white text-brand-neutral-700 shadow-card-soft transition-colors hover:bg-brand-neutral-200"
        >
          <CrossIcon className="size-5" />
        </button>
        <ContactForm
          heading={`Enquire about ${trip.title}`}
          type="trip-enquiry"
          maxWidthClassName="max-w-full"
          redirectOnSuccess={`/thank-you?trip=${encodeURIComponent(trip.title)}`}
        />
      </div>
    </dialog>
  );
}
