"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { setTawkVisible } from "@/components/analytics/TawkChat";
import { DatePicker } from "@/components/ui/DatePicker";
import { WHATSAPP_HREF, WhatsAppGlyph } from "@/components/ui/WhatsAppButton";
import type { PackageDetail } from "../data";
import { useBookingFlow } from "./booking-flow-context";
import { pricePerPersonForAdults } from "./booking-helpers";

/**
 * Sticky "Start Booking" widget — matches Figma node 1000006535 (the
 * card alongside the main content column): departure date, a pax
 * stepper with per-person price, a running total, Trip Enquiry / Book
 * Now buttons, and an "Expert Advice" contact card.
 *
 * No add-ons here, deliberately (2026-09-02 client request, applies to
 * every package) — this card has no selection UI, so it used to just
 * always add the trip's first two `addOns` into the total regardless of
 * whether the traveler wanted them (and the actual booking payload below
 * ignored them anyway, `addOnLabels: []`). Add-ons stay opt-in only,
 * via the interactive checklist in the page's own Cost section.
 *
 * Below `md` the card above scrolls away inline with the rest of the
 * page (Figma node 596:26470's mobile frame), so the design adds a
 * second, viewport-fixed bar — Trip Enquiry / Book Now, the same pair
 * as this card's own buttons — that stays reachable the whole time.
 * `<MobileBookingBar>` renders that; `PackageDetailView` pads the
 * page's bottom on mobile so it doesn't cover the last section.
 *
 * That bar (2026-09-03) replaced an earlier WhatsApp / Book Now pairing
 * — WhatsApp is still reachable via the root layout's floating button
 * elsewhere on the site, and Tawk chat is deliberately hidden on mobile
 * here (see the effect below) so this one enquiry/booking CTA is the
 * single sticky contact point on this page, without competing chat
 * entry points stacking up in the same corner.
 */
export function BookingSidebar({ trip }: { trip: PackageDetail }) {
  const [pax, setPax] = useState(1);
  const [departureDate, setDepartureDate] = useState(
    trip.departures[0]?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [stickyTop, setStickyTop] = useState(60); // ~ old `md:top-15` fallback before the first measurement
  const { openBooking, openEnquiry } = useBookingFlow();
  // FIXED 2026-09-03 (user-reported: increasing travelers just doubled
  // the 1-person price instead of following the "Group Price Breakdown"
  // table). This always read `costTiers[0]` — the 1-person tier — no
  // matter how many `pax` were selected, so e.g. 2 travelers priced at
  // 2× the solo rate instead of the real 2-4 person group rate. Same
  // tiered lookup `BookingConfirmModal`/`CheckoutView` already use for
  // this exact math, now recomputed as `pax` changes.
  const pricePerPax = pricePerPersonForAdults(trip, pax);
  const total = pricePerPax * pax;

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
            adults: pax,
            addOnLabels: [],
          })
        }
      />
      <aside style={{ top: stickyTop }} className="rounded-2xl border border-[#fbc99d] bg-primary-100 p-5 md:sticky">
        <h2 className="border-b border-[#fbc99d] pb-3 font-poppins text-2xl font-medium text-brand-neutral-1000">
          Start Booking
        </h2>

        <div className="flex flex-col gap-3 py-4">
          <DatePicker
            label="Departure Date"
            value={departureDate}
            onChange={setDepartureDate}
          />

          <div className="flex items-center justify-between border-b border-[#fbc99d] pb-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPax((p) => Math.max(1, p - 1))}
                className="flex size-10 items-center justify-center rounded-full bg-white font-poppins text-body-l text-brand-neutral-700"
                aria-label="Decrease travelers"
              >
                −
              </button>
              <span className="flex size-10 items-center justify-center rounded-full border border-[#ebebeb] bg-white font-poppins text-body-l font-medium text-brand-neutral-700">
                {pax}
              </span>
              <button
                type="button"
                onClick={() => setPax((p) => p + 1)}
                className="flex size-10 items-center justify-center rounded-full bg-white font-poppins text-body-l text-brand-neutral-700"
                aria-label="Increase travelers"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="font-poppins text-heading-xl font-medium text-brand-neutral-1000">
                ${pricePerPax.toLocaleString()}
              </p>
              <p className="font-poppins text-body-s font-medium text-brand-neutral-700">
                Per pax
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-poppins text-body-l font-medium text-brand-neutral-700">
              Total
            </span>
            <span className="font-poppins text-2xl font-medium text-primary-500">
              ${total.toLocaleString()}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={openEnquiry}
              className="flex flex-1 items-center justify-center rounded-pill bg-primary-500 px-6 py-3 font-poppins text-body-m font-medium text-white"
            >
              Trip Enquiry
            </button>
            <button
              type="button"
              onClick={() =>
                openBooking({
                  departureDate,
                  adults: pax,
                  addOnLabels: [],
                })
              }
              className="flex flex-1 items-center justify-center rounded-pill bg-secondary-500 px-6 py-3 font-poppins text-body-m font-medium text-white"
            >
              Book Now
            </button>
          </div>
        </div>

        {/*
          Desktop-only (2026-09-03): this whole card is still shown
          inline on mobile per the doc comment above (Figma's own
          mobile frame), but that made this "Expert Advice" WhatsApp
          button a second, redundant WhatsApp CTA on top of
          `MobileBookingBar`'s persistent one — which, unlike this
          in-flow card, is always on screen, so nothing is lost by
          only showing this one where the sticky sidebar itself
          appears (`md` and up).
        */}
        <div className="-mx-5 -mb-5 hidden items-center justify-between gap-6 rounded-b-2xl bg-white p-5 md:flex">
          <div className="flex items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-500 bg-primary-100 p-2">
              <Image
                src="/android-chrome-192x192.png"
                alt=""
                fill
                sizes="44px"
                className="object-contain"
              />
            </span>
            <div>
              <p className="font-poppins text-body-s font-medium text-brand-neutral-700">
                Quick help?
              </p>
              <p className="font-poppins text-body-l font-medium text-brand-neutral-800">
                Expert Advice
              </p>
            </div>
          </div>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with an expert on WhatsApp"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-neutral-900"
          >
            <WhatsAppGlyph className="size-8" />
          </a>
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
        className="flex-1 rounded-pill bg-secondary-500 px-5 py-3 font-poppins text-body-m font-medium text-white"
      >
        Book Now
      </button>
    </div>
  );
}
