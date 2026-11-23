import { cn } from "@/utils";

/** Utilization bar; turns amber at the alert threshold and red as the limit is approached. */
export function CreditBar({ utilizationPct, thresholdPct }: { utilizationPct: number; thresholdPct: number }) {
  const pct = Math.min(Math.max(utilizationPct, 0), 100);
  return (
    <div className="relative h-3 w-full rounded-full bg-gray-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Credit utilization">
      <div className={cn("h-3 rounded-full transition-all", pct >= 95 ? "bg-red-500" : pct >= thresholdPct ? "bg-amber-500" : "bg-indigo-500")} style={{ width: `${pct}%` }} />
      <div className="absolute inset-y-0 w-px bg-gray-400" style={{ left: `${thresholdPct}%` }} title={`${thresholdPct}% alert threshold`} />
    </div>
  );
}
