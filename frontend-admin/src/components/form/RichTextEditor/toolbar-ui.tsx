import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils";

interface ToolbarButtonProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

// `onMouseDown` preventDefault keeps the editor selection from collapsing
// before the click handler runs the command.
export function ToolbarButton({ active, disabled, onClick, label, children, className }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm text-gray-600 transition-colors",
        "hover:bg-gray-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
        active && "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ToolbarSeparator() {
  return <div className="mx-0.5 h-5 w-px shrink-0 self-center bg-gray-300" aria-hidden="true" />;
}

interface ToolbarDropdownProps {
  label: string;
  disabled?: boolean;
  trigger: ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  children: (close: () => void) => ReactNode;
}

// Shared popover primitive for every menu in the toolbar (format, font,
// color, link, image, table, emoji, find & replace). Anchored under its
// trigger button; closes on outside click or Escape.
export function ToolbarDropdown({ label, disabled, trigger, triggerClassName, panelClassName, children }: ToolbarDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex">
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-7 items-center gap-1 rounded px-1.5 text-sm text-gray-600 transition-colors",
          "hover:bg-gray-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
          open && "bg-gray-200/70",
          disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
          triggerClassName,
        )}
      >
        {trigger}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-20 mt-1 min-w-[10rem] rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function ToolbarMenuItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100",
        active && "bg-indigo-50 text-indigo-700",
      )}
    >
      {children}
    </button>
  );
}
