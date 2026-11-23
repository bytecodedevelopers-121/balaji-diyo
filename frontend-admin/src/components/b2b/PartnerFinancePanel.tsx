import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/table/Pagination";
import { LEDGER_TYPE_LABEL, formatMoney } from "@/components/b2b/b2b-helpers";
import { CreditBar } from "@/components/b2b/WalletWidgets";
import { useLedgerAdjustment, usePartnerLedger, usePartnerWallet } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { LedgerAdjustmentInput } from "@/types/b2b";

type Mode = "ADJUSTMENT" | "CREDIT_LINE_REPAYMENT" | "CREDIT_LIMIT";

/** Admin view of one partner's wallet/credit, with repayment, adjustment and credit-limit actions. */
export function PartnerFinancePanel({ partnerId }: { partnerId: string }) {
  const canEdit = usePermission("update:b2b_finance");
  const { data } = usePartnerWallet(partnerId);
  const [page, setPage] = useState(1);
  const { data: ledger } = usePartnerLedger(partnerId, { page, perPage: 8 });
  const adjust = useLedgerAdjustment(partnerId);
  const [mode, setMode] = useState<Mode | null>(null);
  const [account, setAccount] = useState<"WALLET" | "CREDIT">("WALLET");
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const w = data?.data;
  const meta = ledger?.data.meta;
  if (!w) return null;

  const open = (m: Mode) => { setMode(m); setAmount(""); setDescription(""); setError(null); setAccount("WALLET"); setDirection("CREDIT"); };
  const submit = () => {
    if (!mode) return;
    setError(null);
    const num = Number(amount);
    if (!(num >= 0) || (mode !== "CREDIT_LIMIT" && !(num > 0))) return setError("Enter a valid amount.");
    const body: LedgerAdjustmentInput =
      mode === "ADJUSTMENT" ? { kind: "ADJUSTMENT", account, direction, amount: num, description }
      : mode === "CREDIT_LINE_REPAYMENT" ? { kind: "CREDIT_LINE_REPAYMENT", amount: num, ...(description ? { description } : {}) }
      : { kind: "CREDIT_LIMIT", creditLimit: num, description };
    adjust.mutate(body, { onSuccess: () => setMode(null), onError: (e) => setError(getDetailedErrorMessage(e)) });
  };

  return (
    <PageCard>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900">Wallet &amp; credit</h2>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => open("ADJUSTMENT")}>Adjust balance</Button>
            <Button variant="outline" size="sm" onClick={() => open("CREDIT_LINE_REPAYMENT")} disabled={Number(w.creditUsed) <= 0}>Record repayment</Button>
            <Button variant="outline" size="sm" onClick={() => open("CREDIT_LIMIT")}>Set credit limit</Button>
          </div>
        )}
      </div>
      {w.alert.atOrAboveThreshold && <div className="mb-3"><Alert variant="warning" title="Credit utilization ≥ 80%" message={`${Number(w.utilizationPct)}% of the limit is in use.`} /></div>}
      <div className="grid gap-3 text-sm sm:grid-cols-4">
        <div><p className="text-xs uppercase text-gray-500">Wallet</p><p className="text-lg font-semibold">{formatMoney(w.walletBalance, w.currency)}</p></div>
        <div><p className="text-xs uppercase text-gray-500">Credit limit</p><p className="text-lg font-semibold">{formatMoney(w.creditLimit, w.currency)}</p></div>
        <div><p className="text-xs uppercase text-gray-500">Credit used</p><p className="text-lg font-semibold">{formatMoney(w.creditUsed, w.currency)}</p></div>
        <div><p className="text-xs uppercase text-gray-500">Available</p><p className="text-lg font-semibold">{formatMoney(w.creditAvailable, w.currency)}</p></div>
      </div>
      {w.creditEnabled && (
        <div className="mt-3"><div className="mb-1 flex items-center gap-1 text-xs text-gray-600">{w.alert.atOrAboveThreshold && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}Utilization {Number(w.utilizationPct)}%</div><CreditBar utilizationPct={Number(w.utilizationPct)} thresholdPct={Number(w.alert.thresholdPct)} /></div>
      )}

      <h3 className="mb-1 mt-5 text-sm font-semibold text-gray-900">Ledger (immutable)</h3>
      <ul className="divide-y divide-gray-100 text-sm">
        {(ledger?.data.items ?? []).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
            <span className="flex items-center gap-2"><span className="text-xs text-gray-500">{formatDate(e.createdAt)}</span> {LEDGER_TYPE_LABEL[e.entryType]} <Badge label={e.account.toLowerCase()} variant="gray" size="sm" /> <span className="text-gray-500">{e.description}</span></span>
            <span className={e.direction === "CREDIT" ? "font-medium text-green-700" : "font-medium"}>{e.direction === "CREDIT" ? "+" : "−"}{formatMoney(e.amount, e.currency)} <span className="text-xs font-normal text-gray-400">→ {formatMoney(e.balanceAfter, e.currency)}</span></span>
          </li>
        ))}
        {ledger && ledger.data.items.length === 0 && <li className="py-2 text-gray-500">No ledger entries yet.</li>}
      </ul>
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}

      <Modal isOpen={!!mode} onClose={() => setMode(null)} size="sm"
        title={mode === "ADJUSTMENT" ? "Adjust balance" : mode === "CREDIT_LINE_REPAYMENT" ? "Record credit repayment" : "Set credit limit"}
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setMode(null)}>Cancel</Button><Button onClick={submit} isLoading={adjust.isPending}>Post</Button></div>}>
        <div className="space-y-3">
          {error && <Alert variant="error" message={error} />}
          {mode === "ADJUSTMENT" && (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Account" value={account} options={[{ value: "WALLET", label: "Wallet" }, { value: "CREDIT", label: "Credit used" }]} onChange={(e) => setAccount(e.target.value as "WALLET" | "CREDIT")} />
              <Select label="Direction" value={direction} options={[{ value: "CREDIT", label: account === "WALLET" ? "Add funds" : "Reduce credit used" }, { value: "DEBIT", label: account === "WALLET" ? "Remove funds" : "Increase credit used" }]} onChange={(e) => setDirection(e.target.value as "CREDIT" | "DEBIT")} />
            </div>
          )}
          <Input label={mode === "CREDIT_LIMIT" ? "New credit limit (USD)" : "Amount (USD)"} type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} hint={mode === "CREDIT_LIMIT" ? `Currently ${formatMoney(w.creditLimit, w.currency)}; cannot go below credit already used.` : undefined} />
          <Input label={mode === "CREDIT_LINE_REPAYMENT" ? "Reference (optional)" : "Reason (required)"} value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="text-xs text-gray-500">Posts an immutable ledger entry (credit-limit changes are recorded in the activity log) and can't be edited afterwards — mistakes are corrected with a new entry.</p>
        </div>
      </Modal>
    </PageCard>
  );
}
