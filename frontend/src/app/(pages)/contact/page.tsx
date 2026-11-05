import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ContactMapSection } from "@/components/sections/ContactMapSection";
import { ContactUsForm } from "@/components/sections/ContactSection/ContactUsForm";
import { CtaSection } from "@/components/sections/CtaSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { footerOffices } from "@/config/navigation";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description: "Have questions or need assistance? Contact Joyful Trekking: address, phone, WhatsApp, email, opening hours and our enquiry form.",
  path: "/contact",
});

const STAR_ITEM =
  "relative pl-9 text-[13px] leading-[1.7] text-brand-neutral-1000 before:absolute before:top-0 before:left-0 before:size-6 before:bg-[url('/icons/star-bookmark.svg')] before:bg-contain before:bg-no-repeat before:content-['']";

function InfoIcon({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-white text-[#064a70]">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <InfoIcon>{icon}</InfoIcon>
      <div className="text-[12px] leading-[1.7] text-white">
        <p className="text-[13px] font-semibold">{label}</p>
        {children}
      </div>
    </div>
  );
}

/** Contact Us: opening hours, a navy contact-details card beside the enquiry form, and the office map. */
export default function ContactPage() {
  const office = footerOffices[0]!;
  const phone = office.phoneGroups?.find((group) => group.label === "Phone")?.phones ?? [];
  const mobile = office.phoneGroups?.find((group) => group.label === "Mobile")?.phones[0] ?? office.phones[0];

  return (
    <>
      <section className="bg-brand-neutral-000 px-4 pt-6 pb-10 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[780px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
          />
          <h1 className="mt-6 font-display text-[clamp(30px,5vw,44px)] leading-tight font-bold text-brand-neutral-1000">Contact Us</h1>
          <p className="mt-4 text-[18px] font-semibold text-brand-neutral-1000">Have questions or need assistance? Contact us today!</p>

          <p className="mt-4 text-[13px] font-semibold text-brand-neutral-1000">We are Opened</p>
          <ul className="mt-3">
            <li className={STAR_ITEM}>Sunday to Friday (10:00 AM to 5:00 PM)</li>
          </ul>

          <p className="mt-5 text-[13px] font-semibold text-brand-neutral-1000">Sales and Operation</p>
          <ul className="mt-3">
            <li className={STAR_ITEM}>{mobile?.label} (24/7)</li>
          </ul>

          <p className="mt-12 text-[20px] font-medium text-brand-neutral-1000">{office.company}</p>

          <div className="mt-4 grid items-stretch lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="bg-[#064a70] p-8 lg:mt-0">
              <div className="flex flex-col gap-6">
                <InfoRow
                  label="Address"
                  icon={
                    <>
                      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
                      <circle cx="12" cy="9.5" r="2.5" />
                    </>
                  }
                >
                  <p>{office.address}</p>
                </InfoRow>
                {phone.length > 0 ? (
                  <InfoRow label="Phone" icon={<path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.5.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.5 1 1 0 0 1-.25 1z" />}>
                    {phone.map((item) => (
                      <p key={item.href}>
                        <a href={item.href} className="hover:underline">
                          {item.label}
                        </a>
                      </p>
                    ))}
                  </InfoRow>
                ) : null}
                {mobile ? (
                  <InfoRow
                    label="Mobile/WhatsApp/Viber"
                    icon={
                      <>
                        <path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20z" />
                        <path d="M9 9.5c.5 2.2 2.3 4 4.5 4.5l1.2-1.2-1.8-.9-.7.6a3.6 3.6 0 0 1-1.7-1.7l.6-.7-.9-1.8L9 9.5z" />
                      </>
                    }
                  >
                    <p>
                      <a href={mobile.href} className="hover:underline">
                        {mobile.label}
                      </a>
                    </p>
                  </InfoRow>
                ) : null}
                <InfoRow
                  label="Email"
                  icon={
                    <>
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3.5 7 8.5 6 8.5-6" />
                    </>
                  }
                >
                  <p>
                    <a href={`mailto:${office.email}`} className="hover:underline">
                      {office.email}
                    </a>
                  </p>
                </InfoRow>
                <InfoRow
                  label="Opening Hours"
                  icon={
                    <>
                      <circle cx="12" cy="12" r="8.5" />
                      <path d="M12 7.5V12l3 2" />
                    </>
                  }
                >
                  <p>10:00 AM to 5:00 PM (Sunday to Friday)</p>
                </InfoRow>
              </div>
            </div>

            <div className="bg-[#dfe6ee] p-8 lg:-mt-12 lg:pt-12">
              <ContactUsForm />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-neutral-000 px-4 pb-14 min-[768px]:px-10 min-[1120px]:px-[72px]">
        <div className="mx-auto w-full max-w-[880px]">
          <h2 className="mb-4 text-[24px] font-semibold text-brand-neutral-1000">Our Location</h2>
          <ContactMapSection />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
