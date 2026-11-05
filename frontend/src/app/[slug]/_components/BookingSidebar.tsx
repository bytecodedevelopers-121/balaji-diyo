"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setTawkVisible } from "@/components/analytics/TawkChat";
import type { PackageDetail } from "../data";
import { useBookingFlow } from "./booking-flow-context";
import { DownloadPdfButton } from "./DownloadPdfButton";

/**
 * Sticky price sidebar: a navy "Price from" card with the group-discount tiers,
 * then Join Upcoming Departure / Check Availability / Send Inquiry actions, the
 * group-cost note and quick links. Check Availability opens the /book-now
 * booking page (first departure, 1 traveler) and Send Inquiry opens the enquiry form.
 *
 * Below `md` the card scrolls away inline with the page, so `<MobileBookingBar>`
 * renders a second, viewport-fixed Trip Enquiry / Book Now bar that stays
 * reachable; `PackageDetailView` pads the page bottom so it doesn't cover the
 * last section. Tawk chat is hidden on mobile here (see the effect below).
 */
export function BookingSidebar({ trip }: { trip: PackageDetail }) {
  const [departureDate] = useState(
    trip.departures[0]?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [stickyTop, setStickyTop] = useState(60); // ~ old `md:top-15` fallback before the first measurement
  const { openBooking, openEnquiry } = useBookingFlow();
  const router = useRouter();

  function goToBookingPage() {
    const params = new URLSearchParams({ date: departureDate, adults: "1" });
    router.push(`/book-now/${trip.slug}?${params.toString()}`);
  }

  // Same overlap problem as TabNav (see its own comment): a fixed
  // `top` offset here was tuned for the header alone, so once the tab
  // nav also reappears below the header on an upward scroll, this
  // card's sticky position starts underneath both of them. Stick just
  // below the tab nav's actual rendered position (with a little
  // breathing room) instead of a fixed guess, so it tracks whatever
  // the header + tab nav are doing.
  useEffect(() => {
    const tabNav = document.getElementById("trip-tab-nav");
    const header = document.getElementById("site-header");
    if (!tabNav) return;

    function syncStickyTop() {
      setStickyTop(Math.max(0, tabNav!.getBoundingClientRect().bottom) + 16);
    }

    syncStickyTop();
    window.addEventListener("scroll", syncStickyTop, { passive: true });
    window.addEventListener("resize", syncStickyTop);
    header?.addEventListener("transitionend", syncStickyTop);
    return () => {
      window.removeEventListener("scroll", syncStickyTop);
      window.removeEventListener("resize", syncStickyTop);
      header?.removeEventListener("transitionend", syncStickyTop);
    };
  }, []);

  // Tawk's floating launcher sits in the same bottom corner
  // `MobileBookingBar` occupies on mobile (its `yOffset` in
  // `TawkChat.tsx` only clears the bar's height, not its buttons), and
  // this page already surfaces its own Trip Enquiry contact path — so
  // hide the chat bubble on mobile specifically here, restoring it on
  // unmount/at `md` and up where the bar itself isn't rendered.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setTawkVisible(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      setTawkVisible(true);
    };
  }, []);

  return (
    <>
      <MobileBookingBar
        onEnquiry={openEnquiry}
        onBookNow={() =>
          openBooking({
            departureDate,
            adults: 1,
            addOnLabels: [],
          })
        }
      />
      <aside style={{ top: stickyTop }} className="md:sticky">
        <div className="overflow-hidden rounded-md bg-[#064a70] text-white shadow-card-strong">
          <div className="px-6 pt-6 pb-5">
            <p className="text-[19px]">Price from</p>
            <p className="mt-1 text-[28px] leading-none font-semibold">US${trip.priceFrom.toLocaleString()}</p>
            <a href="#departures" className="mt-3 inline-flex items-center gap-2 text-[15px] underline underline-offset-4">
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-[#f8c028] text-[12px] font-bold text-logo-navy-dark italic">
                i
              </span>
              Join Upcoming Trips
            </a>
          </div>

          {trip.costTiers.length > 0 ? (
            <div className="bg-white px-5 pb-5 text-brand-neutral-900">
              <div className="flex items-center justify-between py-4 text-[18px] font-medium text-brand-neutral-1000">
                Group Discount Price
                <span aria-hidden="true">−</span>
              </div>
              <ul className="border-t border-[#cfe3ef]">
                {trip.costTiers.map((tier) => (
                  <li key={tier.groupSize} className="flex items-center justify-between border-b border-[#cfe3ef] py-3 text-[16px] last:border-b-0">
                    <span>{tier.groupSize}</span>
                    <span>US${tier.pricePerPerson.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => openBooking({ departureDate, adults: 1, addOnLabels: [] })}
            className="rounded-sm bg-[#f8c028] px-6 py-4 text-[19px] font-medium text-logo-navy-dark transition-opacity hover:opacity-90"
          >
            Join Upcoming Departure
          </button>
          <button
            type="button"
            onClick={goToBookingPage}
            className="rounded-sm bg-[#064a70] px-6 py-4 text-[19px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Check Availability
          </button>
          <button
            type="button"
            onClick={openEnquiry}
            className="rounded-sm bg-[#4f98bf] px-6 py-4 text-[19px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Send Inquiry
          </button>
        </div>

        <div className="mt-6 rounded-md bg-[#fdf6ef] p-5 text-[16px] leading-relaxed text-brand-neutral-800 shadow-card-strong">
          <p>
            The <strong className="text-brand-neutral-1000">Group cost of {trip.title}</strong> applicable to your group
            only, not the group created by us!
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7dfd2] pt-4 text-[14px] font-semibold text-brand-neutral-900">
            <Link href="/customize-trip" className="hover:underline">
              Customize a Trip
            </Link>
            <DownloadPdfButton slug={trip.slug} />
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Mobile-only fixed CTA bar — `md:hidden` mirrors the `md:sticky` on
 * `<aside>` above, so exactly one of the two "stay reachable while
 * scrolling" treatments is active at a given width. The extra bottom
 * padding (on top of the visible gap) adds the safe-area-inset-bottom
 * env variable, clearing the home-indicator inset on notched phones
 * instead of the bar sitting flush under it.
 *
 * Trip Enquiry / Book Now (2026-09-03) — same pair as the card's own
 * buttons above, replacing an earlier WhatsApp / Book Now pairing so
 * there's exactly one sticky contact CTA on mobile instead of it
 * competing with WhatsApp and Tawk chat for the same corner (both of
 * which stay reachable elsewhere — WhatsApp via the root layout's
 * floating button, chat via the enquiry form this now opens).
 */
function MobileBookingBar({ onEnquiry, onBookNow }: { onEnquiry: () => void; onBookNow: () => void }) {
  return (
    <div
      // Targeted by `globals.css` to hide the redundant global
      // WhatsApp button, a viewport-fixed singleton mounted once in
      // the root layout with no other relationship to this
      // page-specific bar. See that rule's own comment.
      id="mobile-booking-bar"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-brand-neutral-200 bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-card-strong md:hidden">
      <button
        type="button"
        onClick={onEnquiry}
        className="flex-1 rounded-pill bg-primary-500 px-5 py-3 font-poppins text-body-m font-medium text-white"
      >
        Trip Enquiry
      </button>

      <button
        type="button"
        onClick={onBookNow}
        className="flex-1 rounded-pill bg-logo-sun px-5 py-3 font-poppins text-body-m font-medium text-logo-navy-dark"
      >
        Book Now
      </button>
    </div>
  );
}
