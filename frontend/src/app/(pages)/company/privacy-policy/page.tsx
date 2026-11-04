import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Joyful Trekking Pvt. Ltd. uses and protects the personal information you share when you use this website or book a trip.",
  path: "/company/privacy-policy",
});

type Block =
  | { kind: "p"; text: ReactNode; strong?: boolean }
  | { kind: "ul"; items: string[] };

interface Section {
  title: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
  {
    title: "The contract between Joyful Trekking Pvt. Ltd. and Clients/Visitors",
    blocks: [
      {
        kind: "p",
        text: (
          <>
            <strong className="text-brand-neutral-1000">
              This website is operated by Joyful Trekking Pvt. Ltd., a trekking and tour company registered in Nepal under the law of the
              Government of Nepal.
            </strong>{" "}
            By using our website, the customers/visitors (you) accept the terms and conditions on our website. The customer/visitor (you)
            accepts that you do not use the information here for forbidden or unlawful purposes or activities. If you do not agree with
            these terms and conditions, you are asked not to use this website and the information on it, please.
          </>
        ),
      },
    ],
  },
  {
    title: "Use of personal information and protection",
    blocks: [
      {
        kind: "p",
        text: "We need your passport copy or a document that identifies you with your full name, address, postal code, contact number, and your relative's contact number in case of emergency, email address, etc., and we ask you to send us these when you are booking trips with us. This information and these documents are only used to make travel bookings and reservations.",
      },
      {
        kind: "p",
        text: "We humbly respect your privacy and we will not sell, announce or disclose this information to third parties unless it is compulsory to submit this information and these documents to government agencies/third parties, as it is compulsory to get trekking and climbing permits and to obtain a visa and permit when you travel to Tibet and Bhutan.",
      },
    ],
  },
  {
    title: "Security",
    blocks: [
      {
        kind: "p",
        strong: true,
        text: "These web pages have taken all necessary measures to protect your personal information. Entering personal information via these web pages is protected by the SSL protocol.",
      },
    ],
  },
  {
    title: "Links on other websites",
    blocks: [
      {
        kind: "p",
        strong: true,
        text: "Our website has links to other related and useful sites. We do not govern them, so you should be aware that Joyful Trekking Pvt. Ltd. is not responsible for the privacy policy on those websites.",
      },
    ],
  },
  {
    title: "Limitation to Personal and Noncommercial Use",
    blocks: [
      {
        kind: "p",
        text: (
          <>
            <strong className="text-brand-neutral-1000">
              The information on our website, including text, photos, logo, etc., is for non-commercial use only.
            </strong>{" "}
            So, visitors are not allowed to copy, publish, display, release or sell any information, service, or product displayed on
            these pages without a written contract between us and the visitors.
          </>
        ),
      },
    ],
  },
  {
    title: "Newsletters",
    blocks: [
      {
        kind: "ul",
        items: [
          "When you provide your contact details such as email for inquiry, reservation, or booking, we may send you newsletters; however, you are always free to remove yourself from our mailing list.",
        ],
      },
    ],
  },
  {
    title: "Change on Policy",
    blocks: [{ kind: "ul", items: ["We may change the privacy policy from time to time, and this will be published on our page."] }],
  },
];

/**
 * Privacy Policy: breadcrumb, title, then each section as a heading with a
 * paragraph or a bookmark-star line. The wording follows the reference with
 * the company name changed to Joyful Trekking.
 */
export default function PrivacyPolicyPage() {
  return (
    <>
      <Reveal variant="auto">
        <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className="mx-auto w-full max-w-[900px]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[{ label: "Home", href: "/" }, { label: "Company" }, { label: "Privacy Policy" }]}
            />

            <h1 data-reveal="up" className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
              Privacy Policy
            </h1>

            {SECTIONS.map((section) => (
              <section key={section.title} data-reveal="up" className="mt-9">
                <h2 className="text-[clamp(20px,3.2vw,26px)] leading-tight font-semibold text-brand-neutral-900">{section.title}</h2>
                {section.blocks.map((block, index) =>
                  block.kind === "p" ? (
                    <p
                      key={index}
                      className={`mt-4 text-[16px] leading-[1.85] ${block.strong ? "font-semibold text-brand-neutral-1000" : "text-brand-neutral-800"}`}
                    >
                      {block.text}
                    </p>
                  ) : (
                    <ul key={index} className="mt-4 flex flex-col gap-3">
                      {block.items.map((item) => (
                        <li
                          key={item}
                          className="relative pl-10 text-[16px] leading-[1.7] text-brand-neutral-800 before:absolute before:top-0.5 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-['']"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}
          </div>
        </section>
      </Reveal>
      <CtaSection />
    </>
  );
}
