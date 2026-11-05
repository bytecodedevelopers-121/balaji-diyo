import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";
import { getAllPackageSlugs } from "../../[slug]/data";
import { resolvePackageBySlug } from "../../[slug]/resolve-content";
import { CheckoutView } from "./_components/CheckoutView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; adults?: string; addOns?: string; payment?: string }>;
}

/**
 * Checkout page — Figma "Book Now" frame (node 845:29789), reached from
 * the itinerary page's BookingConfirmModal ("Booking Confirm", node
 * 845:28090). Traveler info + payment method live here, matching the
 * flow split in Figma between the lightweight confirm modal and this
 * dedicated page.
 */
export async function generateStaticParams() {
  return (await getAllPackageSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await resolvePackageBySlug(slug);
  if (!trip) {
    return buildMetadata({ title: "Page Not Found", path: `/book-now/${slug}`, noIndex: true });
  }
  return buildMetadata({
    title: `Book ${trip.title}`,
    description: `Secure checkout for the ${trip.title} trek.`,
    path: `/book-now/${trip.slug}`,
    noIndex: true,
  });
}

export default async function BookNowPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const trip = await resolvePackageBySlug(slug);
  if (!trip) {
    notFound();
  }
  const query = await searchParams;

  return (
    <CheckoutView
      trip={trip}
      query={query}
      phone={siteConfig.phone}
      phoneHref={siteConfig.phoneHref}
    />
  );
}
