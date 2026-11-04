import Link from "next/link";
import { ArrowRight, Info, Mountain } from "lucide-react";
import { getUpcomingDepartures } from "@/features/departures/api/get-upcoming-departures";
import type { Departure } from "@/features/departures/types/departure.types";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";

/**
 * "Join Upcoming Trips" — a departures table right after the Best Sellers
 * grid: trip, date range, status, price, and a "Join This Date" button
 * that opens the Last Minute Booking page. Real rows come from `GET /departures`;
 * `oldPrice` / `spaces` aren't in that API yet, so they only show on the
 * sample rows used when the database has no departures.
 */
interface Row {
  id: string;
  title: string;
  start: Date;
  end: Date;
  days: number;
  status: string;
  spaces?: string;
  price: number;
  oldPrice?: number;
}

const MAX_ROWS = 4;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function sample(id: string, title: string, start: string, days: number, spaces: string, price: number, oldPrice: number): Row {
  const startDate = new Date(`${start}T00:00:00Z`);
  return { id, title, start: startDate, end: addDays(startDate, days - 1), days, status: "Guaranteed", spaces, price, oldPrice };
}

const SAMPLE_ROWS: Row[] = [
  sample("s1", "Ghorepani Poon Hill Trek", "2026-11-05", 4, "7 Space", 600, 850),
  sample("s2", "Best of Nepal Adventure", "2026-11-05", 12, "8 Space Available", 750, 1000),
  sample("s3", "Everest Base Camp Trek", "2026-11-05", 14, "7 Space Left", 1300, 1500),
  sample("s4", "Annapurna Base Camp Trek", "2026-11-06", 14, "7 Space Available", 850, 1100),
];

function toRow(departure: Departure): Row {
  const start = new Date(departure.departureDate);
  const days = Number.parseInt(departure.package.duration, 10) || 1;
  const price = Number.parseFloat(departure.departureCost);
  return {
    id: departure.id,
    title: departure.package.title,
    start,
    end: addDays(start, days - 1),
    days,
    status: departure.departureStatus.charAt(0).toUpperCase() + departure.departureStatus.slice(1),
    price: Number.isFinite(price) ? price : 0,
  };
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });

function joinHref(row: Row): string {
  const params = new URLSearchParams({
    title: row.title,
    date: row.start.toISOString().slice(0, 10),
    days: String(row.days),
    price: String(row.price),
  });
  return `/last-minute-booking?${params.toString()}`;
}

