import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { PartnerStatusBadge } from "@/components/b2b/b2b-ui";
import { SettlementReport } from "@/pages/partner/PartnerSettlementsPage";
import { useAdminPartnerSettlement, useAdminSettlements, useRecordSettlement } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { getDetailedErrorMessage } from "@/lib/apiError";
import type { RecordSettlementInput, SettlementOverviewRow } from "@/types/b2b";

const iso = (d: Date) => d.toISOString().slice(0, 10);
type Kind = "CREDIT_LINE_REPAYMENT" | "COMMISSION_CREDIT" | "ADJUSTMENT";

function RecordDialog({ row, onClose }: { row: SettlementOverviewRow; onClose: () => void }) {
  const record = useRecordSettlement(row.id);
  const [kind, setKind] = useState<Kind>("CREDIT_LINE_REPAYMENT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [ref, setRef] = useState("");
  const [account, setAccount] = useState<"WALLET" | "CREDIT">("WALLET");
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    const n = Number(amount);
    if (!(n > 0)) return setError("Enter an amount greater than zero.");
    const base = { amount: n, ...(ref.trim() ? { settlementRef: ref.trim() } : {}) };
    const body: RecordSettlementInput =
      kind === "CREDIT_LINE_REPAYMENT" ? { kind, ...base, ...(description ? { description } : {}) }
      : kind === "COMMISSION_CREDIT" ? { kind, ...base, description }
      : { kind, ...base, account, direction, description };
    record.mutate(body, {
      onSuccess: (r) => setDone(r.data.replayed ? "Already recorded earlier (same reference) — nothing was posted again." : "Recorded. An immutable ledger entry was posted."),
      onError: (e) => setError(getDetailedErrorMessage(e)),
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={`Record settlement · ${row.legalName}`} size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{done ? "Close" : "Cancel"}</Button>{!done && <Button onClick={submit} isLoading={record.isPending}>Post entry</Button>}</div>}>
      <div className="space-y-3">
        {error && <Alert variant="error" message={error} />}
        {done && <Alert variant="success" message={done} />}
        {!done && (
          <>
            <Select label="Type" value={kind} options={[{ value: "CREDIT_LINE_REPAYMENT", label: `Credit line repayment (used ${formatMoney(row.creditUsed, row.currency)})` }, { value: "COMMISSION_CREDIT", label: "Commission payout (credits wallet)" }, { value: "ADJUSTMENT", label: "Manual adjustment" }]} onChange={(e) => setKind(e.target.value as Kind)} />
            {kind === "ADJUSTMENT" && (
              <div className="grid grid-cols-2 gap-3">
                <Select label="Account" value={account} options={[{ value: "WALLET", label: "Wallet" }, { value: "CREDIT", label: "Credit used" }]} onChange={(e) => setAccount(e.target.value as "WALLET" | "CREDIT")} />
                <Select label="Direction" value={direction} options={[{ value: "CREDIT", label: "Credit (+ wallet / − credit used)" }, { value: "DEBIT", label: "Debit (− wallet / + credit used)" }]} onChange={(e) => setDirection(e.target.value as "CREDIT" | "DEBIT")} />
              </div>
            )}
            <Input label={`Amount (${row.currency})`} type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input label={kind === "CREDIT_LINE_REPAYMENT" ? "Description (optional)" : "Description (required)"} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input label="Settlement reference (optional)" value={ref} onChange={(e) => setRef(e.target.value)} hint="Bank/transaction id. Re-submitting the same reference can never post twice." />
          </>
        )}
      </div>
    </Modal>
  );
}

export default function B2BSettlementsPage() {
  const canEdit = usePermission("update:b2b_finance");
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 30 * 86_400_000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminSettlements({ from, to, page, perPage: 15 });
  const [detail, setDetail] = useState<SettlementOverviewRow | null>(null);
  const [recordFor, setRecordFor] = useState<SettlementOverviewRow | null>(null);
  const { data: detailData } = useAdminPartnerSettlement(detail?.id ?? null, { from, to });
  const meta = data?.data.meta;

  const columns: DataTableColumn<SettlementOverviewRow>[] = [
    { key: "partner", header: "Partner", render: (p) => <div><p className="font-medium text-gray-900">{p.legalName}</p><p className="text-xs text-gray-500">{p.partnerCode}</p></div> },
    { key: "status", header: "Status", render: (p) => <PartnerStatusBadge status={p.status} /> },
    { key: "wallet", header: "Wallet", render: (p) => formatMoney(p.walletBalance, p.currency) },
    { key: "credit", header: "Credit used / limit", render: (p) => <span>{formatMoney(p.creditUsed, p.currency)} <span className="text-gray-400">/ {formatMoney(p.creditLimit, p.currency)}</span>{Number(p.creditLimit) > 0 && Number(p.creditUsed) / Number(p.creditLimit) >= 0.8 && <Badge label="≥80%" variant="orange" size="sm" />}</span> },
    { key: "debits", header: "Bookings (period)", render: (p) => formatMoney(p.period.bookingDebits, p.currency) },
    { key: "refunds", header: "Refunds", render: (p) => formatMoney(p.period.refunds, p.currency) },
    { key: "act", header: "", render: (p) => <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setDetail(p)}>Reconcile</Button>{canEdit && <Button variant="outline" size="sm" onClick={() => setRecordFor(p)}>Record</Button>}</div> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Settlements" />
      <PageCard><div className="flex flex-wrap items-end gap-3"><Input label="From" type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /><Input label="To" type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></div></PageCard>
      <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage="No active partners" />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}
      {recordFor && <RecordDialog row={recordFor} onClose={() => setRecordFor(null)} />}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? `Reconciliation · ${detail.legalName}` : ""} size="xl" footer={<div className="flex justify-end"><Button variant="secondary" onClick={() => setDetail(null)}>Close</Button></div>}>
        {detailData ? <SettlementReport s={detailData.data} /> : <div className="flex justify-center py-10"><Spinner /></div>}
      </Modal>
    </div>
  );
}
