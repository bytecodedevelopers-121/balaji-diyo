import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { useSettlementSummary } from "@/hooks/queries/useB2B";
import { b2bSettlementService } from "@/services/b2b.service";
import { getErrorMessage } from "@/lib/apiError";
import type { SettlementSummary } from "@/types/b2b";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const today = () => new Date();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <PageCard><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>{hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}</PageCard>;
}

export function SettlementReport({ s }: { s: SettlementSummary }) {
  const c = s.currency;
  const m = (v: string) => formatMoney(v, c);
  const rows: [string, string, string, string, string][] = ["CONFIRMED", "AMENDMENT_REQUESTED", "PENDING_APPROVAL", "CANCELLED"].map((k) => {
    const r = s.bookings.byStatus[k];
    return [k.replace(/_/g, " ").toLowerCase().replace(/^\w/, (x) => x.toUpperCase()), String(r?.count ?? 0), m(r?.netPayable ?? "0"), m(r?.commission ?? "0"), m(r?.agentMarkup ?? "0")];
  });
  const p = s.position;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Bookings" value={String(s.bookings.totals.count)} hint={`Active net ${m(s.bookings.totals.netPayable)}`} />
        <Card label="Commission (net)" value={m(s.commission.net)} hint={`Earned ${m(s.commission.earned)} · reversed ${m(s.commission.reversed)}`} />
        <Card label="Your markup" value={m(s.agentMarkup)} hint="On active bookings" />
        <Card label="Net debits / refunds" value={`${m(s.ledger.bookingDebits)} / ${m(s.ledger.refunds)}`} hint={`Penalties retained ${m(s.ledger.cancellationPenaltiesRetained)}`} />
      </div>
      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">Bookings by status</h2>
        <table className="w-full text-left text-sm">
          <thead><tr className="text-xs uppercase tracking-wide text-gray-500"><th className="py-2">Status</th><th>Count</th><th>Net payable</th><th>Commission</th><th>Markup</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{rows.map((r) => <tr key={r[0]}>{r.map((v, i) => <td key={i} className="py-2">{v}</td>)}</tr>)}</tbody>
        </table>
      </PageCard>
      <PageCard>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-gray-900">Wallet &amp; credit position</h2><Badge label={p.reconciles ? "Reconciled" : "Does not reconcile"} variant={p.reconciles ? "green" : "red"} /></div>
        <table className="w-full text-left text-sm">
          <thead><tr className="text-xs uppercase tracking-wide text-gray-500"><th className="py-2" /><th>Opening</th><th>Movement</th><th>Closing</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 font-medium">Wallet</td><td>{m(p.opening.wallet)}</td><td>{m(p.movement.wallet)}</td><td>{m(p.closing.wallet)}</td></tr>
            <tr><td className="py-2 font-medium">Credit used</td><td>{m(p.opening.creditUsed)}</td><td>{m(p.movement.creditUsed)}</td><td>{m(p.closing.creditUsed)}</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">Now: wallet {m(p.current.wallet)} · credit used {m(p.current.creditUsed)} of {m(p.current.creditLimit)} (available {m(p.current.creditAvailable)}). Top-ups {m(s.ledger.topUps)} · repayments {m(s.ledger.repayments)} · commission payouts {m(s.ledger.commissionPayouts)}.</p>
      </PageCard>
      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">Ledger activity</h2>
        {s.ledger.byType.length === 0 ? <p className="text-sm text-gray-500">No ledger movements in this period.</p> : (
          <table className="w-full text-left text-sm">
            <thead><tr className="text-xs uppercase tracking-wide text-gray-500"><th className="py-2">Type</th><th>Account</th><th>Direction</th><th>Entries</th><th>Total</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{s.ledger.byType.map((r, i) => <tr key={i}><td className="py-2">{r.entryType.replace(/_/g, " ").toLowerCase()}</td><td>{r.account.toLowerCase()}</td><td>{r.direction.toLowerCase()}</td><td>{r.count}</td><td>{m(r.amount)}</td></tr>)}</tbody>
          </table>
        )}
      </PageCard>
    </div>
  );
}

export default function PartnerSettlementsPage() {
  const [from, setFrom] = useState(() => iso(daysAgo(30)));
  const [to, setTo] = useState(() => iso(today()));
  const { data, isLoading, isError, error } = useSettlementSummary({ from, to });
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preset = (days: number) => { setFrom(iso(daysAgo(days))); setTo(iso(today())); };
  const exportCsv = async () => {
    setErr(null); setExporting(true);
    try { await b2bSettlementService.exportCsv({ from, to }); } catch (e) { setErr(getErrorMessage(e)); } finally { setExporting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settlements & statement" action={<Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} isLoading={exporting}>Export CSV</Button>} />
      <PageCard>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="From" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2 pb-0.5">
            <Button variant="ghost" size="sm" onClick={() => preset(7)}>7 days</Button>
            <Button variant="ghost" size="sm" onClick={() => preset(30)}>30 days</Button>
            <Button variant="ghost" size="sm" onClick={() => preset(90)}>90 days</Button>
          </div>
        </div>
      </PageCard>
      {err && <Alert variant="error" message={err} onClose={() => setErr(null)} />}
      {isError && <Alert variant="error" message={getErrorMessage(error)} />}
      {isLoading || !data ? <div className="flex justify-center py-16"><Spinner /></div> : <SettlementReport s={data.data} />}
    </div>
  );
}
