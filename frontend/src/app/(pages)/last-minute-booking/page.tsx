import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";
import { siteConfig } from "@/config/site";
import { ALL_SAMPLE_TRIPS } from "@/lib/sample-trips";
import { buildMetadata } from "@/lib/seo/metadata";
import { LastMinuteBookingForm, type LastMinuteTrip } from "./_components/LastMinuteBookingForm";

export const metadata: Metadata = buildMetadata({
  title: "Last Minute Booking",
  path: "/last-minute-booking",
  noIndex: true,
});

interface PageProps {
  searchParams: Promise<{ title?: string; slug?: string; date?: string; days?: string; price?: string }>;
}

const FALLBACK_IMAGE = "/images/journey/trek.jpg";

/** Last Minute Booking — reached from a "Join This Date" button on the homepage departures table. */
export default async function LastMinuteBookingPage({ searchParams }: PageProps) {
  const q = await searchParams;
  const match = ALL_SAMPLE_TRIPS.find((t) => t.slug === q.slug || t.title === q.title);
  const today = new Date().toISOString().slice(0, 10);

  const trip: LastMinuteTrip = {
    title: q.title ?? match?.title ?? "Your Trip",
    slug: q.slug ?? match?.slug ?? "",
    imageUrl: match?.imageUrl ?? FALLBACK_IMAGE,
    date: q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date) ? q.date : today,
    days: Number.parseInt(q.days ?? "", 10) || Number(match?.duration) || 1,
    price: Number.parseFloat(q.price ?? "") || match?.priceFrom || 0,
  };
  const phone = siteConfig.phoneHref.replace(/[^\d]/g, "");

  return (
    <>
      <section className="relative isolate flex min-h-[200px] w-full items-center overflow-hidden px-6 py-8 sm:min-h-[240px]">
        <div className="contents">
          <FillImage
            src={trip.imageUrl}
            alt={trip.title}
            className="absolute inset-0 -z-10 block size-full object-cover object-center"
            sizes="100vw"
            preload
          />
          <div className="absolute inset-0 -z-10" style={{ backgroundImage: "var(--gradient-photo-scrim)" }} aria-hidden="true" />
          <div className="flex w-full flex-col items-center text-center">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Last Minute Deals", href: "/last-minute-trip-deals" },
                { label: trip.title },
                { label: "Booking" },
              ]}
            />
            <h1 className="mt-2 font-playfair-display text-[32px] leading-tight font-medium text-brand-neutral-000 sm:text-[44px]">
              Last Minute Booking
            </h1>
            <p className="mt-2 font-poppins text-[15px] font-medium text-brand-neutral-000">
              {trip.title} · {trip.days} Days
            </p>
          </div>
        </div>
      </section>
      <main className="bg-[#f6f9fc] px-4 pt-10 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[1100px]">
          <LastMinuteBookingForm trip={trip} phone={phone} />
        </div>
      </main>
    </>
  );
}
