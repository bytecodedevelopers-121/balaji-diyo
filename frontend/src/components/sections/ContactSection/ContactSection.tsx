import { footerOffices } from "@/config/navigation";
import { socialLinks } from "@/config/social-links";
import { MailIcon, PhoneIcon, PinIcon, SocialIcon } from "@/components/ui/ContactIcons";
import { ContactForm } from "./ContactForm";

/**
 * /contact page's main section — the "We're here to assist you..."
 * contact-info column plus the enquiry form card (design-references/
 * contact.png, y≈699–1258 at 1440px; see contact-mobile.png for the
 * stacked mobile order: info column, then form card).
 *
 * White background, NOT the solid black band it first appears to be in
 * contact.png — that PNG's export has a transparent hole behind this
 * whole region (confirmed via the file's own alpha channel: pixels
 * here read RGBA (0,0,0,0), not opaque black), and Figma's own
 * `get_design_context` render for this exact node (2001:6648, file
 * tClntpewa7VwaYU4sbo2cj) comes back on a plain white canvas with dark
 * text (#050505 heading, #6B6B6B body) — treated as the authoritative
 * source over the flattened screenshot's rendering artifact.
 *
 * Phone/email/address reuse `footerOffices[0]` (the same Nepal Head
 * Office entry the footer renders) rather than re-typing the same real
 * numbers a second time; only the layout (two phone numbers joined by
 * "|" on one line) is this section's own, per the design.
 */
export function ContactSection() {
  const nepalOffice = footerOffices[0]!;
  const [firstPhone, secondPhone, thirdPhone] = nepalOffice.phones;

  return (
    <section className="relative isolate overflow-hidden bg-brand-neutral-000 py-11">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-6 md:px-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative order-2 flex w-full max-w-[462px] flex-col items-start gap-3 lg:order-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative Figma export (2001:6649), not a next/image content image */}
          <img
            src="/images/contact/stupa-illustration.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-8 left-1/2 -z-10 w-[320px] max-w-none -translate-x-1/2 select-none lg:top-[-180px] lg:left-[-40px] lg:w-[600px] lg:translate-x-0"
          />
          <p className="font-poppins text-[22px] leading-[35.2px] font-medium text-brand-neutral-1000">
            We&apos;re here to assist you with every step of your journey.
          </p>

          <div className="flex items-center gap-3">
            <PhoneIcon className="size-[18px] shrink-0 text-brand-neutral-800" />
            <a
              href={firstPhone?.href}
              className="font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-800 hover:text-brand-neutral-1000"
            >
              {firstPhone?.label}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PhoneIcon className="size-[18px] shrink-0 text-brand-neutral-800" />
            <a
              href={secondPhone?.href}
              className="font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-800 hover:text-brand-neutral-1000"
            >
              {secondPhone?.label}
            </a>
            <span className="font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-800">
              |
            </span>
            <a
              href={thirdPhone?.href}
              className="font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-800 hover:text-brand-neutral-1000"
            >
              {thirdPhone?.label}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <MailIcon className="size-[18px] shrink-0 text-brand-neutral-800" />
            <a
              href={`mailto:${nepalOffice.email}`}
              className="font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-800 hover:text-brand-neutral-1000"
            >
              {nepalOffice.email}
            </a>
          </div>
          <div className="flex items-start gap-3">
            <PinIcon className="mt-0.5 size-[18px] shrink-0 text-brand-neutral-800" />
            <p className="font-poppins text-[16px] leading-[25.6px] font-medium text-brand-neutral-800">
              {nepalOffice.address}
            </p>
          </div>

          <nav aria-label="Social" className="flex items-center gap-3 py-6">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="transition-opacity hover:opacity-70"
              >
                <SocialIcon platform={link.label} className="size-8" />
              </a>
            ))}
          </nav>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
