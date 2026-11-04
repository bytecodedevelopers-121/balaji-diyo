import type { PackageDetail } from "../data";

/**
 * "Add-ons & Options" — a peach card explaining how a traveler can join the
 * trip (solo into a group, small group, solo private, private), followed by
 * the package's priced add-ons when it has any.
 */
export function AddOnsSection({ trip }: { trip: PackageDetail }) {
  return (
    <section>
      <h3 className="text-[32px] leading-tight font-bold text-brand-neutral-900">Add-ons &amp; Options</h3>
      <div className="mt-5 rounded-md bg-[#fdf3d6] p-6 text-[16px] leading-[1.75] text-brand-neutral-800 sm:p-7">
        <h4 className="text-[21px] leading-snug font-bold text-brand-neutral-900">
          {trip.title} Options: How would you like to experience the {trip.title}?
        </h4>
        <p className="mt-4 font-bold text-brand-neutral-900">
          Are you a solo traveller joining a group trek and want to have a private room?
        </p>
        <ul className="mt-3 list-disc pl-6">
          <li>
            A solo traveller will be paired with another traveller when joining the group trek. We guarantee a single room
            in Kathmandu and most of the accommodation during the trek. Please select &lsquo;Single room&rsquo; at checkout
            time if you want to have a private room.
          </li>
        </ul>
        <p className="mt-4">
          <strong className="text-brand-neutral-900">Small Group Trek:</strong> We have fixed dates to join the{" "}
          <strong className="text-brand-neutral-900">small group trek</strong>. The group size ranges from 1 to 12 pax.
          Please select a date and book on your preferred date.
        </p>
        <p className="mt-4">
          <strong className="text-brand-neutral-900">Solo Private Trek:</strong> We organize a{" "}
          <strong className="text-brand-neutral-900">solo private trek</strong>, available on any date of the year. You can
          choose any of the fixed dates or check availability if the given date is not suitable for you. Additional costs
          apply to do a solo trek. Please select the Solo Private Trek option at checkout if you prefer this option.
        </p>
        <p className="mt-4">
          <strong className="text-brand-neutral-900">Private Trek:</strong> If you are two or more and want to do a{" "}
          <strong className="text-brand-neutral-900">private trek</strong>, an additional fee applies. Please tick to make it
          private at checkout time, or check availability. This type of trip is available on any date of the year.
        </p>

        {trip.addOns.length > 0 ? (
          <div className="mt-6 border-t border-[#f4e0a6] pt-5">
            <p className="font-bold text-brand-neutral-900">Optional add-ons</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {trip.addOns.map((addOn) => (
                <li key={addOn.label} className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span>{addOn.label}</span>
                  <span className="font-semibold text-brand-neutral-900">
                    US${addOn.price.toLocaleString()} / {addOn.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
