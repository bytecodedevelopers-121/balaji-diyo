import { getUpcomingDepartures } from "@/features/departures/api/get-upcoming-departures";
import { DepartureTable } from "./DepartureTable";

/**
 * The content block below the last-minute-deals hero.
 *
 * This is intentionally a purpose-built section instead of generic CMS prose:
 * the approved layout has a wide departures table, a centered intro, and a
 * compact instruction card with their own spacing and typography.
 */
export async function LastMinuteTripsSection() {
  const departures = await getUpcomingDepartures({ lastMinuteOnly: true });

  return (
    <section className="bg-brand-neutral-000 px-5 py-10 md:px-8 lg:px-16 lg:pb-11 lg:pt-[108px]">
      <div className="mx-auto w-full max-w-[1312px]">
        <div className="mx-auto max-w-[1100px] text-center">
          <h2 className="font-playfair-display text-[32px] leading-[1.2] font-medium text-brand-neutral-1000 lg:text-[44px]">
            Why Last Minute Trips Are Worth It
          </h2>

          <p className="mt-4 font-poppins text-body-l text-brand-neutral-700">
            Sometimes the best trips are the ones you never plan ahead of time. If you are ready for a break right now, our last-minute trips are your chance to make it happen. We have exciting Nepal last-minute trek trips leaving soon. All you need to do is pick your route, grab your backpack, and get ready to go.
          </p>

          <p className="mt-6 font-poppins text-body-l text-brand-neutral-700">
            Sometimes the best trips are the ones you never plan ahead of time. If you are ready for a break right now, our last-minute trips are your chance to make it happen. We have exciting Nepal last-minute trek trips leaving soon. All you need to do is pick your route, grab your backpack, and get ready to go.
          </p>
        </div>

        <div className="mt-12 lg:mt-[50px]">
          <h3 className="font-poppins text-[22px] leading-[1.3] font-bold text-primary-500 lg:text-[26px]">
            Upcoming Last Minute Departures
          </h3>

          <div className="mt-[18px]">
            <DepartureTable departures={departures} />
          </div>
        </div>

        <aside className="mt-11 rounded-[16px] border-l-4 border-primary-500 bg-primary-100 px-5 py-7 font-poppins text-body-l text-brand-neutral-900 shadow-card-strong lg:min-h-[220px]">
          <h3 className="text-heading-xl font-semibold text-brand-neutral-1000">How It Works</h3>
          <p className="mt-5">Booking is fast and simple.</p>
          <ol className="list-decimal pl-6">
            <li>Choose a trip from the list above</li>
            <li>Confirm your spot with our team</li>
            <li>Pack your bags and get ready to go within days</li>
          </ol>
          <p>Having your passport and travel documents ready will make the process even smoother.</p>
        </aside>
      </div>
    </section>
  );
}
