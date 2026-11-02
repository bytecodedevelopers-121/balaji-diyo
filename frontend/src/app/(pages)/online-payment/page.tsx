import type { Metadata } from "next";
import { getTrips } from "@/features/trips/api/get-trips";
import { buildMetadata } from "@/lib/seo/metadata";
import { PaymentForm } from "./_components/PaymentForm";

/**
 * Standalone "pay any amount now" page — legacy `boundlessadventure.com/payment`
 * (no equivalent existed in this rebuild yet). Distinct from `/book-now/[slug]`:
 * that flow creates a Booking row first and only then initiates PACO checkout
 * for its computed total; this page skips booking entirely and lets someone
 * pay a self-entered amount against a package (or "Custom Package / Other
 * Service") directly — same real `POST /payments/paco/checkout` endpoint
 * (backend/src/modules/payment), just called without a booking in front of it.
 * `noIndex`, matching `/book-now/[slug]`'s own transactional-page treatment.
 */
export const metadata: Metadata = buildMetadata({
  title: "Secure Payment",
  description: "Complete your booking safely and securely. Your adventure awaits!",
  path: "/payment",
  noIndex: true,
});

export default async function PaymentPage() {
  const packages = await getTrips();

  return (
    <section className="mx-auto w-full max-w-320 px-6 py-10 md:px-16 lg:py-16">
      <div className="mb-8 md:mb-12">
        <h1 className="font-playfair-display text-[36px] leading-[1.2] text-secondary-500 font-medium text-brand-neutral-1000 sm:text-[44px]">
          Secure Payment
        </h1>
        <p className="mt-3 max-w-2xl font-poppins text-body-l text-brand-neutral-700">
          Complete your booking safely and securely. Your adventure awaits!
        </p>
      </div>

      <PaymentForm packages={packages} />
    </section>
  );
}
