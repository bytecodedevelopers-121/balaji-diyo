import type { Departure } from "@/features/departures/types/departure.types";

interface DepartureTableProps {
  departures: Departure[];
}

export function DepartureTable({ departures }: DepartureTableProps) {
  const displayedDepartures: DisplayDeparture[] =
    departures.length > 0 ? departures : DUMMY_DEPARTURES;

  return (
    <div className="overflow-x-auto rounded-[16px] border border-secondary-500">
      <table className="w-full min-w-[760px] table-fixed border-collapse text-left font-poppins">
        <colgroup>
          <col className="w-[39.6%]" />
          <col className="w-[27.4%]" />
          <col className="w-[16.5%]" />
          <col className="w-[16.5%]" />
        </colgroup>
        <thead>
          <tr className="h-[58px] bg-[#fdc494]">
            <th className="border-r border-secondary-500 px-5 text-body-m font-medium text-brand-neutral-1000">Trip</th>
            <th className="border-r border-secondary-500 px-5 text-body-m font-medium text-brand-neutral-1000">Departure Date</th>
            <th className="border-r border-secondary-500 px-5 text-body-m font-medium text-brand-neutral-1000">Duration</th>
            <th className="px-5"><span className="sr-only">Reserve</span></th>
          </tr>
        </thead>
        <tbody>
          {displayedDepartures.map((departure) => (
            <tr key={departure.id} className="h-[63px] border-t border-secondary-500">
              <td className="border-r border-secondary-500 px-5 text-body-m font-semibold text-brand-neutral-900">
                {departure.package.title}
              </td>
              <td className="border-r border-secondary-500 px-5 text-body-m font-medium text-brand-neutral-900">
                {formatDepartureRange(departure)}
              </td>
              <td className="border-r border-secondary-500 px-5 text-body-m font-medium capitalize text-brand-neutral-900">
                {departure.package.duration} {departure.package.durationType}
              </td>
              <td className="px-5 text-center">
                <a
                  href={whatsAppHref(reserveSeatMessage(departure))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-pill bg-secondary-500 px-4 py-1.5 text-button-m font-medium whitespace-nowrap text-brand-neutral-000 transition-opacity hover:opacity-90"
                >
                  Reserve Seat
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type DisplayDeparture = Departure & {
  /** Frontend-only range from the approved mockup; real API rows compute this from duration. */
  displayEndDate?: string;
};

const DUMMY_DEPARTURES: DisplayDeparture[] = [
  dummyDeparture("dummy-ebc-aug", "Everest Base Camp Trek", "2026-08-10", "2026-08-20", "14"),
  dummyDeparture(
    "dummy-ebc-heli-aug",
    "Everest Base Camp Trek With Helicopter Return",
    "2026-08-14",
    "2026-08-24",
    "8",
  ),
  dummyDeparture("dummy-short-ebc-aug", "Short Everest Base Camp Trek", "2026-08-20", "2026-08-30", "10"),
  dummyDeparture("dummy-short-abc-sep", "Short Annapurna Base Camp Trek", "2026-09-04", "2026-09-14", "8"),
  dummyDeparture("dummy-short-ebc-oct", "Short Everest Base Camp Trek", "2026-10-10", "2026-10-20", "7"),
  dummyDeparture("dummy-ebc-aug-2", "Everest Base Camp Trek", "2026-08-10", "2026-08-20", "14"),
  dummyDeparture(
    "dummy-ebc-heli-aug-2",
    "Everest Base Camp Trek With Helicopter Return",
    "2026-08-14",
    "2026-08-24",
    "8",
  ),
  dummyDeparture("dummy-short-ebc-aug-2", "Short Everest Base Camp Trek", "2026-08-20", "2026-08-30", "10"),
  dummyDeparture("dummy-short-abc-sep-2", "Short Annapurna Base Camp Trek", "2026-09-04", "2026-09-14", "8"),
];

function dummyDeparture(
  id: string,
  title: string,
  departureDate: string,
  displayEndDate: string,
  duration: string,
): DisplayDeparture {
  return {
    id,
    departureDate,
    displayEndDate,
    departureCost: "0",
    departureNote: null,
    departureStatus: "dummy",
    package: { title, duration, durationType: "Days" },
  };
}

const WHATSAPP_NUMBER = "9779845000000";

function whatsAppHref(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function reserveSeatMessage(departure: Departure): string {
  return `Hi! I'd like to reserve a seat on the ${departure.package.title} departing ${formatDepartureRange(departure)}.`;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDepartureRange(departure: DisplayDeparture): string {
  const start = new Date(departure.departureDate);
  const startLabel = dateFormatter.format(start);

  if (departure.displayEndDate) {
    return `${startLabel} – ${dateFormatter.format(new Date(departure.displayEndDate))}`;
  }

  if (departure.package.durationType.toLowerCase() !== "days") {
    return startLabel;
  }

  const durationDays = Number(departure.package.duration);
  if (!Number.isFinite(durationDays)) {
    return startLabel;
  }

  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  return `${startLabel} – ${dateFormatter.format(end)}`;
}
