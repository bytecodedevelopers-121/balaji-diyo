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
 * Site footer: one navy panel with four blocks (logo + contact details,
 * Company links, Useful Links in two columns, newsletter), a divider, and
 * a bottom row (social icons, copyright, accepted payments). Colors come
 * from the logo palette (`--color-logo-*` in theme.css).
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

const STARS =
  "radial-gradient(1.5px 1.5px at 6% 18%,#fff 99%,transparent),radial-gradient(1px 1px at 94% 30%,#fff 99%,transparent),radial-gradient(1.5px 1.5px at 3% 70%,#cfe9ff 99%,transparent),radial-gradient(1px 1px at 97% 78%,#fff 99%,transparent),radial-gradient(1px 1px at 48% 8%,#fff 99%,transparent)";

const LINK_CLASS =
  "text-[16px] text-brand-neutral-100 transition-colors hover:text-logo-sun focus-visible:outline-2 focus-visible:outline-logo-sun";

function LinkList({ links }: { links: FooterColumn["links"] }) {
  return (
    <ul className="flex flex-col gap-[18px]">
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
    <footer>
      <div
        className="relative bg-logo-navy-dark px-4 pt-14 pb-40 text-brand-neutral-000 sm:px-6 md:px-10 lg:pb-10 min-[1120px]:px-[72px]"
        style={{ backgroundImage: STARS }}
      >
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 min-[768px]:grid-cols-2 min-[1120px]:grid-cols-[1.3fr_0.85fr_1.55fr_1.2fr] min-[1120px]:gap-8">
          <div>
            <Link href="/" aria-label={`${siteName} — Home`} className="flex w-fit items-center gap-3">
              <span className="rounded-full ring-[3px] ring-brand-neutral-000">
                <Logo size="lg" />
              </span>
              <span className="text-[17px] leading-tight font-bold tracking-wide uppercase">{siteName}</span>
            </Link>

            <ul className="mt-7 flex flex-col gap-4 text-[16px] text-brand-neutral-100">
              {address ? (
                <li className="flex items-start gap-3">
                  <PinIcon className="mt-1 size-5 shrink-0 text-logo-sun" />
                  <span>{address}</span>
                </li>
              ) : null}
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-3 hover:text-logo-sun">
                  <MailIcon className="size-5 shrink-0 text-logo-sun" />
                  {email}
                </a>
              </li>
              {officePhone ? (
                <li>
                  <a href={officePhone.href} className="flex items-center gap-3 hover:text-logo-sun">
                    <PhoneIcon className="size-5 shrink-0 text-logo-sun" />
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
                    className="flex items-center gap-3 hover:text-logo-sun"
                  >
                    <WhatsAppGlyph className="size-5 shrink-0 text-logo-sun" />
                    {mobile.label} (WhatsApp)
                  </a>
                </li>
              ) : null}
              <li className="flex items-center gap-3">
                <Clock aria-hidden="true" className="size-5 shrink-0 text-logo-sun" />
                10:00 AM to 5:00 PM (Sunday to Friday)
              </li>
            </ul>
          </div>

          {companyColumn ? (
            <div>
              <p className="text-[26px] leading-tight font-semibold">Company</p>
              <div className="mt-7">
                <LinkList links={companyColumn.links} />
              </div>
            </div>
          ) : null}

          {usefulColumns.length > 0 ? (
            <div>
              <p className="text-[26px] leading-tight font-semibold">Useful Links</p>
              <div className="mt-7 grid grid-cols-1 gap-x-8 gap-y-[18px] sm:grid-cols-2">
                {usefulColumns.map((column) => (
                  <LinkList key={column.title} links={column.links} />
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-[26px] leading-tight font-semibold">Subscribe Our Newsletter</p>
            <p className="mt-1 text-[16px] text-brand-neutral-100">Get travel deals and news right to your inbox.</p>
            <form className="mt-5 flex flex-col gap-3">
              <label className="sr-only" htmlFor="newsletter-name">
                Your name
              </label>
              <input
                id="newsletter-name"
                type="text"
                placeholder="Enter your name"
                autoComplete="name"
                className="h-[60px] w-full rounded-[4px] bg-white/10 px-5 text-[15px] text-brand-neutral-000 placeholder:text-brand-neutral-300 focus:outline-2 focus:outline-logo-sun"
              />
              <label className="sr-only" htmlFor="newsletter-email">
                Your email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                className="h-[60px] w-full rounded-[4px] bg-white/10 px-5 text-[15px] text-brand-neutral-000 placeholder:text-brand-neutral-300 focus:outline-2 focus:outline-logo-sun"
              />
              <button
                type="submit"
                className="mt-1 h-[55px] w-fit rounded-[4px] bg-logo-sun px-9 text-[16px] font-semibold text-logo-navy-dark transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-neutral-000"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-12 w-full max-w-[1440px] border-t border-white/15 pt-8">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
            <nav aria-label="Social">
              <p className="text-[18px] font-medium text-brand-neutral-200">Connect with Us</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label}
                      className="flex items-center justify-center transition-opacity hover:opacity-80"
                    >
                      <SocialIcon platform={link.label} className="size-9" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="text-center text-[14px] text-brand-neutral-200">
              <p>
                &copy; {year}, {siteName}. All Rights Reserved.
              </p>
              <p className="mt-2 text-brand-neutral-300">
                Nepal Govt. Regd. No: 88177/068/069 | Tourism Regd. No: 1509
              </p>
            </div>

            <div className="md:justify-self-end">
              <p className="text-[18px] font-medium text-brand-neutral-200">We Accept</p>
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
                  className="h-9 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
