import type { ComponentType } from "react";
import { BedDouble, CarFront, Clock, Footprints, MapPin, Mountain, Route, Utensils } from "lucide-react";
import { CmsProse } from "@/components/ui/CmsProse";
import { FillImage } from "@/components/ui/FillImage";
import type { ItineraryDay, PackageDetail } from "../data";
import { ItineraryPhotoGallery } from "./ItineraryPhotoGallery";

const METERS_TO_FEET = 3.28084;

type MetaIcon = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean | "true" | "false" }>;

/** The small icon + text facts under each day's description. */
function dayFacts(day: ItineraryDay): { Icon: MetaIcon; text: string }[] {
  const facts: { Icon: MetaIcon; text: string }[] = [
    {
      Icon: Mountain,
      text: `Max Altitude: ${day.altitudeM.toLocaleString()}m / ${Math.round(day.altitudeM * METERS_TO_FEET).toLocaleString()} ft`,
    },
  ];
  if (day.meals) facts.push({ Icon: Utensils, text: `Meals: ${day.meals}` });
  if (day.accommodation) facts.push({ Icon: BedDouble, text: `Accommodation: ${day.accommodation}` });
  if (day.durationHours > 0) facts.push({ Icon: Clock, text: `Duration: ${day.durationHours} hours` });
  if (day.distanceKm !== undefined) facts.push({ Icon: Route, text: `Distance: ${day.distanceKm} km` });
  if (day.lunchPlace) facts.push({ Icon: Footprints, text: `Lunch: ${day.lunchPlace}` });
  if (day.transport) facts.push({ Icon: CarFront, text: `Travel Mode: ${day.transport}` });
  return facts;
}

/** One photo beside a "Highlight of the day" caption — the day's own photo, else its leg's. */
function DayHighlight({ title, image }: { title: string; image?: string }) {
  if (!image) return null;
  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-[#e7dfd2] pt-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-md bg-brand-neutral-200 sm:w-[204px]">
        <FillImage src={image} alt={title} className="object-cover" sizes="204px" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-brand-neutral-900">Highlight of the day</p>
        <p className="mt-2 text-[13px] text-brand-neutral-800">{title}</p>
      </div>
    </div>
  );
}

/**
 * "<Trip> Detailed Itinerary" — the intro copy, then a "Daily Plan" of day
 * bars (a blue pill with the day number and title) each followed, down a
 * dashed rail, by that day's description, its icon facts and any photos.
 * The short day-by-day outline now lives in the Route Map panel.
 */
export function ItinerarySection({ trip }: { trip: PackageDetail }) {
  // Each day carries its leg's photo as a fallback for days with no photos of their own.
  const days = trip.detailedItinerary.flatMap((leg) => leg.days.map((day) => ({ ...day, legImage: leg.image })));

  // "Lukla Flight Information" is real, generic-but-accurate boilerplate for
  // any trek that flies through Lukla. No backend field says so, so this
  // checks the one real signal in the data: does any day title or place
  // mention it.
  const fliesViaLukla =
    trip.shortItinerary.some((day) => day.title.toLowerCase().includes("lukla")) ||
    days.some(
      (day) =>
        day.title.toLowerCase().includes("lukla") ||
        day.locations.some((loc) => loc.label.toLowerCase().includes("lukla")),
    );

  return (
    <section>
      <h3 className="text-[32px] leading-tight font-bold text-brand-neutral-900">{trip.title} Detailed Itinerary</h3>
      <CmsProse html={trip.detailedItineraryIntro} className="mt-5 text-[16px]" />

      <h4 className="mt-9 text-[26px] leading-tight font-medium text-brand-neutral-900">{trip.title} Daily Plan</h4>

      <ol className="mt-6 flex flex-col">
        {days.map((day, index) => {
          const facts = dayFacts(day);
          return (
            <li key={day.day}>
              <div className="flex items-center gap-3 rounded-pill bg-[#4f98bf] py-2 pr-5 pl-2 text-white">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#4f98bf]">
                  {index === 0 ? (
                    <MapPin aria-hidden="true" className="size-4" strokeWidth={2.5} />
                  ) : (
                    <span aria-hidden="true" className="size-3.5 rounded-full border-[3px] border-[#4f98bf]" />
                  )}
                </span>
                <h5 className="text-[17px] leading-snug font-semibold">
                  <span className="uppercase">Day {String(day.day).padStart(2, "0")}:</span> {day.title}
                </h5>
              </div>

              <div className="ml-4 border-l border-dashed border-[#4f98bf] pt-4 pb-8 pl-6 sm:pl-8">
                <p className="text-[16px] leading-[1.75] whitespace-pre-line text-brand-neutral-800">{day.description}</p>

                <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-brand-neutral-800">
                  {facts.map(({ Icon, text }) => (
                    <li key={text} className="flex items-center gap-2">
                      <Icon aria-hidden="true" className="size-5 shrink-0 text-brand-neutral-700" strokeWidth={1.5} />
                      {text}
                    </li>
                  ))}
                </ul>

                {day.photos && day.photos.length > 1 ? (
                  <div className="mt-4 border-t border-[#e7dfd2] pt-1">
                    <ItineraryPhotoGallery photos={day.photos} dayTitle={day.title} />
                  </div>
                ) : (
                  <DayHighlight
                    title={day.title}
                    image={day.photos?.find((media) => media.type === "image")?.url ?? day.legImage}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {fliesViaLukla ? (
        <div className="mt-2 rounded-md bg-[#dcebf3] p-6">
          <h4 className="text-[20px] font-medium text-brand-neutral-900">Lukla Flight Information</h4>
          <p className="mt-3 text-[15px] leading-relaxed text-brand-neutral-800">
            During peak trekking months (March, April, May, October, and November), flights to Lukla often depart from
            Ramechhap (Manthali) instead of Kathmandu because of airport traffic. In this case, you&apos;ll need to leave
            Kathmandu around 12:30 a.m. for a five-hour drive to catch your flight from Ramechhap on the trek departure
            date. Outside of peak seasons, flights usually operate directly from Kathmandu. Flights between Kathmandu and
            Lukla can be delayed due to weather, so adding at least two extra days to your trip is a good idea to avoid
            missing your international flight home.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-md bg-[#fdf3d6] p-6">
        <h4 className="text-[20px] font-medium text-brand-neutral-900">Note</h4>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-neutral-800">
          We recommend you arrive at Kathmandu by three pm at least one day before the trek departure date for
          last-minute preparations.
        </p>
      </div>
    </section>
  );
}
