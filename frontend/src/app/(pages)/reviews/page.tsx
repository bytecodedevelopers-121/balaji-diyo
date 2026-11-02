import type { Metadata } from "next";
import { CtaSection } from "@/components/sections/CtaSection";
import { PageHero } from "@/components/sections/PageHero";
import { TestimonialsPageSection } from "@/components/sections/TestimonialsPageSection";
import { getTestimonials } from "@/features/testimonials/api/get-testimonials";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Testimonials",
  description: "Read reviews and trekking experiences shared by Joyful Trekking Pvt. Ltd. travelers.",
  path: "/reviews",
  image: "/images/testimonials/c0d5e14dceb7ea239142d655c2a4de669d80d627.jpg",
});

export default async function ReviewsPage() {
  const testimonials = await getTestimonials();

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Testimonials" }]}
        title="Read What Our Customers Are Saying"
        subtitle="Everything required before you set foot on the trail — permits, visas, and paperwork, explained simply."
        image="/images/testimonials/c0d5e14dceb7ea239142d655c2a4de669d80d627.jpg"
        imageAlt="Terraced rice fields in the Pokhara valley with the Annapurna range and Machapuchare behind"
      />
      <TestimonialsPageSection testimonials={testimonials.items} />
      <CtaSection />
    </>
  );
}
