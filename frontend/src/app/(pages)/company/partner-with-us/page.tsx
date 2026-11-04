import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/animation/Reveal";
import { PartnerFormSection } from "@/components/sections/PartnerSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Partner with Us",
  description:
    "Partner with Joyful Trekking Pvt. Ltd.: trekking and climbing operators, tour operators, cultural organizations, NGOs, tour leaders and marketing companies are all welcome to work with us.",
  path: "/company/partner-with-us",
});

const PARTNER_TYPES = [
  "Trekking and Climbing operators",
  "Luxury Tour operators",
  "Adventure Tour operators",
  "Cultural tourism organizations",
  "Jungle Safari and wildlife organizers",
  "Destination Management companies",
  "Family Trip organizers",
  "Various NGO's and INGO's",
  "Individual trekking and tour leaders",
  "Marketing companies",
];

/**
 * Partner with Us: breadcrumb, title, a short statement, the ten kinds of
 * partner as a bookmark-star list and a pale-yellow "get in touch" note. The
 * partnership enquiry form stays below so a visitor can reach out right away.
 */
export default function PartnerWithUsPage() {
  return (
    <>
      <Reveal variant="auto">
        <section className="bg-brand-neutral-000 px-4 pt-6 pb-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className="mx-auto w-full max-w-[900px]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[{ label: "Home", href: "/" }, { label: "Company" }, { label: "Partner with Us" }]}
            />

            <h1 data-reveal="up" className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
              Partner with Us
            </h1>

            <p data-reveal="up" className="mt-6 text-[16px] leading-[1.85] font-semibold text-brand-neutral-1000">
              We at Joyful Trekking Pvt. Ltd. believe in ethical tourism business and trust that partnership is fundamental towards
              achieving results for both parties. Our partnerships are driven by a shared vision of the future of travel. So, let&apos;s
              work together for mutual benefits, and the following types of companies, individuals, and organizations can partner with us.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {PARTNER_TYPES.map((type) => (
                <li
                  key={type}
                  data-reveal="up"
                  className="relative pl-10 text-[16px] leading-[1.7] text-brand-neutral-800 before:absolute before:top-0.5 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-['']"
                >
                  {type}
                </li>
              ))}
            </ul>

            <p data-reveal="up" className="mt-8 rounded-md bg-[#fdf3d6] px-6 py-5 text-[16px] text-brand-neutral-900">
              Get in touch with us for further discussion about the partnership policy, models, and related matters to grow together.{" "}
              <Link href="#partner-form" className="font-semibold text-logo-navy underline">
                Send us a message
              </Link>
              .
            </p>
          </div>
        </section>
      </Reveal>
      <PartnerFormSection />
    </>
  );
}
