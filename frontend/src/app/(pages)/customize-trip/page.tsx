import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CustomizeTripSection } from "@/components/sections/CustomizeTripSection";
import { CtaSection } from "@/components/sections/CtaSection";
import { getTrips } from "@/features/trips/api/get-trips";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Customize Your Trip",
  description: "Tell us what your ideal Nepal journey looks like and our team will create a personalized itinerary for you.",
  path: "/customize-trip",
});

export default async function CustomizeTripPage() {
  const packages = await getTrips();

  return (
    <>
      <section className="flex min-h-[190px] items-center bg-brand-neutral-000 px-6 py-10 md:px-16">
        <div className="mx-auto flex w-full max-w-[1312px] flex-col items-center text-center">
          <Breadcrumbs tone="dark" items={[{ label: "Home", href: "/" }, { label: "Customize Your Trip" }]} />
          <h1 className="mt-5 font-playfair-display text-[44px] leading-[1.2] font-medium text-brand-neutral-1000 sm:text-[56px]">Customize Your Trip</h1>
        </div>
      </section>
      <CustomizeTripSection packages={packages} />
      <CtaSection />
    </>
  );
}
