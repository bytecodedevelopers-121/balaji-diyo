import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { PlanYourTripForm } from "./_components/PlanYourTripForm";

export const metadata: Metadata = buildMetadata({
  title: "Plan Your Nepal Trip",
  description: "Tell us what you want from your holiday and our team will build a personalised Nepal itinerary around it.",
  path: "/plan-your-trip",
});

/** Plan Your Nepal Trip: intro copy plus a single-page enquiry form. */
export default function PlanYourTripPage() {
  return (
    <main className="bg-white px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
      <div className="mx-auto w-full max-w-[1200px]">
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-brand-neutral-700">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          <span aria-hidden="true">→</span> <span className="text-brand-neutral-1000">Plan Your Nepal Trip</span>
        </nav>
        <h1 className="mb-6 font-display text-[clamp(32px,5vw,52px)] leading-tight font-bold text-brand-neutral-1000">
          Plan Your Nepal Trip
        </h1>

        <div className="mb-8 space-y-5 text-[16px] leading-[1.9] text-brand-neutral-800">
          <p className="font-semibold text-brand-neutral-1000">
            Looking for a unique travel experience? With Joyful Trekking, you can plan a holiday that meets all your needs and desires.
          </p>
          <p>
            Are you tired of cookie-cutter travel packages that don&apos;t quite fit your interests and preferences? Whether you want to
            explore the mountains, immerse yourself in local culture, or indulge in adventure activities, our team can help you create a
            personalised travel plan.
          </p>
          <p>
            Our team of experts has years of experience planning tailor-made holidays that meet the needs and desires of our clients. We
            offer a wide range of activities and destinations to choose from, and our attention to detail and commitment to your
            satisfaction ensures that your trip will be unforgettable.
          </p>
        </div>

        <PlanYourTripForm />
      </div>
    </main>
  );
}
