"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Shared open/close/focus-trap/scroll-lock behavior for the header's
 * menu triggers. Extracted so `MobileNavPanel.tsx` (mobile) doesn't
 * have to re-derive this from scratch — kept as its own hook rather
 * than folded into `MobileMenu.tsx` (desktop) so that file, which is
 * being hand-tuned directly right now, doesn't need to change shape to
 * share it.
 *
 * `initialFocusRef` is whatever element should receive focus the
 * moment the panel opens (a close button, the first nav link, ...) —
 * the caller owns that ref and decides what it points at.
 */
export function useMenuDisclosure(
  initialFocusRef: React.RefObject<HTMLElement | null>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function toggle() {
    setIsOpen((open) => !open);
  }

  useEffect(() => {
    if (!isOpen) return;

    // Lock background scroll while the panel is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    initialFocusRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      // Minimal focus trap: wrap Tab/Shift+Tab within the panel.
      if (event.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // `close` isn't listed: it only reads refs/setState, stable across
    // renders. `initialFocusRef` — a ref object *passed in* by the
    // caller rather than a local `useRef` — has a stable identity too,
    // but the linter can't prove that for a parameter, hence listing it
    // explicitly rather than suppressing the warning.
  }, [isOpen, initialFocusRef]);

  return { isOpen, toggle, close, panelId, triggerRef, panelRef };
}
