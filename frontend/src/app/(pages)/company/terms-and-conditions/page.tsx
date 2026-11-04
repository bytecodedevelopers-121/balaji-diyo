import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms and Conditions",
  description:
    "Joyful Trekking's booking terms: trip booking, prices, deposits, payment methods, cancellation, passports and visas, risk and use of photos.",
  path: "/company/terms-and-conditions",
});

/**
 * One piece of a section: a paragraph (`strong` = bold lead paragraph), a
 * bookmark-star list (`strongFirst` = the first item is the bold lead item),
 * a sub-heading, or a small "Notes:" label.
 */
type Block =
  | { kind: "p"; text: ReactNode; strong?: boolean }
  | { kind: "ul"; items: string[]; strongFirst?: boolean }
  | { kind: "h3"; text: string }
  | { kind: "label"; text: string };

interface Section {
  title: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
  {
    title: "The Agreements",
    blocks: [
      {
        kind: "p",
        text: (
          <>
            We always encourage you to read the terms and conditions carefully before booking any trips with Joyful Trekking Pvt. Ltd. By
            submitting the booking form, you agree to be bound by the conditions of the terms, and please go through the following Terms
            and Conditions that govern the{" "}
            <strong className="text-brand-neutral-1000">
              relationship between you (Client) and Joyful Trekking Pvt. Ltd. (from now on referred to as &quot;The Company&quot;)
            </strong>
            , both parties agree to these Terms and Conditions to resolve any legal or other disputes that may arise during the trip.
          </>
        ),
      },
    ],
  },
  {
    title: "Trip Booking",
    blocks: [
      {
        kind: "ul",
        strongFirst: true,
        items: [
          "A 'trip' refers to any product itinerary or activities listed on our official website that you buy from us, including Trekking, Hiking, Tours, Expeditions, and other adventure tour programs.",
          "A booking is accepted and becomes definite only when the Company sends a confirmation email; afterward, the contract between the Company and the Client exists.",
          "Before your trip is confirmed and a contract comes into force, the Company reserves the right to increase or decrease prices.",
          "Please note that the Company would not be liable for any warranty, collateral agreement, prior agreement, description of services, or conditions other than as expressed herein.",
        ],
      },
    ],
  },
  {
    title: "Trip Prices/Cost",
    blocks: [
      {
        kind: "ul",
        items: [
          "The price/cost of every trip is on our trip package pages, and they are valid to book and pay the deposit in full.",
          "Most trip costs are based on the number of people booking, and the group price applies to your travel group only. Our calculator automatically calculates the cost when you enter the number of people when you are making a booking.",
          "We still honor the group price if some of your people make a separate booking (however, it should be informed at the time of booking). For example, two of you booked the trip already, and you learned that some of your friends also want to join you later and become 5, 6, or more.",
          "The group price does not apply to an individual booking. For example, one individual makes a booking first, and later, another individual, couple, group of friends, or family makes a booking for the same trip and date. They pay the cost based on the number of people, and all travelers travel together. So, remember that each traveler may have spent a different price for the same trip and services.",
        ],
      },
    ],
  },
  {
    title: "Deals, Offers, Coupon, and Discounts",
    blocks: [
      {
        kind: "ul",
        items: [
          "We offer deals, offers, coupons and discounts on our trips. We may offer discounts on particular dates, mostly when we have a minimum number of travelers to run the trip.",
          "We also have early bird offers, last-minute offers and seasonal offers.",
          "So, know that different travelers may have paid a different price for the same trip and services and traveling in the same group.",
        ],
      },
    ],
  },
  {
    title: "Deposit Requirement to book a trip",
    blocks: [
      { kind: "h3", text: "Nepal Trips" },
      {
        kind: "ul",
        items: [
          "You have to make a deposit payment (the deposit amount is different for different trips as some trips require 20%, some 50%, and some 100%, and the required deposit amount is calculated when you select a trip and date, and book at the time of booking).",
          "The remaining amount is payable upon your arrival in Kathmandu, Nepal, and before the trip departs from Kathmandu. We email you a payment link with the required amount and instructions for the customized trips.",
        ],
      },
      { kind: "h3", text: "Tibet/Bhutan Trips" },
      {
        kind: "ul",
        items: [
          "For the booking of Tibet and Bhutan trips, you must pay 50% of the trip cost at the time of booking, or some trips may need to be paid in full. So, confirm by email before paying online, and the balance of 50% must be paid 30 days before the trip departure.",
        ],
      },
    ],
  },
  {
    title: "Payment Methods",
    blocks: [
      { kind: "h3", text: "Online Payment by Cards" },
      {
        kind: "ul",
        items: [
          "You can pay online to book your trip to Nepal, and you must make the 10%, 50%, or 100% payment in advance to confirm the trip (the required payment is calculated when you book the trips). Or, we will suggest it to you via email once the trip is finalized.",
        ],
      },
      { kind: "h3", text: "Payment by Bank Swift Transfer" },
      {
        kind: "p",
        text: (
          <>
            You can also pay the deposit through a Swift bank transfer. Our bank details for the bank transfer are on the{" "}
            <Link href="/banking-details" className="font-semibold text-logo-navy underline">
              Banking Details
            </Link>{" "}
            page.
          </>
        ),
      },
      { kind: "label", text: "Notes:" },
      {
        kind: "ul",
        items: [
          "The clients themselves should pay the bank service charge at the time of deposit.",
          "Please note that we are not liable for any delay or loss during the transfer process, in the case due to the use of a mediator bank or any other reasons. If the money we received is less than the amount you sent, you are requested to pay the remaining balance upon arrival.",
          "Email us the bank reference number or remittance slips after you initiate the transfer; the bank forwards the money with a different name, and if we have the reference number/remittance slips and sender details, we can quickly check.",
        ],
      },
    ],
  },
  {
    title: "Final Payments",
    blocks: [
      { kind: "h3", text: "Nepal Trips" },
      {
        kind: "p",
        text: "The balance is paid upon arrival in Nepal before the trip starts. It can be paid by cash, credit card (Visa or Master Card), or American Express, and there is a 4% card processing fee when payment is by card (this applies to all costs, final balances, and trip extensions). We strongly recommend you bring cash USD or any other convertible foreign currency for your final payment to avoid this extra tax.",
      },
      { kind: "h3", text: "Tibet and Bhutan Trips" },
      {
        kind: "p",
        text: "The final payment for Tibet and Bhutan trips should be paid 30 days prior to the trip date. It can be paid by bank transfer or credit card (Visa or Master Card); the credit card costs 4% extra card processing fees.",
      },
    ],
  },
  {
    title: "Trip Cancellation by Clients (You)",
    blocks: [
      {
        kind: "p",
        strong: true,
        text: "Any cancellation by a client must be made in writing and acknowledged by the Company; on the date the Company receives the request to cancel, the Company determines the applicable cancellation charge.",
      },
      {
        kind: "ul",
        items: [
          "Cancellation of Nepal trips: more than 60 days prior: 20%",
          "Cancellation of Nepal trips: 60 to 7 days prior: 50%",
          "Cancellation of Nepal trips: 6 to 2 days prior: 75%",
          "Cancellation of Nepal trips: less than 2 days and once the trip has started: 100%",
          "Cancellation of Tibet and Bhutan trips: 60 days or more before departure: 50%",
          "Cancellation of Tibet and Bhutan trips: 60 days or less before departure: 100%",
        ],
      },
      { kind: "label", text: "Notes:" },
      {
        kind: "ul",
        items: [
          "The third-party policy will be applied if you have booked any trip (Nepal, Bhutan, Tibet) through other sites or third parties.",
          "The Client is strongly advised to buy an insurance policy that covers trip cancellation.",
          "No refunds if you voluntarily leave a trip for any reason after the trip has begun; no refunds are made for any accommodation, transport, sightseeing, meals, or services not utilized on trips.",
          "We take last-minute bookings till one day before the trip date for Nepal trips and 10 days prior for Bhutan and Tibet trips (depending on availability); you need to finalize the journey through communication and make full payment for booking the tour in these cases.",
        ],
      },
    ],
  },
  {
    title: "Cancellation of a Trip by the Company (Us)",
    blocks: [
      {
        kind: "p",
        text: (
          <>
            <strong className="text-brand-neutral-1000">
              Joyful Trekking Pvt. Ltd. reserves the right to cancel any trip, including a guaranteed trip, before departure due to
              reasons that are beyond our control (i.e., due to natural disasters, flight cancellation, consequences of strikes,
              industrial action, wars, riots, sickness, quarantine, government intervention, weather conditions, or other untoward
              occurrences.)
            </strong>{" "}
            In such a case, Joyful Trekking refunds the price after deducting the cost (10% for Nepal trips and 50% for Bhutan and Tibet
            trips) that has already been spent to prepare your trips.
          </>
        ),
      },
    ],
  },
  {
    title: "Passport and Visas",
    blocks: [
      {
        kind: "p",
        text: (
          <>
            <strong className="text-brand-neutral-1000">You must have a valid passport with at least six months validity from the return date from Nepal;</strong>{" "}
            Nepalese visas can be obtained from the Nepalese embassies or consulates in your country, or online upon arrival at
            Kathmandu Airport.
          </>
        ),
      },
    ],
  },
  {
    title: "Complaints",
    blocks: [
      {
        kind: "p",
        text: "If you have complaints about the trip, you must tell the operator/leader/guide as soon as possible, and then he will take the appropriate action.",
      },
    ],
  },
  {
    title: "Acceptance of Risk",
    blocks: [
      {
        kind: "p",
        text: "We are committed to providing the best services by performing our duties honestly and seriously to make your journey very smooth and successful. However, Joyful Trekking Pvt. Ltd. and its related organizations shall not be responsible for any changes in the itinerary due to unavoidable circumstances beyond our control, such as government restriction, landslide, road blockage, flood, snow, political unrest, cancellation of flight, delay, sickness or accident, and the nature of some of our trips is adventurous and risky as well, therefore may involve a personal risk. We want to inform you that you must take all risks on yourself, such as damages, injuries, or death resulting from these inherent risks.",
      },
    ],
  },
  {
    title: "Use of Photos and Videos",
    blocks: [
      {
        kind: "ul",
        items: [
          "Our guide, staff, or photographer may take photos and videos during your trip, and we may use those materials to promote our business through our website and social media.",
        ],
      },
      { kind: "label", text: "Notes:" },
      {
        kind: "ul",
        strongFirst: true,
        items: [
          "The laws of Nepal govern the above terms and conditions. We (Joyful Trekking Pvt. Ltd.) are located in Kathmandu, Nepal. So, any dispute arising out of these terms and conditions will be solved by the District Court, High Court, and Supreme Court of Nepal.",
          "There will not be a case in a foreign country, and the parties agree that the court of Nepal is the appropriate forum for any claim or dispute arising out of these terms and conditions.",
        ],
      },
    ],
  },
];

