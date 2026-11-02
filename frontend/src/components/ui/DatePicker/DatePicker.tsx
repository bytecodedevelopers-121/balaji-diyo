"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  addMonths,
  buildMonthGrid,
  isBeforeDay,
  isSameDay,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
  WEEKDAY_LABELS,
} from "./date-utils";

export interface DatePickerProps {
  /** Selected date, `YYYY-MM-DD`, or `null`/omitted for no selection. */
  value?: string | null;
  onChange: (value: string) => void;
  /** Earliest selectable date (`YYYY-MM-DD`) — every day before it renders disabled. Defaults to today, since every call site in the booking flow is picking a future departure date. Pass `null` to allow any date. */
  minDate?: string | null;
  label?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared date-picker input — the rounded field-with-calendar-icon
 * treatment used identically across the booking flow (BookingSidebar's
 * "Departure Date", BookingConfirmModal, the Book Now checkout) is
 * consolidated here as one component instead of three copies of a bare
 * native `<input type="date">`, each rendering its own browser/OS
 * picker UI. Figma itself never shows an expanded calendar state (every
 * sampled frame is just the closed field + calendar-icon affordance),
 * so the popover below is a genuine addition — built from the app's own
 * design tokens (primary/secondary colors, `rounded-2xl`/`rounded-pill`,
 * Poppins body styles) rather than inventing an unrelated look, so it
 * reads as part of the same system Figma defines for everything else on
 * this field.
 */
export function DatePicker({
  value,
  onChange,
  minDate,
  label,
  placeholder = "Select date",
  id,
  disabled = false,
  className,
}: DatePickerProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const today = new Date();
  const selected = value ? parseIsoDate(value) : null;
  const floor = minDate === null ? null : minDate ? parseIsoDate(minDate) : today;
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected ?? floor ?? today));

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    if (disabled) return;
    setOpen((isOpen) => {
      const next = !isOpen;
      if (next) setViewMonth(startOfMonth(selected ?? floor ?? today));
      return next;
    });
  }

  function selectDay(day: Date) {
    onChange(toIsoDate(day));
    setOpen(false);
  }

  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const displayLabel = selected
    ? selected.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : placeholder;

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
    >
      {label ? (
        <label
          htmlFor={fieldId}
          className="mb-2 block font-poppins text-body-m font-medium text-brand-neutral-800"
        >
          {label}
        </label>
      ) : null}

      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggleOpen}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-primary-200 bg-white px-4 py-3.5 text-left font-poppins text-body-m outline-none transition-colors",
          selected ? "text-brand-neutral-1000" : "text-brand-neutral-600",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-primary-400",
        )}
      >
        {displayLabel}
        <CalendarGlyph className="size-5 shrink-0 text-brand-neutral-700" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="absolute z-20 mt-2 w-72 rounded-2xl border border-primary-200 bg-white p-4 shadow-card-strong"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="flex size-8 items-center justify-center rounded-full text-brand-neutral-700 transition-colors hover:bg-primary-100"
            >
              <ChevronGlyph direction="left" />
            </button>
            <span className="font-poppins text-body-l font-medium text-brand-neutral-1000">{monthLabel}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex size-8 items-center justify-center rounded-full text-brand-neutral-700 transition-colors hover:bg-primary-100"
            >
              <ChevronGlyph direction="right" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((weekday) => (
              <span
                key={weekday}
                className="font-poppins text-body-s font-medium text-brand-neutral-700"
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {buildMonthGrid(viewMonth).map((day, index) => {
              if (!day) return <span key={`blank-${index}`} />;

              const isSelected = selected ? isSameDay(day, selected) : false;
              const isToday = isSameDay(day, today);
              const isDisabled = floor ? isBeforeDay(day, floor) : false;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full font-poppins text-body-s font-medium transition-colors",
                    isSelected
                      ? "bg-secondary-500 text-white"
                      : isDisabled
                        ? "cursor-not-allowed text-brand-neutral-400"
                        : "text-brand-neutral-900 hover:bg-primary-100",
                    !isSelected && isToday ? "border border-secondary-500" : "",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function ChevronGlyph({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}
