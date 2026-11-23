import { useState } from "react";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { HoldCountdown } from "@/components/b2b/HoldCountdown";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { useNow } from "@/hooks/useNow";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@/constants/PATHS";
import { useCreateHold, useQuote, useReleaseHold } from "@/hooks/queries/useB2B";
import { useAuthStore } from "@/store/auth.store";
import { getDetailedErrorMessage, getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { CatalogDeparture, Hold, MarkupMode, Quote } from "@/types/b2b";

interface Props {
  packageId: string;
  departures: CatalogDeparture[];
  initialDepartureId?: string;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <dt className="text-gray-600">{label}</dt>
      <dd className={strong ? "font-semibold text-gray-900" : "text-gray-900"}>{value}</dd>
    </div>
  );
}

/** Quote calculator (server-priced) plus the timed seat hold for the chosen departure. */
export function QuoteHoldPanel({ packageId, departures, initialDepartureId }: Props) {
  const now = useNow(1000);
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.b2bRole);
  const canHold = role === "AGENCY_ADMIN" || role === "BOOKING_AGENT";
  const quoteMutation = useQuote();
  const holdMutation = useCreateHold();
  const releaseMutation = useReleaseHold();

  const [departureId, setDepartureId] = useState(initialDepartureId ?? (departures.find((d) => d.bookable) ?? departures[0])?.id ?? "");
  const [pax, setPax] = useState("2");
  const [markup, setMarkup] = useState("");
  const [mode, setMode] = useState<MarkupMode>("TOTAL");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paxCount = Number(pax);
  const validPax = Number.isInteger(paxCount) && paxCount >= 1 && paxCount <= 500;

  const getQuote = () => {
    setError(null);
    setQuote(null);
    quoteMutation.mutate(
      { packageId, departureId, paxCount, ...(markup !== "" ? { agentMarkup: Number(markup), agentMarkupMode: mode } : {}) },
      { onSuccess: (r) => setQuote(r.data), onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  };

  const doHold = () => {
    setError(null);
    holdMutation.mutate(
      { departureId, seatsHeld: paxCount },
      { onSuccess: (r) => setHold(r.data), onError: (e) => setError(getErrorMessage(e)) },
    );
  };

  const doRelease = () => {
    if (!hold) return;
    setError(null);
    releaseMutation.mutate(hold.id, { onSuccess: () => setHold(null), onError: (e) => setError(getErrorMessage(e)) });
  };

  const checkoutQuery = () => {
    const p = new URLSearchParams({ packageId, departureId, pax: String(paxCount) });
    if (markup !== "") { p.set("markup", markup); p.set("mode", mode); }
    return p.toString();
  };

  const holdActive = hold && new Date(hold.expiresAt).getTime() > now;
  const cur = quote?.currency ?? "USD";

  return (
    <PageCard>
      <h2 className="mb-3 font-semibold text-gray-900">Quote &amp; hold seats</h2>
      {error && <div className="mb-3"><Alert variant="error" message={error} onClose={() => setError(null)} /></div>}

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Departure"
          value={departureId}
          options={departures.map((d) => ({ value: d.id, label: `${formatDate(d.departureDate)}${d.bookable ? "" : " (not bookable)"}` }))}
          onChange={(e) => { setDepartureId(e.target.value); setQuote(null); }}
        />
        <Input label="Travellers" type="number" min={1} value={pax} onChange={(e) => { setPax(e.target.value); setQuote(null); }} error={validPax ? undefined : "Enter 1–500"} />
        <Input label="Your markup (optional)" type="number" min={0} step="0.01" value={markup} onChange={(e) => { setMarkup(e.target.value); setQuote(null); }} />
        <Select label="Markup applies" value={mode} options={[{ value: "TOTAL", label: "To the whole booking" }, { value: "PER_PAX", label: "Per traveller" }]} onChange={(e) => { setMode(e.target.value as MarkupMode); setQuote(null); }} />
      </div>
      <div className="mt-3">
        <Button onClick={getQuote} isLoading={quoteMutation.isPending} disabled={!validPax || !departureId}>Calculate quote</Button>
      </div>

      {quote && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4">
          {quote.reasons.map((r) => <div key={r.code} className="mb-2"><Alert variant="error" message={r.message} /></div>)}
          {quote.warnings.map((w) => <div key={w.code} className="mb-2"><Alert variant="info" message={w.message} /></div>)}
          <dl className="divide-y divide-gray-100">
            <Row label={quote.rateType === "NET" ? "Net rate per person" : "List price per person"} value={formatMoney(quote.unitPrice, cur)} />
            <Row label={quote.rateType === "NET" ? `Net total (${quote.paxCount} pax)` : `List total (${quote.paxCount} pax)`} value={formatMoney(quote.grossAmount, cur)} />
            {quote.rateType === "COMMISSIONABLE" && <Row label={`Your commission (${Number(quote.commissionPct ?? 0)}%)`} value={`− ${formatMoney(quote.commissionAmount, cur)}`} />}
            <Row label="You pay us" value={formatMoney(quote.netPayable, cur)} strong />
            {Number(quote.agentMarkup) > 0 && <Row label="Your markup" value={`+ ${formatMoney(quote.agentMarkup, cur)}`} />}
            <Row label="Your client sees" value={formatMoney(quote.clientDisplayAmount, cur)} strong />
          </dl>
          <p className="mt-2 text-xs text-gray-500">
            Rate source: {quote.rateSource.replace(/_/g, " ").toLowerCase()}
            {quote.availability && quote.availability.available !== null && ` · ${quote.availability.available} seats available`}
            {quote.cutoffAt && ` · booking cut-off ${formatDate(quote.cutoffAt)}`}
          </p>
          {canHold && !holdActive && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={doHold} isLoading={holdMutation.isPending} disabled={!quote.eligible}>Hold {quote.paxCount} seat{quote.paxCount > 1 ? "s" : ""}</Button>
              <Button variant="outline" onClick={() => navigate(`${PATHS.PARTNER_CHECKOUT}?${checkoutQuery()}`)}>
                {quote.eligible ? "Book now" : "Request booking"}
              </Button>
            </div>
          )}
        </div>
      )}

      {hold && (
        <div className={`mt-4 rounded-xl border p-4 ${holdActive ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{holdActive ? "Seats held" : "Hold expired"} — {hold.seatsHeld} seat{hold.seatsHeld > 1 ? "s" : ""}</p>
              <p className="text-gray-600">{hold.departure.package.title} · {formatDate(hold.departure.departureDate)}</p>
            </div>
            <div className="flex items-center gap-3">
              <HoldCountdown expiresAt={hold.expiresAt} className="text-base" />
              {holdActive && <Button size="sm" onClick={() => navigate(`${PATHS.PARTNER_CHECKOUT}?holdId=${hold.id}${markup !== "" ? `&markup=${markup}&mode=${mode}` : ""}`)}>Checkout</Button>}
              {holdActive && <Button variant="outline" size="sm" onClick={doRelease} isLoading={releaseMutation.isPending}>Release hold</Button>}
            </div>
          </div>
        </div>
      )}
    </PageCard>
  );
}
