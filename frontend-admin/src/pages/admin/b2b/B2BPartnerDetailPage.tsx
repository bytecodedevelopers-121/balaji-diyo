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
import { PartnerFinancePanel } from "@/components/b2b/PartnerFinancePanel";
import { PartnerStatusBadge, RoleBadge } from "@/components/b2b/b2b-ui";
import { docTypeLabel, formatMoney } from "@/components/b2b/b2b-helpers";
import { useAdminPartner, useAdminTiers, usePartnerDecision, useReviewKycDocument } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { openKycFile } from "@/services/b2b.service";
import { getDetailedErrorMessage, getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import type { AdminPartnerDetail, KycDocument } from "@/types/b2b";

type Dialog = { kind: "reject-doc"; doc: KycDocument } | { kind: "reject" } | { kind: "suspend" } | null;

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export default function B2BPartnerDetailPage() {
  const { id = "" } = useParams();
  const canUpdate = usePermission("update:b2b_partner");
  const { data, isLoading, isError, error } = useAdminPartner(id);
  const { data: tiers } = useAdminTiers();
  const review = useReviewKycDocument(id);
  const decide = usePartnerDecision(id);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  // Edits to the commercial terms; undefined = untouched, so the form follows server data after each save.
  const [tierEdit, setTierEdit] = useState<string>();
  const [creditEdit, setCreditEdit] = useState<string>();
  const [currencyEdit, setCurrencyEdit] = useState<string>();

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (isError || !data) return <Alert variant="error" message={getErrorMessage(error)} />;
  const p: AdminPartnerDetail = data.data;

  const tierId = tierEdit ?? p.tier.id;
  const creditLimit = creditEdit ?? String(Number(p.wallet.creditLimit));
  const currency = currencyEdit ?? p.currency;
  const hasVerifiedDoc = p.kycDocuments.some((d) => d.isVerified);
  const fail = (e: unknown) => setMsg(getDetailedErrorMessage(e));
  const closeDialog = () => { setDialog(null); setReason(""); };
  const resetTerms = () => { setTierEdit(undefined); setCreditEdit(undefined); setCurrencyEdit(undefined); };

  const saveTerms = () => {
    setMsg(null);
    const body = {
      ...(tierId !== p.tier.id ? { tierId } : {}),
      ...(Number(creditLimit) !== Number(p.wallet.creditLimit) ? { creditLimit: Number(creditLimit) } : {}),
      ...(currency !== p.currency ? { currency } : {}),
    };
    if (Object.keys(body).length === 0) return setMsg("No changes to save.");
    decide.mutate(body, { onSuccess: resetTerms, onError: fail });
  };

  const approve = () => {
    setMsg(null);
    // Applies any edited terms in the same atomic request as the activation.
    decide.mutate(
      {
        status: "ACTIVE",
        ...(tierId !== p.tier.id ? { tierId } : {}),
        ...(creditEdit !== undefined ? { creditLimit: Number(creditLimit) } : {}),
        ...(currency !== p.currency ? { currency } : {}),
      },
      { onSuccess: resetTerms, onError: fail },
    );
  };

  const confirmDialog = () => {
    if (!dialog) return;
    setMsg(null);
    if (dialog.kind === "reject-doc") {
      review.mutate({ documentId: dialog.doc.id, action: "REJECT", notes: reason }, { onSuccess: closeDialog, onError: fail });
    } else {
      decide.mutate(
        { status: dialog.kind === "reject" ? "REJECTED" : "SUSPENDED", rejectionReason: reason || undefined },
        { onSuccess: closeDialog, onError: fail },
      );
    }
  };

  const canApprove = p.status === "PENDING_KYC" || p.status === "REJECTED" || p.status === "SUSPENDED";
  const needsDocToApprove = p.status !== "SUSPENDED" && !p.kycVerifiedAt && !hasVerifiedDoc;
  const dialogTitle = dialog?.kind === "reject-doc" ? "Reject document" : dialog?.kind === "reject" ? "Reject application" : "Suspend partner";
  const reasonRequired = dialog?.kind !== "suspend";

  return (
    <div className="space-y-6">
      <PageHeader title={p.legalName} backHref={PATHS.B2B_PARTNERS} breadcrumbs={[{ label: "B2B Partners", href: PATHS.B2B_PARTNERS }, { label: p.partnerCode }]} action={<PartnerStatusBadge status={p.status} />} />
      {msg && <Alert variant="error" message={msg} onClose={() => setMsg(null)} />}
      {p.rejectionReason && (p.status === "REJECTED" || p.status === "SUSPENDED") && <Alert variant="warning" title={p.status === "REJECTED" ? "Rejection reason" : "Suspension reason"} message={p.rejectionReason} />}

      <PageCard>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Field label="Partner code" value={p.partnerCode} />
          <Field label="Trade name" value={p.tradeName} />
          <Field label="Email" value={p.email} />
          <Field label="Phone" value={p.phone} />
          <Field label="Country / city" value={[p.country, p.city].filter(Boolean).join(" / ")} />
          <Field label="Tax / reg. number" value={p.taxOrRegNumber} />
          <Field label="Website" value={p.website} />
          <Field label="Address" value={p.address} />
          <Field label="KYC verified" value={p.kycVerifiedAt ? formatDate(p.kycVerifiedAt) : null} />
        </dl>
      </PageCard>

      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">KYC documents</h2>
        {p.kycDocuments.length === 0 ? <p className="text-sm text-gray-500">No documents uploaded.</p> : (
          <ul className="divide-y divide-gray-100">
            {p.kycDocuments.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{docTypeLabel(d.docType)} <span className="font-normal text-gray-500">· {d.fileName}</span></p>
                  <p className="text-xs text-gray-500">Uploaded {formatDate(d.createdAt)}{d.verifiedAt ? ` · verified ${formatDate(d.verifiedAt)}` : ""}{d.notes ? ` · note: ${d.notes}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={d.isVerified ? "Verified" : d.notes ? "Rejected" : "Pending"} variant={d.isVerified ? "green" : d.notes ? "red" : "yellow"} size="sm" />
                  <Button variant="outline" size="sm" onClick={() => openKycFile(`/admin/b2b/partners/${p.id}/kyc-documents/${d.id}/file`).catch(fail)}>View</Button>
                  {canUpdate && !d.isVerified && <Button size="sm" isLoading={review.isPending} onClick={() => { setMsg(null); review.mutate({ documentId: d.id, action: "VERIFY" }, { onError: fail }); }}>Verify</Button>}
                  {canUpdate && (d.isVerified || !d.notes) && <Button variant="danger" size="sm" onClick={() => setDialog({ kind: "reject-doc", doc: d })}>Reject</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageCard>

      {canUpdate && (
        <PageCard>
          <h2 className="mb-3 font-semibold text-gray-900">Tier, credit &amp; decision</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Tier" value={tierId} options={(tiers?.data ?? []).filter((t) => t.isActive || t.id === p.tier.id).map((t) => ({ value: t.id, label: `${t.name} (${t.defaultCommissionPct}% ${t.defaultRateType.toLowerCase()})` }))} onChange={(e) => setTierEdit(e.target.value)} />
            <Input label="Credit limit" type="number" min={0} step="0.01" value={creditLimit} onChange={(e) => setCreditEdit(e.target.value)} hint={`In use: ${formatMoney(p.wallet.creditUsed, p.currency)}`} />
            <Input label="Currency" maxLength={3} value={currency} onChange={(e) => setCurrencyEdit(e.target.value.toUpperCase())} hint="Locked once wallet/credit is non-zero" />
          </div>
          {needsDocToApprove && canApprove && <p className="mt-3 text-xs text-amber-700">Verify at least one KYC document before approving.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {canApprove && <Button onClick={approve} isLoading={decide.isPending} disabled={needsDocToApprove}>{p.status === "SUSPENDED" ? "Reactivate" : "Approve & Activate"}</Button>}
            {p.status === "PENDING_KYC" && <Button variant="danger" onClick={() => setDialog({ kind: "reject" })}>Reject</Button>}
            {p.status === "ACTIVE" && <Button variant="danger" onClick={() => setDialog({ kind: "suspend" })}>Suspend</Button>}
            <Button variant="outline" onClick={saveTerms} isLoading={decide.isPending}>Save terms only</Button>
          </div>
        </PageCard>
      )}

      {(p.status === "ACTIVE" || p.status === "SUSPENDED") && <PartnerFinancePanel partnerId={p.id} />}

      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">Agency users ({p.users.length})</h2>
        <ul className="divide-y divide-gray-100 text-sm">
          {p.users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span><span className="font-medium text-gray-900">{[u.firstName, u.lastName].filter(Boolean).join(" ")}</span> <span className="text-gray-500">{u.email}</span></span>
              <span className="flex items-center gap-2"><RoleBadge role={u.b2bRole} /><Badge label={u.isActive ? "Active" : "Disabled"} variant={u.isActive ? "green" : "gray"} size="sm" /></span>
            </li>
          ))}
        </ul>
      </PageCard>

      <Modal
        isOpen={!!dialog}
        onClose={closeDialog}
        title={dialogTitle}
        size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={closeDialog}>Cancel</Button><Button variant="danger" isLoading={decide.isPending || review.isPending} disabled={reasonRequired && reason.trim().length < 3} onClick={confirmDialog}>Confirm</Button></div>}
      >
        <Textarea label={reasonRequired ? "Reason (shown to the partner)" : "Reason (optional, shown to the partner)"} value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
      </Modal>
    </div>
  );
}
