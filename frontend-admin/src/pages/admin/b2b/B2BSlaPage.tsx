import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { SlaStatusBadge, SlaTimeLeft } from "@/components/b2b/SlaBadge";
import { useAdminSlaTickets, useUpdateSlaTicket } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { SlaPriority, SlaStatus, SlaTicket } from "@/types/b2b";

const PRIORITY: Record<SlaPriority, BadgeVariant> = { LOW: "gray", NORMAL: "blue", HIGH: "orange", URGENT: "red" };
const toLocalInput = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export default function B2BSlaPage() {
  const canEdit = usePermission("update:b2b_sla");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SlaStatus | "">("");
  const [overdue, setOverdue] = useState(false);
  const { data, isLoading } = useAdminSlaTickets({ page, perPage: 15, status: status || undefined, overdue: overdue || undefined });
  const update = useUpdateSlaTicket();
  const [ticket, setTicket] = useState<SlaTicket | null>(null);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<SlaPriority>("NORMAL");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const meta = data?.data.meta;
  const items = data?.data.items ?? [];
  const attention = items.filter((t) => t.status === "ESCALATED" || t.status === "BREACHED").length;

  const open = (t: SlaTicket) => { setTicket(t); setNotes(t.notes ?? ""); setPriority(t.priority); setDue(toLocalInput(t.dueAt)); setError(null); };
  const act = (body: { status?: "IN_PROGRESS" | "ESCALATED" | "RESOLVED" }) => {
    if (!ticket) return;
    setError(null);
    update.mutate(
      { id: ticket.id, ...body, notes, priority, ...(due && new Date(due).toISOString() !== ticket.dueAt ? { dueAt: new Date(due).toISOString() } : {}) },
      { onSuccess: () => setTicket(null), onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  };

  const columns: DataTableColumn<SlaTicket>[] = [
    { key: "ref", header: "Reference", render: (t) => <span className="font-mono font-medium text-gray-900">{t.reference ?? "—"}</span> },
    { key: "partner", header: "Partner", render: (t) => <div><p className="text-gray-900">{t.partner?.legalName}</p><p className="text-xs text-gray-500">{t.partner?.partnerCode}</p></div> },
    { key: "subject", header: "Request", render: (t) => t.subject },
    { key: "priority", header: "Priority", render: (t) => <Badge label={t.priority.toLowerCase()} variant={PRIORITY[t.priority]} size="sm" /> },
    { key: "status", header: "Status", render: (t) => <SlaStatusBadge status={t.status} /> },
    { key: "due", header: "Due", render: (t) => <div><p className="whitespace-nowrap">{formatDate(t.dueAt)}</p><p className="text-xs"><SlaTimeLeft ticket={t} /></p></div> },
    { key: "act", header: "", render: (t) => <Button variant="outline" size="sm" onClick={() => open(t)}>{canEdit ? "Manage" : "View"}</Button> },
  ];

  return (
    <div>
      <PageHeader title="SLA tickets" />
      {attention > 0 && <div className="mb-4"><Alert variant="warning" message={`${attention} ticket(s) on this page are escalated or breached.`} /></div>}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-56"><Select aria-label="Status" value={status} placeholder="All statuses" options={(["OPEN", "IN_PROGRESS", "ESCALATED", "BREACHED", "RESOLVED"] as const).map((s) => ({ value: s, label: s.replace("_", " ").toLowerCase() }))} onChange={(e) => { setStatus(e.target.value as SlaStatus | ""); setPage(1); }} /></div>
        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700"><input type="checkbox" checked={overdue} onChange={(e) => { setOverdue(e.target.checked); setPage(1); }} /> Overdue only</label>
      </div>
      <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage="No tickets" />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}

      <Modal isOpen={!!ticket} onClose={() => setTicket(null)} title={ticket?.reference ?? "Ticket"} size="lg"
        footer={ticket && canEdit && ticket.status !== "RESOLVED" ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setTicket(null)}>Close</Button>
            <Button variant="outline" isLoading={update.isPending} onClick={() => act({})}>Save notes</Button>
            {ticket.status !== "ESCALATED" && ticket.status !== "BREACHED" && <Button variant="outline" isLoading={update.isPending} onClick={() => act({ status: "ESCALATED" })}>Escalate now</Button>}
            {(ticket.status === "OPEN" || ticket.status === "ESCALATED") && <Button variant="outline" isLoading={update.isPending} onClick={() => act({ status: "IN_PROGRESS" })}>Start work</Button>}
            <Button isLoading={update.isPending} onClick={() => act({ status: "RESOLVED" })}>Resolve</Button>
          </div>
        ) : <div className="flex justify-end"><Button variant="secondary" onClick={() => setTicket(null)}>Close</Button></div>}>
        {ticket && (
          <div className="space-y-3 text-sm">
            {error && <Alert variant="error" message={error} />}
            <div className="flex flex-wrap items-center gap-3"><SlaStatusBadge status={ticket.status} /><span className="text-gray-600">{ticket.partner?.legalName}</span><SlaTimeLeft ticket={ticket} /></div>
            <p className="text-gray-800">{ticket.subject}</p>
            {canEdit && ticket.status !== "RESOLVED" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Priority" value={priority} options={(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((p) => ({ value: p, label: p.toLowerCase() }))} onChange={(e) => setPriority(e.target.value as SlaPriority)} />
                <Input label="Due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} hint="Extend this when moving an overdue ticket to In progress." />
              </div>
            )}
            <Textarea label="Internal notes (never shown to the partner)" rows={4} value={notes} disabled={!canEdit} onChange={(e) => setNotes(e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
