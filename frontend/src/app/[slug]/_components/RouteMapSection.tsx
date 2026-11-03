import Link from "next/link";
import { ChartNoAxesCombined, FilePenLine, MapPin } from "lucide-react";
import { WHATSAPP_HREF, WhatsAppGlyph } from "@/components/ui/WhatsAppButton";
import type { PackageDetail } from "../data";
import { AltitudeChart } from "./AltitudeChart";
import type { RouteMapStop } from "./RouteMap";
import { RouteMapLoader } from "./RouteMapLoader";
import { EmptyNote, SectionRow } from "./SectionRow";

const SUMMARY_CLASS =
  "flex cursor-pointer list-none items-center gap-3 py-4 text-[19px] font-medium text-brand-neutral-900 marker:hidden [&::-webkit-details-marker]:hidden";

/** "+" while closed, "−" while open — pure CSS off the parent `<details>`'s `group-open`. */
function Toggle() {
  return (
    <span aria-hidden="true" className="ml-auto text-[22px] leading-none text-brand-neutral-800">
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </span>
  );
}

/**
 * "Route Map" — a pale panel: the day-by-day outline and a "Customize This
 * Trip" card on the left, and on the right a white card holding exclusive
 * accordions for the interactive route map and the altitude chart.
 */
export function RouteMapSection({ trip }: { trip: PackageDetail }) {
  const days = trip.detailedItinerary.flatMap((leg) => leg.days);
  const stops: RouteMapStop[] = days
    .filter((day): day is typeof day & { lat: number; lng: number } => day.lat !== undefined && day.lng !== undefined)
    .map((day) => ({
      day: day.day,
      place: day.locations[day.locations.length - 1]?.label ?? day.title,
      altitudeM: day.altitudeM,
      lat: day.lat,
      lng: day.lng,
    }));
  const hasMap = trip.routePath.length > 0 || stops.length > 0;
  const hasAltitude = trip.altitudeProfile.length > 0;

  if (trip.shortItinerary.length === 0 && !hasMap && !hasAltitude) {
    return (
      <SectionRow id="map" label="Route Map">
        <EmptyNote>The route map for this trip will be added soon.</EmptyNote>
      </SectionRow>
    );
  }

  const directionsUrl = stops.length > 0 ? `https://www.google.com/maps/dir/${stops.map((stop) => `${stop.lat},${stop.lng}`).join("/")}` : undefined;

  return (
    <div id="map" className="grid gap-8 rounded-md bg-[#dcebf3] p-6 sm:p-8 min-[1280px]:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
      <div className="min-w-0">
        <h3 className="text-[26px] leading-tight font-medium text-brand-neutral-900">{trip.title} Outline Itinerary and Map</h3>
        <ul className="mt-4 flex flex-col gap-2.5 text-[16px] leading-snug text-brand-neutral-900">
          {trip.shortItinerary.map((day) => (
            <li key={day.day}>
              <strong>Day {String(day.day).padStart(2, "0")}:</strong> {day.title}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-md bg-[#f8fafc] p-5 sm:p-6">
          <h4 className="text-[22px] font-medium text-brand-neutral-900">Customize This Trip</h4>
          <p className="mt-2 text-[14px] leading-relaxed text-brand-neutral-800">
            The above itinerary does not meet your requirements, we can design individualized travel Itinerary based on your
            preferences and specification.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/customize-trip"
              className="inline-flex items-center gap-2 rounded-pill bg-[#f7931e] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <FilePenLine aria-hidden="true" className="size-4" />
              Customize My Trip
            </Link>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill bg-[#25D366] px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <WhatsAppGlyph className="size-4" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      <div className="min-w-0 self-start rounded-md bg-white px-5 shadow-card-soft">
          <details name="route-panel" open className="group border-b border-[#e3e8ee] last:border-b-0">
              <summary className={SUMMARY_CLASS}>
                <MapPin aria-hidden="true" className="size-6 text-brand-neutral-600" strokeWidth={1.5} />
                Route Map
                <Toggle />
              </summary>
              {hasMap ? (
                <>
                  {/* `isolate` keeps Leaflet's internal z-indexes from escaping above the sticky tab bar. */}
                  <div className="relative isolate mb-4 aspect-[4/3] overflow-hidden rounded-sm bg-primary-100">
                    <RouteMapLoader path={trip.routePath} stops={stops} />
                  </div>
                  {directionsUrl ? (
                    <a href={directionsUrl} target="_blank" rel="noreferrer" className="mb-4 block text-[14px] font-medium text-primary-500 hover:underline">
                      Open in Google Maps
                    </a>
                  ) : null}
                </>
              ) : (
                <div className="mb-4">
                  <EmptyNote>The route map for this trip will be added soon.</EmptyNote>
                </div>
              )}
            </details>
          {hasAltitude ? (
            <details name="route-panel" open={!hasMap} className="group">
              <summary className={SUMMARY_CLASS}>
                <ChartNoAxesCombined aria-hidden="true" className="size-6 text-brand-neutral-600" strokeWidth={1.5} />
                Altitude Chart
                <Toggle />
              </summary>
              <div className="pb-4">
                <AltitudeChart trip={trip} bare />
              </div>
            </details>
          ) : null}
      </div>
    </div>
  );
}
