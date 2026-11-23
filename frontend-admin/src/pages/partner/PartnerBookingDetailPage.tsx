import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { TravellerFields } from "@/components/b2b/TravellerFields";
import { cleanTravellers, resizeTravellers, validateTravellers } from "@/components/b2b/traveller-form";
import { BookingStatusBadge } from "@/components/b2b/b2b-ui";
import { formatMoney } from "@/components/b2b/b2b-helpers";
import { useAmendBooking, useCancelBooking, useCatalogPackage, useMyBooking } from "@/hooks/queries/useB2B";
import { useAuthStore } from "@/store/auth.store";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { B2BBooking, TravellerInput } from "@/types/b2b";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-4 py-1 text-sm"><dt className="text-gray-600">{label}</dt><dd className={strong ? "font-semibold text-gray-900" : "text-gray-900"}>{value}</dd></div>;
}

function AmendModal({ booking, onClose }: { booking: B2BBooking; onClose: () => void }) {
  const amend = useAmendBooking();
  const { data: pkg } = useCatalogPackage(booking.packageId ?? "");
  const [reason, setReason] = useState("");
  const [pax, setPax] = useState(String(booking.numberOfTraveller));
  const [departureId, setDepartureId] = useState(booking.departureId ?? "");
  const [editTravellers, setEditTravellers] = useState(false);
  const [travellers, setTravellers] = useState<TravellerInput[]>(
    booking.travellers.map((t) => ({ fullName: t.fullName, email: t.email, gender: t.gender ?? "", nationality: t.nationality, countryCode: t.countryCode, mobileNumber: t.mobileNumber ?? "", passportNo: t.passportNo ?? "", isLead: t.isLead })),
  );
  const [error, setError] = useState<string | null>(null);

  const newPax = Number(pax);
  const paxChanged = newPax !== booking.numberOfTraveller;
  const depChanged = !!departureId && departureId !== booking.departureId;
  const sendTravellers = paxChanged || editTravellers;
  const rows = resizeTravellers(travellers, newPax >= 1 ? newPax : 1);

  const submit = () => {
    setError(null);
    if (reason.trim().length < 3) return setError("Tell us why you need this change.");
    if (!Number.isInteger(newPax) || newPax < 1) return setError("Travellers must be at least 1.");
    if (!paxChanged && !depChanged && !editTravellers) return setError("Change the number of travellers, the departure, or the traveller details.");
    if (sendTravellers) { const p = validateTravellers(rows); if (p) return setError(p); }
    amend.mutate(
      { id: booking.id, reason: reason.trim(), changes: { ...(paxChanged ? { paxCount: newPax } : {}), ...(depChanged ? { departureId } : {}), ...(sendTravellers ? { travellers: cleanTravellers(rows) } : {}) } },
      { onSuccess: onClose, onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  };

  return (
    <Modal isOpen onClose={onClose} title="Request an amendment" size="xl" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} isLoading={amend.isPending}>Submit request</Button></div>}>
      <div className="space-y-3">
        {error && <Alert variant="error" message={error} />}
        <Alert variant="info" message="Changes are reviewed by our team. If the price changes, the difference is charged to (or refunded to) your wallet or credit line when approved." />
        <Textarea label="Reason" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Travellers" type="number" min={1} value={pax} onChange={(e) => setPax(e.target.value)} />
          <Select label="Departure" value={departureId} options={(pkg?.data.departures ?? []).map((d) => ({ value: d.id, label: `${formatDate(d.departureDate)}${d.id === booking.departureId ? " (current)" : ""}` }))} onChange={(e) => setDepartureId(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={editTravellers || paxChanged} disabled={paxChanged} onChange={(e) => setEditTravellers(e.target.checked)} /> Edit traveller details{paxChanged ? " (required when the count changes)" : ""}</label>
        {sendTravellers && <TravellerFields travellers={rows} onChange={setTravellers} disabled={amend.isPending} />}
      </div>
    </Modal>
  );
}

export default function PartnerBookingDetailPage() {
  const { id = "" } = useParams();
  const role = useAuthStore((s) => s.user?.b2bRole);
  const canAct = role === "AGENCY_ADMIN" || role === "BOOKING_AGENT";
  const { data, isLoading, isError } = useMyBooking(id);
  const cancel = useCancelBooking();
  const [showCancel, setShowCancel] = useState(false);
  const [showAmend, setShowAmend] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // The refund breakdown only exists in the cancel response; the refetch afterwards replaces the booking, so keep it here.
  const [cancellation, setCancellation] = useState<B2BBooking["cancellation"]>();

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (isError || !data) return <Alert variant="error" message="Booking not found." />;
  const b = data.data;

  if (b.kind === "CUSTOM") {
    return (
      <div className="space-y-4">
        <PageHeader title="Custom request" backHref={PATHS.PARTNER_BOOKINGS} action={<BookingStatusBadge status={b.b2bStatus} />} />
        <PageCard>
          <dl className="divide-y divide-gray-100">
            <Row label="Package" value={b.package.title} />
            <Row label="Dates" value={`${formatDate(b.startDate)}${b.endDate ? ` – ${formatDate(b.endDate)}` : ""}`} />
            <Row label="Travellers" value={String(b.numberOfTraveller)} />
            {b.netPayable && <Row label="Agreed net price" value={formatMoney(b.netPayable, "USD")} strong />}
          </dl>
          {b.specialRequirement && <p className="mt-3 text-sm text-gray-700">Request: {b.specialRequirement}</p>}
          {b.b2bStatusReason && <div className="mt-3"><Alert variant="info" title="Note from our team" message={b.b2bStatusReason} /></div>}
          {canAct && b.b2bStatus === "PENDING_APPROVAL" && (
            <div className="mt-4"><Button variant="danger" onClick={() => setShowCancel(true)}>Withdraw request</Button></div>
          )}
        </PageCard>
        <Modal isOpen={showCancel} onClose={() => setShowCancel(false)} title="Withdraw this request?" size="sm" footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowCancel(false)}>Keep</Button><Button variant="danger" isLoading={cancel.isPending} onClick={() => cancel.mutate({ id: b.id, reason: reason || undefined }, { onSuccess: () => setShowCancel(false), onError: (e) => setError(getDetailedErrorMessage(e)) })}>Withdraw</Button></div>}>
          {error && <Alert variant="error" message={error} />}
          <Textarea label="Reason (optional)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Modal>
      </div>
    );
  }

  const settlement = b.settlement;
  const pendingAmendment = b.amendments.find((a) => a.status === "PENDING");
  const canCancel = canAct && ["PENDING_APPROVAL", "CONFIRMED", "AMENDMENT_REQUESTED"].includes(b.b2bStatus);

  const doCancel = () => {
    setError(null);
    cancel.mutate({ id: b.id, reason: reason || undefined }, {
      onSuccess: (r) => { setCancellation((r.data as B2BBooking).cancellation); setShowCancel(false); },
      onError: (e) => setError(getDetailedErrorMessage(e)),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={b.reference} backHref={PATHS.PARTNER_BOOKINGS} breadcrumbs={[{ label: "Bookings", href: PATHS.PARTNER_BOOKINGS }, { label: b.reference }]} action={<BookingStatusBadge status={b.b2bStatus} />} />
      {b.b2bStatus === "PENDING_APPROVAL" && <Alert variant="info" title="Awaiting approval" message="Nothing has been charged yet. You'll be charged when our team approves this request." />}
      {pendingAmendment && <Alert variant="warning" title="Amendment pending" message={`Requested ${formatDate(pendingAmendment.createdAt)}: ${pendingAmendment.reason ?? ""}`} />}
      {b.b2bStatus === "CANCELLED" && <Alert variant="error" title="Cancelled" message={b.b2bStatusReason && b.b2bStatusReason !== "Cancelled" ? b.b2bStatusReason : "This booking was cancelled."} />}
      {cancellation && <Alert variant="success" title="Cancellation settled" message={`Paid ${formatMoney(cancellation.amountPaid, "USD")} · penalty ${formatMoney(cancellation.penalty, "USD")}${cancellation.penaltyPct !== null ? ` (${cancellation.penaltyPct}%)` : ""} · refunded ${formatMoney(cancellation.refund, "USD")} (wallet ${formatMoney(cancellation.refundedToWallet, "USD")}, credit ${formatMoney(cancellation.refundedToCredit, "USD")})`} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <PageCard>
          <h2 className="mb-2 font-semibold text-gray-900">Trip</h2>
          <dl className="divide-y divide-gray-100">
            <Row label="Package" value={b.package?.title ?? "—"} />
            <Row label="Departure" value={formatDate(b.startDate)} />
            <Row label="Return" value={formatDate(b.endDate)} />
            <Row label="Travellers" value={String(b.numberOfTraveller)} />
            <Row label="Lead" value={`${b.fullName} · ${b.email}`} />
          </dl>
        </PageCard>
        <PageCard>
          <h2 className="mb-2 font-semibold text-gray-900">Pricing</h2>
          <dl className="divide-y divide-gray-100">
            <Row label="Client price" value={formatMoney(b.totalPrice, "USD")} />
            <Row label="Your markup" value={formatMoney(b.agentMarkup ?? 0, "USD")} />
            <Row label="Commission" value={formatMoney(b.commissionAmount ?? 0, "USD")} />
            <Row label="Net payable" value={formatMoney(b.netPayable ?? 0, "USD")} strong />
            {settlement && <Row label="Paid from wallet / credit" value={`${formatMoney(settlement.walletPaid, "USD")} / ${formatMoney(settlement.creditDrawn, "USD")}`} />}
            {settlement && Number(settlement.refunded) > 0 && <Row label="Refunded" value={formatMoney(settlement.refunded, "USD")} />}
          </dl>
          {b.invoice && <p className="mt-3 text-xs text-gray-500">Invoice {b.invoice.transactionCode} · {formatMoney(b.invoice.invoiceAmount, "USD")} · {b.invoice.invoiceStatus === 1 ? "paid" : "unpaid"}{b.invoice.invoiceNote ? ` · ${b.invoice.invoiceNote}` : ""}</p>}
        </PageCard>
      </div>

      <PageCard>
        <h2 className="mb-2 font-semibold text-gray-900">Travellers</h2>
        <ul className="divide-y divide-gray-100 text-sm">
          {b.travellers.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="font-medium text-gray-900">{t.fullName} {t.isLead && <Badge label="Lead" variant="blue" size="sm" />}</span>
              <span className="text-gray-500">{t.email} · {t.nationality}{t.passportNo ? ` · ${t.passportNo}` : ""}</span>
            </li>
          ))}
        </ul>
      </PageCard>

      {b.amendments.length > 0 && (
        <PageCard>
          <h2 className="mb-2 font-semibold text-gray-900">Amendments</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {b.amendments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{formatDate(a.createdAt)} · {a.reason}</span>
                <span className="flex items-center gap-2">
                  {a.priceDelta !== null && <span className="text-gray-600">{Number(a.priceDelta) >= 0 ? "+" : "−"}{formatMoney(Math.abs(Number(a.priceDelta)), "USD")}</span>}
                  <Badge label={a.status.toLowerCase()} variant={a.status === "APPROVED" ? "green" : a.status === "REJECTED" ? "red" : "yellow"} size="sm" />
                </span>
              </li>
            ))}
          </ul>
        </PageCard>
      )}

      {canAct && (
        <div className="flex flex-wrap gap-2">
          {b.b2bStatus === "CONFIRMED" && <Button variant="outline" onClick={() => setShowAmend(true)}>Request amendment</Button>}
          {canCancel && <Button variant="danger" onClick={() => { setError(null); setShowCancel(true); }}>Cancel booking</Button>}
        </div>
      )}

      <Modal isOpen={showCancel} onClose={() => setShowCancel(false)} title={`Cancel ${b.reference}?`} size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowCancel(false)}>Keep booking</Button><Button variant="danger" isLoading={cancel.isPending} onClick={doCancel}>Cancel booking</Button></div>}>
        <div className="space-y-3">
          {error && <Alert variant="error" message={error} />}
          {b.b2bStatus !== "PENDING_APPROVAL" && <Alert variant="warning" message="A cancellation penalty may apply, based on how close the departure is: 30+ days free, 15–29 days 25%, 7–14 days 50%, under 7 days 100%. The refund goes back to where you paid from." />}
          <Textarea label="Reason (optional)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </Modal>
      {showAmend && <AmendModal booking={b} onClose={() => setShowAmend(false)} />}
    </div>
  );
}
