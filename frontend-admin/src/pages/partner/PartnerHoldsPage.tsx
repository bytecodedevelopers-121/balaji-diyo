import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { HoldCountdown } from "@/components/b2b/HoldCountdown";
import { useHolds, useReleaseHold } from "@/hooks/queries/useB2B";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { Hold, HoldStatus } from "@/types/b2b";

const VARIANT: Record<HoldStatus, BadgeVariant> = { ACTIVE: "green", CONVERTED: "blue", EXPIRED: "gray", RELEASED: "orange" };

export default function PartnerHoldsPage() {
  const role = useAuthStore((s) => s.user?.b2bRole);
  const canRelease = role === "AGENCY_ADMIN" || role === "BOOKING_AGENT";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<HoldStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading } = useHolds({ page, perPage: 15, status: status || undefined });
  const release = useReleaseHold();
  const meta = data?.data.meta;

  const columns: DataTableColumn<Hold>[] = [
    { key: "pkg", header: "Package", render: (h) => <div><p className="font-medium text-gray-900">{h.departure.package.title}</p><p className="text-xs text-gray-500">Departs {formatDate(h.departure.departureDate)}</p></div> },
    { key: "seats", header: "Seats", render: (h) => h.seatsHeld },
    { key: "status", header: "Status", render: (h) => <Badge label={h.effectiveStatus.charAt(0) + h.effectiveStatus.slice(1).toLowerCase()} variant={VARIANT[h.effectiveStatus]} /> },
    { key: "left", header: "Time left", render: (h) => (h.effectiveStatus === "ACTIVE" ? <HoldCountdown expiresAt={h.expiresAt} /> : <span className="text-gray-400">—</span>) },
    { key: "created", header: "Created", render: (h) => <span className="text-gray-600">{formatDate(h.createdAt)}</span> },
    { key: "act", header: "", render: (h) => canRelease && h.effectiveStatus === "ACTIVE" ? (
      <Button variant="outline" size="sm" isLoading={release.isPending && release.variables === h.id} onClick={() => { setError(null); release.mutate(h.id, { onError: (e) => setError(getErrorMessage(e)) }); }}>Release</Button>
    ) : null },
  ];

  return (
    <div>
      <PageHeader title="Seat holds" />
      <div className="mb-4 max-w-xs">
        <Select aria-label="Status" value={status} placeholder="All statuses" options={(["ACTIVE", "CONVERTED", "EXPIRED", "RELEASED"] as const).map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))} onChange={(e) => { setStatus(e.target.value as HoldStatus | ""); setPage(1); }} />
      </div>
      {error && <div className="mb-4"><Alert variant="error" message={error} onClose={() => setError(null)} /></div>}
      <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage="No holds yet" />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}
    </div>
  );
}
