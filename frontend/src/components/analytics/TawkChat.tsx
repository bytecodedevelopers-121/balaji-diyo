"use client";

import { useEffect } from "react";

/**
 * Tawk.to live-chat widget, ported from the legacy site.
 *
 * The old boundlessadventure.com frontend has no admin-configurable
 * "chat widget" setting anywhere in the migrated data (checked
 * `base_global_settings` in boundless.sql — nothing there), so this
 * property/widget ID pair is transcribed verbatim from the legacy
 * site's own client bundle (reverse-engineered from its shipped JS,
 * 2026-08-26 — https://embed.tawk.to/<propertyId>/<widgetId>): not a
 * placeholder, this is the real, currently-live Tawk.to account for
 * Boundless Adventure.
 */
const TAWK_SCRIPT_SRC = "https://embed.tawk.to/62653fc47b967b11798c3d8d/1g1do26d2";
const TAWK_SCRIPT_ID = "tawk-to-script";

/** How long to wait for a first user interaction before loading the
 *  widget anyway — matches the legacy site's own fallback exactly. */
const IDLE_FALLBACK_MS = 30_000;

declare global {
  interface Window {
    Tawk_API?: {
      customStyle?: {
        visibility?: {
          desktop?: { xOffset?: number; yOffset?: number; position?: "br" | "bl" };
          mobile?: { xOffset?: number; yOffset?: number; position?: "br" | "bl" };
        };
      };
      onLoad?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      [key: string]: unknown;
    };
  }
}

/**
 * Desired widget visibility, set by whichever page currently wants it
 * hidden (see `setTawkVisible`). `hideWidget`/`showWidget` are Tawk's own
 * documented runtime API, but — unlike `customStyle` — they only exist on
 * `window.Tawk_API` once their embed script has actually run, so a call
 * made before then (e.g. a page mounting before the lazy `injectTawkScript`
 * below has fired) would silently no-op. Tracking the last-requested state
 * here and re-applying it from `Tawk_API.onLoad` (which Tawk's script does
 * pick up pre-set, same as `customStyle`) covers that race without the
 * caller needing to know whether the widget is loaded yet.
 */
let desiredTawkVisible = true;

/** Package detail page's mobile view — Trip Enquiry/Book Now bar already
 *  covers chat access there, and the launcher's own `yOffset` clearance
 *  for that bar (see `configureTawkStyle` below) still leaves it sitting
 *  in the same corner as the bar's buttons. */
export function setTawkVisible(visible: boolean) {
  desiredTawkVisible = visible;
  if (visible) window.Tawk_API?.showWidget?.();
  else window.Tawk_API?.hideWidget?.();
}

/**
 * Tawk's own documented pre-init config, not a CSS override fighting
 * an iframe we don't control — read once when their embed script
 * initializes, so it must be set before `injectTawkScript()` runs.
 *
 * `yOffset` on mobile clears the package detail page's fixed
 * `MobileBookingBar` (`BookingSidebar.tsx`) — 96px matches
 * `PackageDetailView`'s own `pb-24` reserved for that exact bar, same
 * as every other place in this codebase referencing its height. This
 * is a permanent site-wide default rather than something toggled per
 * route (Tawk's public API has no supported way to reposition after
 * load, so there's no clean way to drop it back down on pages without
 * that bar) — sitting ~96px up instead of the ~20px default on pages
 * that don't need the clearance is a harmless cosmetic difference, not
 * a bug.
 *
 * Mobile/tablet is also bottom-left now (2026-10-06): Tawk left,
 * WhatsApp right, scroll-to-top centered. The old 96px `yOffset` for the
 * package page's booking bar is moot since `setTawkVisible(false)` hides
 * the launcher on that page's mobile view.
 *
 * Desktop is pinned to the bottom-left specifically so it doesn't
 * stack on top of `WhatsAppButton`'s bottom-right fixed circle (both
 * are viewport-corner-fixed singletons, and Tawk's own bubble has no
 * layout awareness of ours) — matches the legacy site's arrangement:
 * Tawk chat left, WhatsApp right. Mobile is left as `"br"` (unchanged)
 * since `WhatsAppButton` is hidden there on pages with their own inline
 * WhatsApp CTA (see `global-whatsapp-button`'s CSS rule) and otherwise
 * doesn't collide the same way at that size.
 */
function configureTawkStyle() {
  window.Tawk_API = window.Tawk_API || {};
  window.Tawk_API.customStyle = {
    visibility: {
      desktop: { position: "bl", xOffset: 20, yOffset: 20 },
      mobile: { position: "bl", xOffset: 12, yOffset: 20 },
    },
  };
  // Applies whatever `setTawkVisible` was last called with, in case that
  // happened (e.g. the package detail page hiding it on mobile) before
  // this lazy-loaded script had actually run.
  window.Tawk_API.onLoad = () => {
    if (!desiredTawkVisible) window.Tawk_API?.hideWidget?.();
  };
}

function injectTawkScript() {
  if (document.getElementById(TAWK_SCRIPT_ID)) return;

  configureTawkStyle();

  const script = document.createElement("script");
  const firstScript = document.getElementsByTagName("script")[0];
  script.async = true;
  script.id = TAWK_SCRIPT_ID;
  script.src = TAWK_SCRIPT_SRC;
  script.charset = "UTF-8";
  script.setAttribute("crossorigin", "*");

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

/**
 * Loads the Tawk.to embed script lazily — on the first pointer/key/touch
 * interaction, or after a 30s idle fallback, whichever comes first —
 * rather than on initial page load. Same lazy-load pattern as the legacy
 * site: the chat widget is not critical for first paint/interactivity,
 * so deferring it keeps it off the critical path (LCP/TTI) without
 * dropping it altogether for someone who never interacts with the page.
 *
 * Renders nothing; mounted once in the root layout as a Client Component
 * (no `ssr:false` dynamic import needed here, since the component itself
 * renders null and only touches `window`/`document` inside `useEffect`,
 * which never runs during SSR).
 */
export function TawkChat() {
  useEffect(() => {
    const load = () => {
      cleanup();
      injectTawkScript();
    };

    const cleanup = () => {
      window.removeEventListener("pointerdown", load);
      window.removeEventListener("keydown", load);
      window.removeEventListener("touchstart", load);
      window.clearTimeout(idleTimer);
    };

    window.addEventListener("pointerdown", load, { once: true, passive: true });
    window.addEventListener("keydown", load, { once: true });
    window.addEventListener("touchstart", load, { once: true, passive: true });
    // `window.setTimeout`, explicitly, so `idleTimer` stays the DOM
    // `number` handle rather than Node's `Timeout` (this file also pulls
    // in @types/node globally, which would otherwise win the ambient
    // `setTimeout` overload).
    const idleTimer = window.setTimeout(load, IDLE_FALLBACK_MS);

    return cleanup;
  }, []);

  return null;
}
