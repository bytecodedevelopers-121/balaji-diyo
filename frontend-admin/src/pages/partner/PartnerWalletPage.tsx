import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { LEDGER_TYPE_LABEL, formatMoney } from "@/components/b2b/b2b-helpers";
import { CreditBar } from "@/components/b2b/WalletWidgets";
import { useInitiateTopUp, useLedger, useWalletSummary } from "@/hooks/queries/useB2B";
import { useAuthStore } from "@/store/auth.store";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { LedgerEntry, LedgerEntryType } from "@/types/b2b";

const TYPE_VARIANT: Record<LedgerEntryType, BadgeVariant> = {
  WALLET_TOPUP: "green", BOOKING_DEBIT: "blue", CREDIT_LINE_DRAW: "orange", CREDIT_LINE_REPAYMENT: "teal", REFUND_CREDIT: "purple", COMMISSION_CREDIT: "cyan", ADJUSTMENT: "gray",
};

export default function PartnerWalletPage() {
  const role = useAuthStore((s) => s.user?.b2bRole);
  const canFinance = role === "AGENCY_ADMIN" || role === "FINANCE_MANAGER";
  const { data, isLoading } = useWalletSummary();
  const [page, setPage] = useState(1);
  const [entryType, setEntryType] = useState<LedgerEntryType | "">("");
  const [account, setAccount] = useState<"WALLET" | "CREDIT" | "">("");
  const { data: ledger, isLoading: ledgerLoading } = useLedger({ page, perPage: 20, entryType: entryType || undefined, account: account || undefined }, canFinance);
  const topUp = useInitiateTopUp();
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const meta = ledger?.data.meta;

  if (isLoading || !data) return <div className="flex justify-center py-20"><Spinner /></div>;
  const w = data.data;

  const submitTopUp = () => {
    setError(null);
    topUp.mutate(
      { amount: Number(amount) },
      { onSuccess: (r) => { window.location.assign(r.data.paymentUrl); }, onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  };

  const columns: DataTableColumn<LedgerEntry>[] = [
    { key: "date", header: "Date", render: (e) => <span className="whitespace-nowrap text-gray-600">{formatDate(e.createdAt)}</span> },
    { key: "type", header: "Type", render: (e) => <Badge label={LEDGER_TYPE_LABEL[e.entryType]} variant={TYPE_VARIANT[e.entryType]} size="sm" /> },
    { key: "desc", header: "Description", render: (e) => <span className="text-gray-700">{e.description ?? "—"}</span> },
    { key: "acct", header: "Account", render: (e) => (e.account === "WALLET" ? "Wallet" : "Credit") },
    { key: "amt", header: "Amount", render: (e) => <span className={e.direction === "CREDIT" ? "font-medium text-green-700" : "font-medium text-gray-900"}>{e.direction === "CREDIT" ? "+" : "−"}{formatMoney(e.amount, e.currency)}</span> },
    { key: "bal", header: "Wallet after", render: (e) => formatMoney(e.balanceAfter, e.currency) },
    { key: "used", header: "Credit used after", render: (e) => formatMoney(e.creditUsedAfter, e.currency) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet & credit" action={canFinance ? <Button onClick={() => { setError(null); setShowTopUp(true); }}>Top up wallet</Button> : undefined} />
      {w.alert.atOrAboveThreshold && (
        <Alert variant="warning" title="Credit limit almost reached" message={`You've used ${Number(w.utilizationPct)}% of your credit line (${formatMoney(w.creditUsed, w.currency)} of ${formatMoney(w.creditLimit, w.currency)}). Arrange a repayment to keep booking on credit.`} />
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <PageCard><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Wallet balance</p><p className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(w.walletBalance, w.currency)}</p></PageCard>
        <PageCard><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Credit available</p><p className="mt-1 text-2xl font-semibold text-gray-900">{w.creditEnabled ? formatMoney(w.creditAvailable, w.currency) : "—"}</p>{!w.creditEnabled && <p className="text-xs text-gray-500">No credit line on this account</p>}</PageCard>
        <PageCard><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Credit used / limit</p><p className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(w.creditUsed, w.currency)} <span className="text-base font-normal text-gray-500">/ {formatMoney(w.creditLimit, w.currency)}</span></p></PageCard>
      </div>
      {w.creditEnabled && (
        <PageCard>
          <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-gray-900">Credit utilization</span><span className="flex items-center gap-1 text-gray-600">{w.alert.atOrAboveThreshold && <AlertTriangle className="h-4 w-4 text-amber-600" />}{Number(w.utilizationPct)}%</span></div>
          <CreditBar utilizationPct={Number(w.utilizationPct)} thresholdPct={Number(w.alert.thresholdPct)} />
        </PageCard>
      )}

      {canFinance ? (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-logo-navy-dark">Statement</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select aria-label="Entry type" value={entryType} placeholder="All entry types" options={(Object.keys(LEDGER_TYPE_LABEL) as LedgerEntryType[]).map((t) => ({ value: t, label: LEDGER_TYPE_LABEL[t] }))} onChange={(e) => { setEntryType(e.target.value as LedgerEntryType | ""); setPage(1); }} />
            <Select aria-label="Account" value={account} placeholder="Wallet & credit" options={[{ value: "WALLET", label: "Wallet only" }, { value: "CREDIT", label: "Credit only" }]} onChange={(e) => { setAccount(e.target.value as "WALLET" | "CREDIT" | ""); setPage(1); }} />
          </div>
          <DataTable columns={columns} data={ledger?.data.items ?? []} isLoading={ledgerLoading} emptyMessage="No transactions yet" />
          {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}
        </div>
      ) : (
        <p className="text-sm text-gray-500">The transaction statement is available to agency admins and finance managers.</p>
      )}

      <Modal isOpen={showTopUp} onClose={() => setShowTopUp(false)} title="Top up wallet" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowTopUp(false)}>Cancel</Button><Button onClick={submitTopUp} isLoading={topUp.isPending} disabled={!(Number(amount) > 0)}>Continue to payment</Button></div>}>
        <div className="space-y-3">
          {error && <Alert variant="error" message={error} />}
          <Input label={`Amount (${w.currency})`} type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} hint="You'll be redirected to the secure payment page. The wallet is credited as soon as the payment is confirmed." />
        </div>
      </Modal>
    </div>
  );
}
