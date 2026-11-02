import { cn } from "@/utils";
import type { AnalyticsRange } from "@/types/analytics";
import { ANALYTICS_RANGES } from "./analyticsRanges";

interface RangeSelectorProps {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
      {ANALYTICS_RANGES.map((range) => {
        const active = range.value === value;
        return (
          <button
            key={range.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={range.description}
            onClick={() => onChange(range.value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              active ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
