import Link from "next/link";
import { Clock } from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  footerColumns as staticFooterColumns,
  footerOffices,
  type FooterColumn,
} from "@/config/navigation";
import { socialLinks as staticSocialLinks, type SocialLink } from "@/config/social-links";
import { MailIcon, PhoneIcon, PinIcon, SocialIcon } from "@/components/ui/ContactIcons";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppGlyph } from "@/components/ui/WhatsAppButton";
import { toTelHref } from "@/features/site-settings/lib/to-tel-href";
import type { SiteSettings } from "@/features/site-settings/types/site-settings.types";

/**
 * Site footer on a warm cream background. Top row: logo (left) and the
 * newsletter (right); then a divider, Company / Useful Links (two columns) /
 * contact details, a social + payments row, the copyright line, and a large
 * faded brand-name watermark over soft pink/yellow glows.
 *
 * The newsletter form is rendered but inert (no submit handler) — there's
 * no subscription API yet.
 */
interface FooterProps {
  /**
   * Real, admin-editable columns fetched server-side via
   * `features/navigation/lib/build-navigation.ts`'s `getFooterNavData()`.
   * Defaults to `config/navigation.ts`'s static content. Column 1 becomes
   * "Company"; columns 2 and 3 are shown side by side under "Useful Links".
   */
  footerColumns?: FooterColumn[];
  /** Copyright-line company name. */
  siteName?: string;
  /** Real social profile URLs (from Global Settings), else the static placeholders. */
  socialLinks?: SocialLink[];
  /** Admin-managed Nepal office details from Global Settings. */
  siteSettings?: SiteSettings;
}

const LINK_CLASS =
  "text-[13px] text-brand-neutral-800 transition-colors hover:text-logo-navy focus-visible:outline-2 focus-visible:outline-logo-sun";

const INPUT_CLASS =
  "h-10 w-full rounded-[10px] border border-[#e7dfd2] bg-white px-4 text-[13px] text-brand-neutral-900 placeholder:text-brand-neutral-700 focus:outline-2 focus:outline-logo-sun";

const HEADING_CLASS = "text-[16px] leading-tight font-bold text-logo-navy-dark";

