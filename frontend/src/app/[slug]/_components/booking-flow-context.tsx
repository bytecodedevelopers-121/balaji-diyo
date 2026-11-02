"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { PackageDetail } from "../data";
import { BookingConfirmModal } from "./BookingConfirmModal";
import { TripEnquiryModal } from "./TripEnquiryModal";
import type { PaymentOption } from "./booking-helpers";

export interface BookingSelection {
  departureDate: string;
  adults: number;
  addOnLabels: string[];
  paymentOption: PaymentOption;
}

interface BookingFlowContextValue {
  /** Opens the "Booking Confirm" modal (Figma node 845:28090), prefilled from whichever trigger called it — the sticky sidebar's own date/pax, or a specific departure row. */
  openBooking: (partial?: Partial<Omit<BookingSelection, "paymentOption">>) => void;
  /** Opens the "Trip Enquiry" pop-up form (BookingSidebar's own enquiry CTA). */
  openEnquiry: () => void;
}

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

export function useBookingFlow(): BookingFlowContextValue {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) {
    throw new Error("useBookingFlow must be used within a BookingFlowProvider");
  }
  return ctx;
}

/**
 * Owns the "Booking Confirm" modal's open/closed state and the
 * selection it was opened with, so any trigger anywhere on the package
 * detail page (BookingSidebar's "Book Now", each DeparturesSection row's
 * "Book Now — $price") can open the same modal instance. Wraps the page
 * content rather than living inside either trigger, since both are
 * siblings deep in the tree and neither should own the other's state.
 */
export function BookingFlowProvider({ trip, children }: { trip: PackageDetail; children: ReactNode }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const openBooking = useCallback<BookingFlowContextValue["openBooking"]>(
    (partial) => {
      setSelection({
        departureDate: partial?.departureDate ?? trip.departures[0]?.startDate ?? new Date().toISOString().slice(0, 10),
        adults: partial?.adults ?? 1,
        addOnLabels: partial?.addOnLabels ?? [],
        paymentOption: "full",
      });
    },
    [trip],
  );

  const closeBooking = useCallback(() => setSelection(null), []);
  const openEnquiry = useCallback(() => setIsEnquiryOpen(true), []);
  const closeEnquiry = useCallback(() => setIsEnquiryOpen(false), []);

  const contextValue = useMemo(() => ({ openBooking, openEnquiry }), [openBooking, openEnquiry]);

  return (
    <BookingFlowContext.Provider value={contextValue}>
      {children}
      {selection ? (
        <BookingConfirmModal
          trip={trip}
          selection={selection}
          onChangeSelection={setSelection}
          onClose={closeBooking}
        />
      ) : null}
      {isEnquiryOpen ? (
        <TripEnquiryModal
          trip={trip}
          onClose={closeEnquiry}
        />
      ) : null}
    </BookingFlowContext.Provider>
  );
}
