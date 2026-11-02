import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";

interface PageProps {
  searchParams: Promise<{ orderNo?: string; productDescription?: string; controllerInternalId?: string }>;
}

/**
 * Landing page PACO's own `failedURL` sends the browser to when a payment
 * attempt fails (see `payment-success/page.tsx`'s own comment for the
 * shared context — same query params, same "read-only landing screen,
 * not the source of truth" caveat). No charge was made — the booking
 * itself (created before payment was ever attempted, see
 * `CheckoutView.tsx`'s own doc comment) is unaffected.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: "Payment Failed", path: "/payment-failed", noIndex: true });
}

export default async function PaymentFailedPage({ searchParams }: PageProps) {
  const { orderNo, productDescription } = await searchParams;
  const description = productDescription?.replace(/\+/g, " ");

  return (
    <div className="mx-auto flex w-full max-w-160 flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-error-200 text-error-900">
        <CrossIcon className="size-8" />
      </span>
      <h1 className="font-poppins text-heading-2xl font-medium text-brand-neutral-1000">Payment didn&apos;t go through</h1>
      <p className="font-poppins text-body-l text-brand-neutral-700">
        {description ? (
          <>
            Your payment for <strong>{description}</strong> couldn&apos;t be completed.
          </>
        ) : (
          "Your payment couldn't be completed."
        )}
        {orderNo ? (
          <>
            {" "}
            Order reference <span className="font-medium text-brand-neutral-1000">{orderNo}</span>.
          </>
        ) : null}{" "}
        No charge was made. Your booking is still on file — you can try paying again, or contact us and we&apos;ll
        help you sort it out.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`https://wa.me/${siteConfig.phoneHref.replace(/[^\d]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-pill bg-secondary-500 px-6 py-3 font-poppins text-body-m font-medium text-white"
        >
          <WhatsAppIcon className="size-4" />
          WhatsApp us
        </a>
        <Link
          href="/"
          className="rounded-pill border border-primary-200 px-6 py-3 font-poppins text-body-m font-medium text-brand-neutral-800"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}

function CrossIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.7.44 3.36 1.29 4.82L2 22l5.4-1.41a9.87 9.87 0 0 0 4.64 1.18h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2Zm0 18.14h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}