function LinkList({ links }: { links: FooterColumn["links"] }) {
  return (
    <ul className="flex flex-col gap-3">
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} className={LINK_CLASS}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer({
  footerColumns = staticFooterColumns,
  siteName = siteConfig.name,
  socialLinks = staticSocialLinks,
  siteSettings,
}: FooterProps) {
  const year = new Date().getFullYear();
  const brandName = siteName.replace(/\s+pvt\.?\s*ltd\.?$/i, "");
  const office = footerOffices[0]!;

  const address = siteSettings?.address || office.address;
  const email = siteSettings?.email || office.email;
  const mobile = siteSettings
    ? { label: siteSettings.mobile, href: toTelHref(siteSettings.mobile) }
    : office.phones[0];
  const officePhone = siteSettings
    ? { label: siteSettings.phone, href: toTelHref(siteSettings.phone) }
    : office.phoneGroups?.[0]?.phones[0];

  const [companyColumn, ...otherColumns] = footerColumns;
  const usefulColumns = otherColumns.slice(0, 2);

  return (
    <footer className="relative overflow-hidden bg-[#faf5ee] text-brand-neutral-900">
      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-4 pt-14 sm:px-6 min-[1120px]:px-0">
        <section className="flex flex-col gap-6 rounded-[28px] border border-[#efe6da] bg-white/60 px-6 py-8 sm:px-8 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
          <div className="max-w-[340px]">
            <h2 className="text-[22px] leading-tight font-bold text-logo-navy-dark">Get travel deals in your inbox</h2>
            <p className="mt-2 text-[13px] text-brand-neutral-800">
              Trek news, seasonal offers and new itineraries. No spam, unsubscribe anytime.
            </p>
          </div>
          <form className="flex flex-1 flex-col gap-3 sm:flex-row min-[900px]:max-w-[600px]">
            <label className="sr-only" htmlFor="newsletter-name">
              Your name
            </label>
            <input id="newsletter-name" type="text" placeholder="Your name" autoComplete="name" className={INPUT_CLASS} />
            <label className="sr-only" htmlFor="newsletter-email">
              Your email address
            </label>
            <input id="newsletter-email" type="email" placeholder="Your email" autoComplete="email" className={INPUT_CLASS} />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-[10px] bg-logo-sun px-6 text-[13px] font-bold text-logo-navy-dark transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-logo-navy"
            >
              Subscribe
            </button>
          </form>
        </section>

        <div className="mt-12 grid gap-10 pb-12 min-[768px]:grid-cols-2 min-[1120px]:grid-cols-[1.45fr_0.8fr_1.5fr]">
          {companyColumn ? (
            <div>
              <p className={HEADING_CLASS}>Company</p>
              <div className="mt-6">
                <LinkList links={companyColumn.links} />
              </div>
            </div>
          ) : null}

          {usefulColumns.length > 0 ? (
            <div>
              <p className={HEADING_CLASS}>Useful Links</p>
              <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {usefulColumns.map((column) => (
                  <LinkList key={column.title} links={column.links} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="min-[1120px]:order-first">
            <Link href="/" aria-label={`${siteName} — Home`} className="flex w-fit items-center gap-3">
              <span className="shrink-0 rounded-full ring-[3px] ring-brand-neutral-000">
                <Logo size="lg" />
              </span>
              <span className="text-[14px] leading-tight font-bold text-logo-navy-dark">
                {siteName}
                <span className="block text-[11px] font-normal text-logo-navy">Kathmandu, Pokhara and Everest, Nepal</span>
              </span>
            </Link>
            <ul className="mt-6 flex flex-col gap-4 text-[13px] text-brand-neutral-900">
              {address ? (
                <li className="flex items-start gap-3">
                  <PinIcon className="mt-0.5 size-4 shrink-0 text-[#d64545]" />
                  <span>{address}</span>
                </li>
              ) : null}
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-3 hover:text-logo-navy">
                  <MailIcon className="size-4 shrink-0 text-[#d64545]" />
                  {email}
                </a>
              </li>
              {officePhone ? (
                <li>
                  <a href={officePhone.href} className="flex items-center gap-3 hover:text-logo-navy">
                    <PhoneIcon className="size-4 shrink-0 text-[#d64545]" />
                    {officePhone.label} (Office)
                  </a>
                </li>
              ) : null}
              {mobile ? (
                <li>
                  <a
                    href={`https://wa.me/${mobile.href.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-logo-navy"
                  >
                    <WhatsAppGlyph className="size-4 shrink-0 text-[#d64545]" />
                    {mobile.label} (WhatsApp)
                  </a>
                </li>
              ) : null}
              <li className="flex items-center gap-3">
                <Clock aria-hidden="true" className="size-4 shrink-0 text-[#d64545]" />
                10:00 AM to 5:00 PM (Sunday to Friday)
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-[#e7dfd2] pt-7 min-[640px]:flex-row min-[640px]:items-end min-[640px]:justify-between">
          <nav aria-label="Social">
            <p className="text-[12px] font-semibold text-brand-neutral-800">Connect with us</p>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                    className="flex items-center justify-center transition-opacity hover:opacity-80"
                  >
                    <SocialIcon platform={link.label} className="size-10" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[12px] font-semibold text-brand-neutral-800 min-[640px]:text-right">We accept</p>
            <Link
              href="/online-payment"
              aria-label="Make a secure payment"
              className="mt-3 block w-fit transition-opacity hover:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static payment marks */}
              <img
                src="/images/footer/payment-methods.png"
                alt="Accepted payment methods: American Express, Mastercard, Visa, UnionPay, and Google Pay"
                loading="lazy"
                className="h-7 w-auto"
              />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-[#e7dfd2] pt-5 text-[11px] text-logo-navy min-[768px]:flex-row min-[768px]:justify-between">
          <p>
            &copy; {year} {siteName}. All rights reserved. Made with joy in Kathmandu.
          </p>
          <p>Nepal Govt. Regd. No: 88177/068/069 | Tourism Regd. No: 1509</p>
        </div>
      </div>

      {/* Faded brand watermark over soft pink / yellow glows. */}
      <div aria-hidden="true" className="relative mt-4 overflow-hidden pb-[0.1em] text-[clamp(56px,13vw,190px)] select-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 45% 70% at 15% 100%, rgba(247,168,184,0.85), transparent 70%), radial-gradient(ellipse 45% 70% at 88% 100%, rgba(250,214,110,0.8), transparent 70%)",
          }}
        />
        <p className="font-display relative text-center text-[1em] leading-[1.2] font-extrabold whitespace-nowrap text-[#8a6f4d]/20">
          {brandName}
        </p>
      </div>
    </footer>
  );
}
