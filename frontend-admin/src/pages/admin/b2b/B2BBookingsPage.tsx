import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { BookingStatusBadge } from "@/components/b2b/b2b-ui";
import { LEDGER_TYPE_LABEL, formatMoney } from "@/components/b2b/b2b-helpers";
import { useAdminBooking, useAdminBookings, useAdminCancelBooking, useApproveBooking, useRejectBooking, useResolveAmendment } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { AnyB2BBooking, BookingStatus, FundingMethod } from "@/types/b2b";

type Tab = "PENDING_APPROVAL" | "AMENDMENT_REQUESTED" | "ALL";
type Dialog =
  | { kind: "approve" | "reject" | "amendment" | "cancel" | "view"; booking: AnyB2BBooking }
  | null;

const TABS: { id: Tab; label: string }[] = [
  { id: "PENDING_APPROVAL", label: "Pending approval" },
  { id: "AMENDMENT_REQUESTED", label: "Amendments" },
  { id: "ALL", label: "All bookings" },
];

const ref = (b: AnyB2BBooking) => (b.kind === "BOOKING" ? b.reference : `CUSTOM-${b.id.slice(-6).toUpperCase()}`);

export default function B2BBookingsPage() {
  const canAct = usePermission("update:b2b_booking");
  const [tab, setTab] = useState<Tab>("PENDING_APPROVAL");
  const [kind, setKind] = useState<"BOOKING" | "CUSTOM">("BOOKING");
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const effectiveStatus = tab === "ALL" ? status || undefined : tab;
  const effectiveKind = tab === "AMENDMENT_REQUESTED" ? "BOOKING" : kind;
  const { data, isLoading } = useAdminBookings({ page, perPage: 15, kind: effectiveKind, status: effectiveStatus, q: q || undefined });
  const meta = data?.data.meta;
  const [dialog, setDialog] = useState<Dialog>(null);

  const columns: DataTableColumn<AnyB2BBooking>[] = [
    { key: "ref", header: "Reference", render: (b) => <span className="font-mono font-medium text-gray-900">{ref(b)}</span> },
    { key: "partner", header: "Partner", render: (b) => <div><p className="text-gray-900">{b.b2bPartner?.legalName ?? "—"}</p><p className="text-xs text-gray-500">{b.b2bPartner?.partnerCode}</p></div> },
    { key: "pkg", header: "Package / travel", render: (b) => <div><p className="text-gray-900">{b.package?.title ?? "—"}</p><p className="text-xs text-gray-500">{formatDate(b.startDate)} · {b.numberOfTraveller} pax</p></div> },
    { key: "net", header: "Net", render: (b) => (b.netPayable ? formatMoney(b.netPayable, "USD") : <span className="text-gray-400">to be agreed</span>) },
    { key: "status", header: "Status", render: (b) => <BookingStatusBadge status={b.b2bStatus} /> },
    { key: "act", header: "", render: (b) => (
      <div className="flex flex-wrap gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: "view", booking: b })}>View</Button>
        {canAct && b.b2bStatus === "PENDING_APPROVAL" && <><Button size="sm" onClick={() => setDialog({ kind: "approve", booking: b })}>Approve</Button><Button variant="danger" size="sm" onClick={() => setDialog({ kind: "reject", booking: b })}>Reject</Button></>}
        {canAct && b.kind === "BOOKING" && b.b2bStatus === "AMENDMENT_REQUESTED" && <Button size="sm" onClick={() => setDialog({ kind: "amendment", booking: b })}>Review amendment</Button>}
        {canAct && b.kind === "BOOKING" && (b.b2bStatus === "CONFIRMED" || b.b2bStatus === "AMENDMENT_REQUESTED") && <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "cancel", booking: b })}>Cancel</Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="B2B Bookings" />
      <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }} className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === t.id ? "border-logo-navy-dark text-logo-navy-dark" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_200px]">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search BA number, name, email…" />
        <Select aria-label="Type" value={effectiveKind} disabled={tab === "AMENDMENT_REQUESTED"} options={[{ value: "BOOKING", label: "Departure bookings" }, { value: "CUSTOM", label: "Custom requests" }]} onChange={(e) => { setKind(e.target.value as "BOOKING" | "CUSTOM"); setPage(1); }} />
        {tab === "ALL" && <Select aria-label="Status" value={status} placeholder="All statuses" options={(["PENDING_APPROVAL", "CONFIRMED", "AMENDMENT_REQUESTED", "CANCELLED"] as const).map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase() }))} onChange={(e) => { setStatus(e.target.value as BookingStatus | ""); setPage(1); }} />}
      </div>
      <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage={tab === "ALL" ? "No bookings" : "Nothing waiting for review"} />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}

      {dialog?.kind === "view" && <ViewDialog id={dialog.booking.id} onClose={() => setDialog(null)} />}
      {dialog?.kind === "approve" && <ApproveDialog booking={dialog.booking} onClose={() => setDialog(null)} />}
      {dialog?.kind === "reject" && <RejectDialog booking={dialog.booking} onClose={() => setDialog(null)} />}
      {dialog?.kind === "amendment" && dialog.booking.kind === "BOOKING" && <AmendmentDialog booking={dialog.booking} onClose={() => setDialog(null)} />}
      {dialog?.kind === "cancel" && <CancelDialog booking={dialog.booking} onClose={() => setDialog(null)} />}
    </div>
  );
}

function ViewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data } = useAdminBooking(id);
  const b = data?.data;
  return (
    <Modal isOpen onClose={onClose} title={b ? ref(b) : "Booking"} size="xl" footer={<div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>}>
      {!b ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-3"><BookingStatusBadge status={b.b2bStatus} /><span className="text-gray-600">{b.b2bPartner?.legalName}</span></div>
          {b.b2bStatusReason && <Alert variant="info" message={b.b2bStatusReason} />}
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <div className="flex justify-between"><dt className="text-gray-600">Package</dt><dd>{b.package?.title}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Travel</dt><dd>{formatDate(b.startDate)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Travellers</dt><dd>{b.numberOfTraveller}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Net payable</dt><dd>{b.netPayable ? formatMoney(b.netPayable, "USD") : "—"}</dd></div>
            {b.kind === "BOOKING" && <><div className="flex justify-between"><dt className="text-gray-600">Client price</dt><dd>{formatMoney(b.totalPrice, "USD")}</dd></div><div className="flex justify-between"><dt className="text-gray-600">Commission / markup</dt><dd>{formatMoney(b.commissionAmount ?? 0, "USD")} / {formatMoney(b.agentMarkup ?? 0, "USD")}</dd></div></>}
          </dl>
          <div><p className="mb-1 font-medium text-gray-900">Travellers</p><ul className="text-gray-700">{b.travellers.map((t) => <li key={t.id}>{t.fullName} · {t.email}{t.isLead ? " (lead)" : ""}</li>)}</ul></div>
          {b.kind === "BOOKING" && b.ledger && b.ledger.length > 0 && (
            <div><p className="mb-1 font-medium text-gray-900">Ledger</p>
              <ul className="divide-y divide-gray-100">{b.ledger.map((e) => <li key={e.id} className="flex justify-between py-1"><span>{LEDGER_TYPE_LABEL[e.entryType]} <Badge label={e.account.toLowerCase()} variant="gray" size="sm" /></span><span>{e.direction === "CREDIT" ? "+" : "−"}{formatMoney(e.amount, e.currency)}</span></li>)}</ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ApproveDialog({ booking, onClose }: { booking: AnyB2BBooking; onClose: () => void }) {
  const approve = useApproveBooking();
  const isCustom = booking.kind === "CUSTOM";
  const [net, setNet] = useState("");
  const [funding, setFunding] = useState<FundingMethod | "">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    setError(null);
    if (isCustom && !(Number(net) > 0)) return setError("Enter the agreed net price for this custom booking.");
    approve.mutate(
      { id: booking.id, note: note || undefined, ...(isCustom ? { netPayable: Number(net) } : {}), ...(funding ? { fundingMethod: funding } : {}) },
      { onSuccess: onClose, onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  };
  return (
    <Modal isOpen onClose={onClose} title={`Approve ${ref(booking)}`} size="sm" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} isLoading={approve.isPending}>Approve &amp; charge</Button></div>}>
      <div className="space-y-3">
        {error && <Alert variant="error" message={error} />}
        <Alert variant="info" message={isCustom ? "Approving charges the agreed net price to the partner's wallet/credit." : `Approving charges ${formatMoney(booking.netPayable ?? 0, "USD")} to the partner and locks the seats.`} />
        {isCustom && <Input label="Agreed net price (USD)" type="number" min={0} step="0.01" value={net} onChange={(e) => setNet(e.target.value)} required />}
        <Select label="Charge to" value={funding} placeholder="As requested by the partner" options={[{ value: "WALLET", label: "Wallet" }, { value: "CREDIT", label: "Credit line" }, { value: "WALLET_THEN_CREDIT", label: "Wallet, then credit" }]} onChange={(e) => setFunding(e.target.value as FundingMethod | "")} />
        <Textarea label="Note to the partner (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}

function RejectDialog({ booking, onClose }: { booking: AnyB2BBooking; onClose: () => void }) {
  const reject = useRejectBooking();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal isOpen onClose={onClose} title={`Reject ${ref(booking)}`} size="sm" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" disabled={reason.trim().length < 3} isLoading={reject.isPending} onClick={() => reject.mutate({ id: booking.id, reason: reason.trim() }, { onSuccess: onClose, onError: (e) => setError(getDetailedErrorMessage(e)) })}>Reject</Button></div>}>
      <div className="space-y-3">{error && <Alert variant="error" message={error} />}<Textarea label="Reason (shown to the partner)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
    </Modal>
  );
}

function AmendmentDialog({ booking, onClose }: { booking: Extract<AnyB2BBooking, { kind: "BOOKING" }>; onClose: () => void }) {
  const resolve = useResolveAmendment();
  const pending = booking.amendments.find((a) => a.status === "PENDING");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const act = (action: "APPROVE" | "REJECT") => resolve.mutate({ id: booking.id, action, note: note || undefined }, { onSuccess: onClose, onError: (e) => setError(getDetailedErrorMessage(e)) });
  return (
    <Modal isOpen onClose={onClose} title={`Amendment for ${booking.reference}`} size="md" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Close</Button><Button variant="danger" isLoading={resolve.isPending} onClick={() => act("REJECT")}>Reject</Button><Button isLoading={resolve.isPending} onClick={() => act("APPROVE")}>Approve</Button></div>}>
      <div className="space-y-3 text-sm">
        {error && <Alert variant="error" message={error} />}
        {pending ? (
          <>
            <p className="text-gray-700"><span className="font-medium">Partner's reason:</span> {pending.reason}</p>
            <ul className="list-inside list-disc text-gray-700">
              {pending.payload.paxCount !== undefined && <li>Travellers: {booking.numberOfTraveller} → {pending.payload.paxCount}</li>}
              {pending.payload.departureId && <li>Move to a different departure</li>}
              {pending.payload.travellers && <li>Replace traveller details ({pending.payload.travellers.length})</li>}
            </ul>
            <Alert variant="info" message="Approving re-prices the booking with current rules and charges or refunds the difference. If seats are no longer available the approval fails and nothing changes." />
          </>
        ) : <p>No pending amendment.</p>}
        <Textarea label="Note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}

function CancelDialog({ booking, onClose }: { booking: AnyB2BBooking; onClose: () => void }) {
  const cancel = useAdminCancelBooking();
  const [reason, setReason] = useState("");
  const [penalty, setPenalty] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal isOpen onClose={onClose} title={`Cancel ${ref(booking)}`} size="sm" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Back</Button><Button variant="danger" disabled={reason.trim().length < 3} isLoading={cancel.isPending} onClick={() => cancel.mutate({ id: booking.id, reason: reason.trim(), ...(penalty !== "" ? { penaltyAmount: Number(penalty) } : {}) }, { onSuccess: onClose, onError: (e) => setError(getDetailedErrorMessage(e)) })}>Cancel booking</Button></div>}>
      <div className="space-y-3">
        {error && <Alert variant="error" message={error} />}
        <Input label="Penalty override (USD, optional)" type="number" min={0} step="0.01" value={penalty} onChange={(e) => setPenalty(e.target.value)} hint="Blank = standard schedule by days to departure. 0 = full refund." />
        <Textarea label="Reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Modal>
  );
}
