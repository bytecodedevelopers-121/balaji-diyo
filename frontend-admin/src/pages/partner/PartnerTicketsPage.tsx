import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Select } from "@/components/ui/Select";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { SlaStatusBadge, SlaTimeLeft } from "@/components/b2b/SlaBadge";
import { useMySlaTickets } from "@/hooks/queries/useB2B";
import { formatDate } from "@/lib/formatDate";
import type { SlaStatus, SlaTicket } from "@/types/b2b";

export default function PartnerTicketsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SlaStatus | "">("");
  const { data, isLoading } = useMySlaTickets({ page, perPage: 15, status: status || undefined });
  const meta = data?.data.meta;
  const columns: DataTableColumn<SlaTicket>[] = [
    { key: "ref", header: "Reference", render: (t) => <span className="font-mono">{t.reference ?? "—"}</span> },
    { key: "subject", header: "Request", render: (t) => t.subject },
    { key: "status", header: "Status", render: (t) => <SlaStatusBadge status={t.status} /> },
    { key: "due", header: "Response due", render: (t) => <div><p>{formatDate(t.dueAt)}</p><p className="text-xs"><SlaTimeLeft ticket={t} /></p></div> },
    { key: "created", header: "Opened", render: (t) => <span className="text-gray-600">{formatDate(t.createdAt)}</span> },
  ];
  return (
    <div>
      <PageHeader title="Request tracking" />
      <p className="mb-4 text-sm text-gray-500">On-request bookings and amendments are answered within your tier's response time.</p>
      <div className="mb-4 max-w-xs"><Select aria-label="Status" value={status} placeholder="All statuses" options={(["OPEN", "IN_PROGRESS", "ESCALATED", "BREACHED", "RESOLVED"] as const).map((s) => ({ value: s, label: s.replace("_", " ").toLowerCase() }))} onChange={(e) => { setStatus(e.target.value as SlaStatus | ""); setPage(1); }} /></div>
      <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage="No requests yet" />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}
    </div>
  );
}
