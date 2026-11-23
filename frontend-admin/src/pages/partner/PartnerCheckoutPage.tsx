import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Spinner } from "@/components/ui/Spinner";
import { HoldCountdown } from "@/components/b2b/HoldCountdown";
import { TravellerFields } from "@/components/b2b/TravellerFields";
import { cleanTravellers, resizeTravellers, validateTravellers } from "@/components/b2b/traveller-form";
import { BookingStatusBadge } from "@/components/b2b/b2b-ui";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { useHold, useInstantBooking, useOnRequestBooking, useQuote, useWalletSummary } from "@/hooks/queries/useB2B";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { AnyB2BBooking, FundingMethod, MarkupMode, Quote, TravellerInput } from "@/types/b2b";

const FUNDING: { value: FundingMethod; label: string; hint: string }[] = [
  { value: "WALLET", label: "Wallet", hint: "Pay from your prepaid balance" },
  { value: "CREDIT", label: "Credit line", hint: "Draw on your postpaid credit limit" },
  { value: "WALLET_THEN_CREDIT", label: "Wallet, then credit", hint: "Use the wallet first and draw the rest on credit" },
];

/**
 * Checkout for a seat hold (?holdId=) or a direct booking (?departureId=&packageId=&pax=).
 * The price shown is the server's quote; the server recomputes it again on confirmation.
 */
