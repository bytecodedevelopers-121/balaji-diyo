import type { Metadata } from "next";
import { AffiliateForm } from "@/components/sections/AffiliateSection/AffiliateForm";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Affiliate Program",
  description:
    "Join the Joyful Trekking affiliate program: promote our treks and tours through your website, social media or travel business and earn a commission on every booking.",
  path: "/affiliate-program",
});

/** Affiliate Program: breadcrumb, title, how the program works, who can join, and the "Become an affiliate" form. */
export default function AffiliateProgramPage() {
  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[900px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Affiliate Program" }]}
          />

          <h1 className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
            Affiliate Program
          </h1>

          <div className="mt-6 space-y-4 text-[14px] leading-[1.85] text-brand-neutral-800">
            <p>
              <strong className="text-brand-neutral-1000">
                Joyful Trekking is a premier travel, trekking and tour company located in Kathmandu that is highly regarded by our
                satisfied clients for our exceptional tours of the Himalayas.
              </strong>{" "}
              Our team is dedicated to providing top-notch service and a genuine love for exploring the majestic beauty of the region.
            </p>
            <p>
              <strong className="text-brand-neutral-1000">
                An affiliate program at Joyful Trekking is a marketing strategy where we partner with individuals or businesses to
                promote our products or services.
              </strong>{" "}
              The affiliate marketers earn a commission for each successful booking or sale made through the referral link or code.
            </p>
            <p>
              Affiliates can promote travel products and services through various methods such as websites, social media, email
              marketing, and blog posts.
            </p>
          </div>

          <h2 className="mt-6 text-[20px] font-semibold text-brand-neutral-1000">Who can Affiliate with Joyful Trekking?</h2>
          <p className="mt-3 text-[14px] leading-[1.85] text-brand-neutral-800">
            <strong className="text-brand-neutral-1000">Any person, organisation or travel company can affiliate with Joyful Trekking.</strong>{" "}
            If you are a travel agent, an individual who uses social media, a travel blogger or an influencer, Joyful Trekking is a great
            platform for you to make regular passive income through our affiliate program.
          </p>

          <h2 className="mt-6 text-[20px] font-semibold text-brand-neutral-1000">How to affiliate with Joyful Trekking?</h2>
          <p className="mt-3 text-[14px] leading-[1.85] text-brand-neutral-800">
            There are a few steps and some terms and conditions to affiliate with us. Please fill in the form below and get in touch with
            us. We then make further communication and finalise it.
          </p>

          <AffiliateForm />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
