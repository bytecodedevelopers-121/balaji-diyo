import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useNow } from "@/hooks/useNow";
import type { SlaStatus, SlaTicket } from "@/types/b2b";

const VARIANT: Record<SlaStatus, BadgeVariant> = { OPEN: "blue", IN_PROGRESS: "indigo", ESCALATED: "orange", BREACHED: "red", RESOLVED: "green" };

export const SlaStatusBadge = ({ status }: { status: SlaStatus }) => <Badge label={status.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())} variant={VARIANT[status]} />;

const fmt = (ms: number): string => {
  const m = Math.floor(Math.abs(ms) / 60_000);
  const h = Math.floor(m / 60);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

/** "2h 10m left" / "overdue 45m" for an unresolved ticket. */
export function SlaTimeLeft({ ticket }: { ticket: Pick<SlaTicket, "dueAt" | "status"> }) {
  const now = useNow(30_000);
  if (ticket.status === "RESOLVED") return <span className="text-gray-400">—</span>;
  const ms = new Date(ticket.dueAt).getTime() - now;
  return ms >= 0 ? <span className="text-gray-700">{fmt(ms)} left</span> : <span className="font-medium text-red-600">overdue {fmt(ms)}</span>;
}