export default function PartnerCheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const holdId = params.get("holdId") ?? "";
  const { data: holdRes, isLoading: holdLoading, isError: holdError } = useHold(holdId);
  const hold = holdRes?.data;

  const departureId = hold?.departureId ?? params.get("departureId") ?? "";
  const packageId = hold?.departure.package.id ?? params.get("packageId") ?? "";
  const pax = hold?.seatsHeld ?? Number(params.get("pax") ?? "0");
  const markup = params.get("markup") ?? "";
  const markupMode = (params.get("mode") as MarkupMode | null) ?? "TOTAL";

  const quoteM = useQuote();
  const { data: walletRes } = useWalletSummary();
  const wallet = walletRes?.data;
  const instant = useInstantBooking();
  const onRequest = useOnRequestBooking();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [travellers, setTravellers] = useState<TravellerInput[]>([]);
  const [funding, setFunding] = useState<FundingMethod>("WALLET");
  const [asRequest, setAsRequest] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnyB2BBooking | null>(null);

  const ready = !!departureId && !!packageId && pax >= 1 && (!holdId || !!hold);
  const mutateQuote = quoteM.mutate;
  useEffect(() => {
    if (!ready) return;
    mutateQuote(
      { packageId, departureId, paxCount: pax, ...(markup !== "" ? { agentMarkup: Number(markup), agentMarkupMode: markupMode } : {}) },
      { onSuccess: (r) => setQuote(r.data), onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  }, [ready, packageId, departureId, pax, markup, markupMode, mutateQuote]);

  const rows = useMemo(() => resizeTravellers(travellers, Math.max(pax, 0)), [travellers, pax]);

  const net = Number(quote?.netPayable ?? 0);
  const available = {
    WALLET: Number(wallet?.walletBalance ?? 0) >= net,
    CREDIT: !!wallet?.creditEnabled && Number(wallet?.creditAvailable ?? 0) >= net,
    WALLET_THEN_CREDIT: Number(wallet?.walletBalance ?? 0) + (wallet?.creditEnabled ? Number(wallet?.creditAvailable ?? 0) : 0) >= net,
  } satisfies Record<FundingMethod, boolean>;

  if (!holdId && !(departureId && packageId && pax >= 1)) {
    return <Alert variant="warning" message="Nothing to check out. Pick a departure from the catalog first." />;
  }
  if (holdId && holdLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (holdId && (holdError || !hold)) return <Alert variant="error" message="This hold could not be found." />;

  const submit = () => {
    setError(null);
    const problem = validateTravellers(rows);
    if (problem) return setError(problem);
    const body = {
      travellers: cleanTravellers(rows), fundingMethod: funding,
      ...(markup !== "" ? { agentMarkup: Number(markup), agentMarkupMode: markupMode } : {}),
    };
    const done = { onSuccess: (r: { data: AnyB2BBooking }) => setResult(r.data), onError: (e: unknown) => setError(getDetailedErrorMessage(e)) };
    if (asRequest) {
      onRequest.mutate({ kind: "DEPARTURE", departureId, paxCount: pax, specialRequirement: note || undefined, ...body }, done);
    } else {
      instant.mutate(holdId ? { holdId, ...body } : { departureId, paxCount: pax, ...body }, done);
    }
  };

  if (result) {
    const isBooking = result.kind === "BOOKING";
    return (
      <div className="space-y-4">
        <PageHeader title={result.b2bStatus === "CONFIRMED" ? "Booking confirmed" : "Request submitted"} />
        <PageCard>
          <div className="flex flex-wrap items-center gap-3">
            {isBooking && <span className="font-mono text-lg font-semibold">{result.reference}</span>}
            <BookingStatusBadge status={result.b2bStatus} />
          </div>
          {result.b2bStatus === "PENDING_APPROVAL" ? (
            <p className="mt-3 text-sm text-gray-600">Our operations team will review this request. Your wallet and credit are not charged until it is approved; any seats that could be reserved are held while we review.</p>
          ) : (
            isBooking && <p className="mt-3 text-sm text-gray-600">{formatMoney(result.netPayable ?? 0, "USD")} was settled from your {result.paymentOptions === "B2B_CREDIT" ? "credit line" : result.paymentOptions === "B2B_SPLIT" ? "wallet and credit line" : "wallet"}.</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate(PATHS.PARTNER_BOOKING(result.id))}>View booking</Button>
            <Button variant="outline" onClick={() => navigate(PATHS.PARTNER_CATALOG)}>Back to catalog</Button>
          </div>
        </PageCard>
      </div>
    );
  }

  const blockers = quote?.reasons ?? [];
  const seatShortage = blockers.length > 0 && blockers.every((b) => b.code === "INSUFFICIENT_SEATS");
  const canInstant = !!quote && quote.eligible;
  const mustRequest = !canInstant && seatShortage;
  const requestMode = asRequest || mustRequest;
  const cur = quote?.currency ?? "USD";
  const busy = instant.isPending || onRequest.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Checkout" backHref={PATHS.PARTNER_PACKAGE(packageId)} />
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">Summary</h2>
        {!quote ? (
          quoteM.isPending ? <Spinner /> : <p className="text-sm text-gray-500">No quote available.</p>
        ) : (
          <>
            {blockers.filter((b) => !(requestMode && b.code === "INSUFFICIENT_SEATS")).map((b) => <div key={b.code} className="mb-2"><Alert variant="error" message={b.message} /></div>)}
            {mustRequest && <div className="mb-2"><Alert variant="warning" message="Not enough seats for an instant booking. You can submit this as an on-request booking for approval." /></div>}
            <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex justify-between"><dt className="text-gray-600">Package</dt><dd className="font-medium">{quote.packageTitle}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-600">Departure</dt><dd className="font-medium">{formatDate(quote.travelDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-600">Travellers</dt><dd className="font-medium">{quote.paxCount}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-600">{quote.rateType === "NET" ? "Net rate" : "List price"} / person</dt><dd>{formatMoney(quote.unitPrice, cur)}</dd></div>
              {quote.rateType === "COMMISSIONABLE" && <div className="flex justify-between"><dt className="text-gray-600">Your commission ({Number(quote.commissionPct ?? 0)}%)</dt><dd>− {formatMoney(quote.commissionAmount, cur)}</dd></div>}
              {Number(quote.agentMarkup) > 0 && <div className="flex justify-between"><dt className="text-gray-600">Your markup</dt><dd>+ {formatMoney(quote.agentMarkup, cur)}</dd></div>}
              <div className="flex justify-between border-t border-gray-100 pt-1 font-semibold sm:col-span-1"><dt>You pay us (net)</dt><dd>{formatMoney(quote.netPayable, cur)}</dd></div>
              <div className="flex justify-between border-t border-gray-100 pt-1 font-semibold"><dt>Your client sees</dt><dd>{formatMoney(quote.clientDisplayAmount, cur)}</dd></div>
            </dl>
            {hold && <p className="mt-3 text-sm text-gray-600">Seats held for you: <HoldCountdown expiresAt={hold.expiresAt} /></p>}
          </>
        )}
      </PageCard>

      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">Payment method</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {FUNDING.map((f) => {
            const ok = available[f.value];
            return (
              <label key={f.value} className={`cursor-pointer rounded-xl border p-3 text-sm ${funding === f.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200"} ${!ok ? "opacity-60" : ""}`}>
                <input type="radio" name="funding" className="mr-2" checked={funding === f.value} onChange={() => setFunding(f.value)} />
                <span className="font-semibold text-gray-900">{f.label}</span>
                <p className="mt-1 text-xs text-gray-500">{f.hint}</p>
                {!ok && quote && <p className="mt-1 text-xs text-red-600">Not enough funds for {formatMoney(net, cur)}</p>}
              </label>
            );
          })}
        </div>
        {wallet && (
          <p className="mt-3 text-xs text-gray-500">
            Wallet {formatMoney(wallet.walletBalance, wallet.currency)} · Credit available {formatMoney(wallet.creditAvailable, wallet.currency)} ·{" "}
            <Link to={PATHS.PARTNER_WALLET} className="text-indigo-600 hover:underline">Top up</Link>
          </p>
        )}
        {requestMode && <p className="mt-2 text-xs text-gray-500">For on-request bookings nothing is charged until approval; funds are checked then.</p>}
      </PageCard>

      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">Travellers</h2>
        <TravellerFields travellers={rows} onChange={setTravellers} disabled={busy} />
        {requestMode && <div className="mt-3"><Textarea label="Special requests (optional)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></div>}
      </PageCard>

      <div className="flex flex-wrap items-center gap-3">
        {canInstant && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={asRequest} onChange={(e) => setAsRequest(e.target.checked)} /> Submit as on-request (needs approval) instead
          </label>
        )}
        <Button onClick={submit} isLoading={busy} disabled={!quote || (!canInstant && !mustRequest)}>
          {requestMode ? "Submit request" : `Confirm & pay ${quote ? formatMoney(quote.netPayable, cur) : ""}`}
        </Button>
      </div>
    </div>
  );
}
