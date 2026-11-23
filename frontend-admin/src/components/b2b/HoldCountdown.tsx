import { Clock } from "lucide-react";
import { cn } from "@/utils";
import { useNow } from "@/hooks/useNow";

const pad = (n: number) => String(n).padStart(2, "0");

/** Live mm:ss (or h:mm:ss) countdown to `expiresAt`; shows "Expired" at zero. */
export function HoldCountdown({ expiresAt, className }: { expiresAt: string; className?: string }) {
  const now = useNow(1000);

  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return <span className={cn("font-medium text-red-600", className)}>Expired</span>;

  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", total < 120 ? "text-red-600" : "text-gray-800", className)}>
      <Clock className="h-3.5 w-3.5" />
      {h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`}
    </span>
  );
}
