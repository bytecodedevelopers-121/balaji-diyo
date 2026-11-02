import type { PackageDetail } from "../data";
import { UsersIcon } from "./icons";

/**
 * "Cost" (group-size price tiers) — matches Figma node 1000006520.
 *
 * The "Estimate your cost with add on" interactive checklist that used
 * to live here (Figma node 1000006643) was removed 2026-09-03, direct
 * request: it duplicated the real, functional add-ons picker that
 * already exists in `BookingConfirmModal.tsx`/`CheckoutView.tsx`, but
 * unlike either of those this copy was never wired to an actual total —
 * checking a box here just toggled local state nothing else read. Add-ons
 * now only ever appear once, in the checkout flow's own final step (see
 * `CheckoutView.tsx`'s own "1. Your booking" section) — not duplicated
 * across this page and every booking step. Back to a plain Server
 * Component now that nothing here needs client-side state.
 *
 * The group-size table itself is plain/static — no row selection (an
 * earlier pass had a clickable, highlighted "selected tier"). `costTiers`
 * is still just a static price table, same as the design; the real
 * per-traveler price shown in `BookingSidebar`/`BookingConfirmModal`/
 * `CheckoutView` is looked up from this same data via
 * `pricePerPersonForAdults()` in `booking-helpers.ts`, not re-derived
 * here.
 */
export function CostSection({ trip }: { trip: PackageDetail }) {
  return (
    <section className="rounded-2xl border border-[#fbc99d] bg-white p-4 shadow-card-strong sm:p-8">
      <h2 className="font-poppins text-raleway-3xl font-medium text-brand-neutral-1000">Cost</h2>
      <p className="mt-4 flex items-center gap-3 font-poppins text-body-l font-medium text-secondary-500">
        <UsersIcon className="size-5" />
        Group Price Breakdown
      </p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-[#f9af6c]">
        <div className="grid grid-cols-2 gap-3 bg-[#fcd4b1] px-5 py-4 font-poppins text-body-l font-medium text-brand-neutral-1000">
          <span>Group Size</span>
          <span>Price Per Person</span>
        </div>
        {trip.costTiers.map((tier) => (
          <div
            key={tier.groupSize}
            className="grid w-full grid-cols-2 gap-3 border-t border-[#f9af6c] px-5 py-4 font-poppins text-body-l font-medium text-brand-neutral-900"
          >
            <span>{tier.groupSize}</span>
            <span>${tier.pricePerPerson.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