const STAR_ITEM =
  "relative pl-10 text-[16px] leading-[1.7] before:absolute before:top-0.5 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-['']";

function renderBlock(block: Block, index: number) {
  switch (block.kind) {
    case "p":
      return (
        <p
          key={index}
          className={`mt-4 text-[16px] leading-[1.85] ${block.strong ? "font-semibold text-brand-neutral-1000" : "text-brand-neutral-800"}`}
        >
          {block.text}
        </p>
      );
    case "h3":
      return (
        <h3 key={index} className="mt-6 text-[20px] leading-tight font-semibold text-brand-neutral-900">
          {block.text}
        </h3>
      );
    case "label":
      return (
        <p key={index} className="mt-6 text-[15px] font-semibold text-brand-neutral-1000">
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul key={index} className="mt-4 flex flex-col gap-3">
          {block.items.map((item, i) => (
            <li
              key={item}
              className={`${STAR_ITEM} ${block.strongFirst && i === 0 ? "font-semibold text-brand-neutral-1000" : "text-brand-neutral-800"}`}
            >
              {item}
            </li>
          ))}
        </ul>
      );
  }
}

/**
 * Terms and Conditions: breadcrumb, title, then each section (The Agreements,
 * Trip Booking, Prices, Deposits, Payment, Cancellation, Visas, Risk, Photos)
 * as a heading with paragraphs and bookmark-star lists. The wording follows the
 * reference with the company name changed to Joyful Trekking; the bank account
 * details live on the Banking Details page instead of being repeated here.
 */
export default function TermsAndConditionsPage() {
  return (
    <>
      <Reveal variant="auto">
        <section className="bg-brand-neutral-000 px-4 pt-6 pb-16 min-[768px]:px-10 min-[1120px]:px-[72px]">
          <div className="mx-auto w-full max-w-[900px]">
            <Breadcrumbs
              tone="dark"
              className="[&_ol]:justify-start"
              items={[{ label: "Home", href: "/" }, { label: "Company" }, { label: "Terms and Conditions" }]}
            />

            <h1 data-reveal="up" className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">
              Terms and Conditions
            </h1>

            {SECTIONS.map((section) => (
              <section key={section.title} data-reveal="up" className="mt-9">
                <h2 className="text-[clamp(22px,3.5vw,28px)] leading-tight font-semibold text-brand-neutral-900">{section.title}</h2>
                {section.blocks.map(renderBlock)}
              </section>
            ))}
          </div>
        </section>
      </Reveal>
      <CtaSection />
    </>
  );
}
