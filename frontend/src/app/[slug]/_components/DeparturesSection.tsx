"use client";

import { useMemo, useState } from "react";
import type { Departure, PackageDetail } from "../data";
import { useBookingFlow } from "./booking-flow-context";

/** Green "Available" pill, red "Sold Out" one — see `Departure["status"]`'s own doc comment in `../data.ts`. */
const SEAT_CLASSES: Record<Departure["status"], string> = {
  Available: "bg-success-200 text-success-900",
  "Sold Out": "bg-error-200 text-error-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function yearOf(iso: string): string {
  return String(new Date(iso).getFullYear());
}

function monthOf(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short" });
}

/** Calendar date at Boundless Adventure's Nepal office. Using an explicit
 * timezone keeps the cutoff consistent for visitors and the server render. */
function todayInNepal(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/**
 * "Group Departure" — a real year → month filter over `trip.departures`
 * (not the decorative, always-2026 pills this used to be), narrowing
 * down to a 3-column date/seats/book-now table — restored per a later,
 * exact design reference (2026-08-26) after a brief detour: an earlier
 * pass here (see git history) dropped the seats badge and the separate
 * Book Now button in favor of making the whole date row clickable,
 * reasoning that a 3-column grid's button cell broke on mobile — that
 * traded away real information (seat availability) the actual design
 * wants shown, badge and all, including a genuinely new "Sold Out"
 * state (previously-`closed` departures used to be dropped from this
 * list entirely — see `map-package-detail.ts`'s `buildDepartures` — now
 * shown with a disabled Book Now instead). Mobile fits fine at this
 * design's own 2-column-ish proportions (badge + pill button both
 * narrow, unlike the old free-text "Book Now — $price" label).
 */
export function DeparturesSection({ trip }: { trip: PackageDetail }) {
  const { openBooking } = useBookingFlow();
  const today = useMemo(() => todayInNepal(), []);

  // Remove expired departure dates before deriving the year and month tabs.
  // This also removes a past month/year once it no longer contains any
  // bookable current-or-future departure.
  const upcomingDepartures = useMemo(
    () => trip.departures.filter((departure) => departure.startDate.slice(0, 10) >= today),
    [trip.departures, today],
  );

  const years = useMemo(() => {
    const unique = Array.from(new Set(upcomingDepartures.map((d) => yearOf(d.startDate))));
    return unique.sort();
  }, [upcomingDepartures]);

  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [selectedMonth, setSelectedMonth] = useState<string | "all">("all");

  const departuresInYear = useMemo(
    () => upcomingDepartures.filter((d) => yearOf(d.startDate) === selectedYear),
    [upcomingDepartures, selectedYear],
  );

  // Calendar-order months actually present in the selected year, not
  // alphabetical — `Array.from(new Set(...))` keeps first-seen order,
  // and `departuresInYear` is already date-sorted upstream (see
  // `map-package-detail`'s departures mapping).
  const months = useMemo(
    () => Array.from(new Set(departuresInYear.map((d) => monthOf(d.startDate)))),
    [departuresInYear],
  );

  const visibleDepartures = useMemo(
    () => (selectedMonth === "all" ? departuresInYear : departuresInYear.filter((d) => monthOf(d.startDate) === selectedMonth)),
    [departuresInYear, selectedMonth],
  );

  if (upcomingDepartures.length === 0 || !selectedYear) return null;

  function selectYear(year: string) {
    setSelectedYear(year);
    setSelectedMonth("all");
  }

  return (
    <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
      <h2 className="text-center font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">Group Departure</h2>

      <div className="mt-4 flex justify-center gap-3">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => selectYear(year)}
            className={`rounded-pill px-5 py-2 font-poppins text-body-m font-medium ${
              year === selectedYear ? "bg-secondary-500 text-white" : "border border-brand-neutral-400 text-brand-neutral-700"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center font-poppins text-body-l font-medium text-brand-neutral-900">
        Available months in {selectedYear}
      </p>

      {/* Left-aligned + scrollable, not centered — the year row above
          fits comfortably so centering it reads fine, but this row is
          meant to overflow off the right edge and scroll (matches the
          screenshot, and the same pattern TabNav/FaqCategoriesSection
          already use elsewhere on this page). */}
      <div className="mt-3 flex gap-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedMonth("all")}
          className={`shrink-0 rounded-pill px-5 py-2 font-poppins text-body-m font-medium whitespace-nowrap ${
            selectedMonth === "all" ? "bg-secondary-500 text-white" : "border border-brand-neutral-400 text-brand-neutral-700"
          }`}
        >
          All date
        </button>
        {months.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => setSelectedMonth(month)}
            className={`shrink-0 rounded-pill px-5 py-2 font-poppins text-body-m font-medium whitespace-nowrap ${
              selectedMonth === month ? "bg-secondary-500 text-white" : "border border-brand-neutral-400 text-brand-neutral-700"
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#fbc99d]">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 bg-[#fbc99d] px-5 py-4 font-poppins text-body-l font-medium text-brand-neutral-1000">
          <span>Departure Date</span>
          <span>Seats</span>
          <span />
        </div>
        {visibleDepartures.map((departure) => {
          const soldOut = departure.status === "Sold Out";
          return (
            <div
              key={departure.startDate}
              className="grid grid-cols-[2fr_1fr_1fr] items-center gap-3 border-t border-[#fbc99d] px-5 py-4"
            >
              <span className="font-poppins text-body-l font-medium text-brand-neutral-900">
                {formatDate(departure.startDate)} – {formatDate(departure.endDate)}
              </span>
              <span
                className={`w-fit rounded-pill px-4 py-1.5 font-poppins text-body-s font-medium ${SEAT_CLASSES[departure.status]}`}
              >
                {departure.status}
              </span>
              <button
                type="button"
                disabled={soldOut}
                onClick={() => openBooking({ departureDate: departure.startDate, adults: 1, addOnLabels: [] })}
                className={`w-fit rounded-pill px-4 py-1.5 font-poppins text-body-s font-medium ${
                  soldOut
                    ? "cursor-not-allowed bg-brand-neutral-200 text-brand-neutral-500"
                    : "bg-secondary-500 text-white"
                }`}
              >
                Book now
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 font-poppins text-body-s font-medium text-brand-neutral-700">
        Date that suits you better? We also arrange private departures on request.
      </p>
    </section>
  );
}
