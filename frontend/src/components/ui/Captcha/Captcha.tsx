"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          size?: "normal" | "compact" | "flexible";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface CaptchaHandle {
  /** Clears a spent/expired token and re-renders the widget — call after a failed submit so the same token can't be replayed. */
  reset: () => void;
}

/**
 * Cloudflare Turnstile widget, shared by every public form this site
 * captcha-gates: the enquiry form (ContactForm, reused by TripEnquiryModal
 * and the trekking-route/blog "ask question" call sites), PlanWithUsWizard,
 * and CheckoutView's booking form — mirroring the backend's own
 * `verifyCaptcha` guard (backend/src/common/guards/captcha.guard.ts).
 *
 * Renders nothing at all when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` isn't set —
 * same "degrades cleanly when unconfigured" shape the backend guard uses —
 * so every call site keeps working exactly as it did before this feature
 * existed until a real site key is dropped into `.env.local` (and the
 * matching `TURNSTILE_SECRET_KEY` into the backend's `.env`).
 */
export const Captcha = forwardRef<
  CaptchaHandle,
  {
    onVerify: (token: string | null) => void;
    /**
     * "flexible" (the default) CSS-resizes to the container's width, but
     * Cloudflare's own flexible mode still has a practical minimum around
     * 300px — narrower than that, the widget (especially its wider
     * solved/"Success!" state, which also carries the Cloudflare-branding
     * footer) renders past its container's right edge instead of actually
     * shrinking, visually overlapping whatever sits next to it.
     * "compact" is a small fixed 130×120 box that comfortably fits inside
     * a truly narrow container (e.g. BlogAskQuestionSidebar's ~216px of
     * content room) without overflowing.
     */
    size?: "flexible" | "compact";
  }
>(function Captcha({ onVerify, size = "flexible" }, ref) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile)
      return;

    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onVerify(token),
      "expired-callback": () => onVerify(null),
      "error-callback": () => onVerify(null),
      // Turnstile's default "normal" size is a *fixed* 300px-wide box —
      // wider than most containers this widget renders inside, so
      // callers get "flexible" (CSS-resizes to the container's actual
      // width) by default. That still has a practical minimum around
      // 300px, so a genuinely narrow container (BlogAskQuestionSidebar's
      // ~216px of content room) passes "compact" instead — see this
      // component's own `size` prop doc comment.
      size,
    });
    widgetIdRef.current = widgetId;

    return () => {
      window.turnstile?.remove(widgetId);
      widgetIdRef.current = null;
    };
    // `onVerify` is passed fresh on every render by the call sites below;
    // re-running this effect for that alone would re-mount the widget on
    // every keystroke elsewhere in the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, siteKey, size]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      {/* `w-full`: "flexible" sizing above reads the container's own
            rendered width to decide how wide to draw the widget — left
            as a bare shrink-to-fit div, it has no width of its own to
            report. */}
      <div ref={containerRef} className="w-full" />
    </>
  );
});
