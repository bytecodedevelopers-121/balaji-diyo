"use client";

/**
 * "Group Size" / "Trip Duration" sliders (design-references/
 * "Plan with us - Preferences.png", y≈750–890 at 1440px, inside the
 * "Travelers & Duration" panel) — a native `<input type="range">`
 * styled via Tailwind's `accent-color` utility rather than a custom
 * thumb/track (no slider library in this project, and `accent-*` gets
 * a real colored thumb+track cross-browser with no extra markup).
 */
export function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  minLabel,
  maxLabel,
  formatValue,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
  formatValue: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-poppins text-[14px] leading-[22.4px] font-medium text-brand-neutral-900">
          {label}
        </span>
        <span className="rounded-pill border border-brand-neutral-300 bg-brand-neutral-000 px-3 py-1 font-poppins text-[13px] leading-[20.8px] font-medium text-brand-neutral-900">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-secondary-500"
      />
      <div className="flex items-center justify-between font-poppins text-[12px] leading-[19.2px] text-brand-neutral-600">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
