import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils";

export type DrawerSize = "sm" | "md" | "lg" | "xl";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: DrawerSize;
  children: ReactNode;
  footer?: ReactNode;
}

const SIZE_MAP: Record<DrawerSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-2xl",
};

// Generic slide-in side panel — the Drawer counterpart to Modal. Use this for
// quick-view / detail panels opened from a list without leaving the page.
export function Drawer({ isOpen, onClose, title, size = "lg", children, footer }: DrawerProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const timeout = window.setTimeout(() => setEntered(false), 0);
      return () => window.clearTimeout(timeout);
    }

    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={cn("fixed inset-0 bg-black/50 transition-opacity duration-200", entered ? "opacity-100" : "opacity-0")}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex h-full w-full flex-col bg-white shadow-xl transition-transform duration-200",
          entered ? "translate-x-0" : "translate-x-full",
          SIZE_MAP[size],
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="text-base font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="pt-4">{children}</div>
        </div>

        {footer && <div className="border-t border-gray-100 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
