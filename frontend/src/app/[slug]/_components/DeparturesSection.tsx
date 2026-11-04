"use client";

import { useMemo, useState } from "react";
import type { PackageDetail } from "../data";
import { useBookingFlow } from "./booking-flow-context";
import { EmptyNote } from "./SectionRow";

// Departure dates are calendar dates stored as UTC midnight — format them in
// UTC so they never shift a day for visitors west of Greenwich.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function weekday(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

/** "Nov 2026" — the key and label for one month chip. */
function monthKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** Calendar date at the Nepal office. Using an explicit timezone keeps the
 * cutoff consistent for visitors and the server render. */
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

/** Star-on-bookmark bullets for the info card (same icon as the Overview lists). */
const STAR_ITEM =
  "relative pl-9 before:absolute before:top-0.5 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-['']";

/**
 * "<Trip> Departures" — an info card, a row of month chips ("Nov 2026", ...)
 * for the upcoming departures, and a table of the departures in the chosen
 * month with a Book Now button each. Past departures are dropped, and so are
 * month chips that no longer have any bookable date; "Sold Out" departures
 * stay listed with a disabled button.
 */
export function DeparturesSection({ trip }: { trip: PackageDetail }) {
  const { openBooking } = useBookingFlow();
  const today = useMemo(() => todayInNepal(), []);

  const upcomingDepartures = useMemo(
    () => trip.departures.filter((departure) => departure.startDate.slice(0, 10) >= today),
    [trip.departures, today],
  );

  // Calendar-order months actually present — `upcomingDepartures` is already
  // date-sorted upstream (see `map-package-detail`'s departures mapping).
  const months = useMemo(
    () => Array.from(new Set(upcomingDepartures.map((departure) => monthKey(departure.startDate)))),
    [upcomingDepartures],
  );

  const [chosenMonth, setChosenMonth] = useState<string | null>(null);
  const selectedMonth = chosenMonth && months.includes(chosenMonth) ? chosenMonth : months[0];

  const visibleDepartures = useMemo(
    () => upcomingDepartures.filter((departure) => monthKey(departure.startDate) === selectedMonth),
    [upcomingDepartures, selectedMonth],
  );

  if (upcomingDepartures.length === 0) {
    return <EmptyNote>No upcoming group departures are listed yet. Send an inquiry and we can arrange a private departure for your dates.</EmptyNote>;
  }

  return (
    <section>
      <h3 className="text-[32px] leading-tight font-bold text-brand-neutral-900">{trip.title} Departures</h3>

      <ul className="mt-6 flex flex-col gap-3 rounded-md bg-[#fdf3d6] p-6 text-[15px] leading-relaxed text-brand-neutral-800 sm:p-7">
        <li className={STAR_ITEM}>
          <strong className="text-brand-neutral-900">Group Trek:</strong> We have set the dates for the {trip.title}. Please
          select your preferred date and book.
        </li>
        <li className={STAR_ITEM}>
          <strong className="text-brand-neutral-900">Arrival in Nepal:</strong> The trip date is your arrival date in
          Kathmandu.
        </li>
        <li className={STAR_ITEM}>
          <strong className="text-brand-neutral-900">Private Trek:</strong> If you want to trek privately, check availability
          or inquire with us. A private trek is available on your chosen date and is ideal if you want to walk at your own
          pace; it is suitable for solo travelers, couples, friends and family.
        </li>
      </ul>

      <p className="mt-7 text-[15px] font-semibold text-brand-neutral-900">Select your preferred date</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {months.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => setChosenMonth(month)}
            className={`rounded-sm px-5 py-2.5 text-[15px] font-semibold whitespace-nowrap ${
              month === selectedMonth ? "bg-[#064a70] text-white" : "bg-[#e1eef6] text-brand-neutral-800 hover:bg-[#cfe3ef]"
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <div>
          <div className="hidden grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 rounded-sm bg-[#c9dcec] px-5 py-4 text-[14px] font-semibold tracking-wide text-brand-neutral-800 uppercase sm:grid">
            <span>Departure Date</span>
            <span>Status</span>
            <span>Price</span>
            <span className="w-24" />
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {visibleDepartures.map((departure) => {
              const soldOut = departure.status === "Sold Out";
              return (
                <div
                  key={departure.startDate}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-sm bg-[#eaf3f9] px-4 py-3.5 sm:grid sm:grid-cols-[2fr_1fr_1fr_auto] sm:gap-3 sm:px-5"
                >
                  <span className="basis-full text-[15px] text-brand-neutral-800 sm:basis-auto">
                    {weekday(departure.startDate)} - {weekday(departure.endDate)}
                    <span className="block font-bold text-brand-neutral-900">
                      {formatDate(departure.startDate)} - {formatDate(departure.endDate)}
                    </span>
                  </span>
                  <span className="self-start text-[13px] text-brand-neutral-800">{departure.status}</span>
                  <span className="text-[18px] text-brand-neutral-900">
                    {departure.price > 0 ? `US$${departure.price.toLocaleString()}` : "Contact us"}
                  </span>
                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={() => openBooking({ departureDate: departure.startDate, adults: 1, addOnLabels: [] })}
                    className={`w-24 rounded-pill px-4 py-2 text-[13px] font-semibold ${
                      soldOut ? "cursor-not-allowed bg-brand-neutral-200 text-brand-neutral-500" : "bg-logo-sun text-logo-navy-dark"
                    }`}
                  >
                    Book Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[14px] text-brand-neutral-700">
        Date that suits you better? We also arrange private departures on request.
      </p>
    </section>
  );
}