export async function UpcomingTripsSection() {
  const departures = await getUpcomingDepartures().catch(() => []);
  const rows: Row[] =
    departures.length > 0
      ? departures.slice(0, MAX_ROWS).map(toRow)
      : SHOW_SAMPLE_DATA
        ? SAMPLE_ROWS
        : [];
  if (rows.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-site-bg px-4 pt-14 pb-12 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="relative mx-auto w-full max-w-[1280px]">
        <div className="mb-5 flex items-end justify-between gap-4 text-brand-neutral-1000">
          <div>
            <p className="mb-1 flex items-center gap-2 text-body-s font-medium">
              <Mountain aria-hidden="true" className="size-4" />
              Last Minute Deals
            </p>
            <h2 className="font-display text-[clamp(24px,5vw,38px)] leading-tight font-bold">Join Upcoming Trips</h2>
          </div>
          <Link
            href="/last-minute-trip-deals"
           className="hidden shrink-0 items-center gap-2 rounded-pill border border-logo-sun bg-brand-neutral-000 px-5 py-2 text-body-s font-semibold text-logo-navy-dark transition-colors hover:bg-logo-sun sm:inline-flex"
          >
            View All Departures
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-[6px] bg-brand-neutral-000 shadow-[0_8px_30px_rgba(6,74,112,0.25)]">
          {/* Phones: one card per departure instead of a wide table. */}
          <ul className="divide-y divide-brand-neutral-200 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="px-4 py-5">
                <p className="text-[18px] leading-snug font-semibold text-logo-navy-dark">{row.title}</p>
                <p className="mt-2 text-[14px] text-brand-neutral-800">
                  {dateFormat.format(row.start)} - {dateFormat.format(row.end)}
                  <span className="ml-2 font-medium">· {row.days} Days</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-[19px] font-semibold text-logo-navy-dark">
                    {row.price > 0 ? `US${row.price}` : "Contact us"}
                  </span>
                  {row.oldPrice ? (
                    <span className="text-[14px] text-brand-neutral-700 line-through">US${row.oldPrice}</span>
                  ) : null}
                  <span className="text-[13px] text-brand-neutral-800">{row.status}</span>
                  {row.spaces ? (
                    <span className="rounded-pill bg-[#dce6f0] px-2.5 py-1 text-[12px] text-brand-neutral-800">{row.spaces}</span>
                  ) : null}
                </div>
                <Link
                  href={joinHref(row)}
                 className="mt-4 flex w-full justify-center rounded-pill bg-logo-sun px-4 py-2.5 text-[14px] font-bold text-logo-navy-dark transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
                >
                  Join This Date
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-[#cfe0ee] text-[13px] font-semibold tracking-wide text-brand-neutral-800 uppercase">
                  <th className="px-5 py-4">Trip Name</th>
                  <th className="px-3 py-4">Departure Date</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Price</th>
                  <th className="px-5 py-4">
                    <span className="sr-only">Join</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="group align-top transition-colors duration-200 hover:bg-logo-navy focus-within:bg-logo-navy">
                    <td className="px-5 py-4 text-[17px] font-semibold text-logo-navy-dark transition-colors group-hover:text-brand-neutral-000 group-focus-within:text-brand-neutral-000">{row.title}</td>
                    <td className="px-3 py-4 text-[14px] text-brand-neutral-800 transition-colors group-hover:text-brand-neutral-000 group-focus-within:text-brand-neutral-000">
                      {dateFormat.format(row.start)} - {dateFormat.format(row.end)}
                      <span className="mt-0.5 block font-medium">{row.days} Days</span>
                    </td>
                    <td className="px-3 py-4 text-[13px] text-brand-neutral-800 transition-colors group-hover:text-brand-neutral-000 group-focus-within:text-brand-neutral-000">
                      {row.status}
                      {row.spaces ? (
                        <span className="mt-1.5 block w-fit rounded-pill bg-[#dce6f0] px-2.5 py-1 text-[12px]">{row.spaces}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-4 transition-colors group-hover:text-brand-neutral-000 group-focus-within:text-brand-neutral-000">
                      <span className="text-[17px] font-semibold text-logo-navy-dark transition-colors group-hover:text-brand-neutral-000 group-focus-within:text-brand-neutral-000">
                        {row.price > 0 ? `US$${row.price}` : "Contact us"}
                      </span>
                      {row.oldPrice ? (
                        <>
                          <span className="ml-2 text-[14px] text-brand-neutral-700 line-through transition-colors group-hover:text-brand-neutral-200 group-focus-within:text-brand-neutral-200">US${row.oldPrice}</span>
                          <span className="mt-1.5 block w-fit rounded-pill bg-[#dce6f0] px-2.5 py-1 text-[12px] text-brand-neutral-800">
                            Save US${row.oldPrice - row.price}
                          </span>
                        </>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={joinHref(row)}
                       className="inline-flex whitespace-nowrap rounded-pill bg-logo-sun px-4 py-2 text-[13px] font-bold text-logo-navy-dark transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
                      >
                        Join This Date
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 bg-[#fdf3d6] px-5 py-5">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#d98a00]" />
            <div>
              <p className="text-[16px] font-semibold text-logo-navy-dark">Solo Travelers!</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-brand-neutral-800">
                A solo traveller will be paired with another traveller when booking through Last Minute Booking. Please
                add the Single Supplement Fee while booking to secure a single private room.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
