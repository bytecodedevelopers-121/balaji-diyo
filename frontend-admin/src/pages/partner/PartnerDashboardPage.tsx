import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { KycFilePicker } from "@/components/b2b/KycFilePicker";
import { newKycRow, validateKycRows, type KycRow } from "@/components/b2b/kyc-files";
import { PartnerStatusBadge, RoleBadge } from "@/components/b2b/b2b-ui";
import { docTypeLabel, formatMoney } from "@/components/b2b/b2b-helpers";
import { useMyPartner, useUploadKyc } from "@/hooks/queries/useB2B";
import { openKycFile } from "@/services/b2b.service";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { MyPartner } from "@/types/b2b";

function StatusBanner({ partner }: { partner: MyPartner }) {
  switch (partner.status) {
    case "PENDING_KYC":
      return <Alert variant="info" title="Application under review" message="Our team is reviewing your KYC documents. You'll get full access once your agency is approved. You can add more documents below." />;
    case "REJECTED":
      return <Alert variant="error" title="Application rejected" message={`${partner.rejectionReason ?? "No reason was given."} Upload corrected documents below to resubmit for review.`} />;
    case "SUSPENDED":
      return <Alert variant="warning" title="Account suspended" message={`${partner.rejectionReason ?? "Your agency account is suspended."} Please contact us to restore access.`} />;
    default:
      return <Alert variant="success" title="Account active" message={`Welcome, ${partner.tradeName ?? partner.legalName}. Your ${partner.tier.name} tier is active.`} />;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function PartnerDashboardPage() {
  const { data, isLoading, isError, error } = useMyPartner();
  const upload = useUploadKyc();
  const [rows, setRows] = useState<KycRow[]>([newKycRow()]);
  const [formError, setFormError] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (isError || !data) return <Alert variant="error" message={getErrorMessage(error)} />;

  const partner = data.data;
  const isAdmin = partner.myRole === "AGENCY_ADMIN";
  const canSubmitKyc = isAdmin && (partner.status === "PENDING_KYC" || partner.status === "REJECTED");
  const w = partner.wallet;

  const submit = () => {
    const problem = validateKycRows(rows, { requireOne: true });
    if (problem) return setFormError(problem);
    setFormError(null);
    upload.mutate(
      rows.map((r) => ({ docType: r.docType, file: r.file as File })),
      { onSuccess: () => setRows([newKycRow()]), onError: (e) => setFormError(getErrorMessage(e)) },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title={partner.tradeName ?? partner.legalName} action={<PartnerStatusBadge status={partner.status} />} />
      <StatusBanner partner={partner} />

      <PageCard>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="font-mono text-gray-900">{partner.partnerCode}</span>
          <Badge label={`${partner.tier.name} tier`} variant="indigo" />
          <span>Your role:</span><RoleBadge role={partner.myRole} />
        </div>
        {partner.status === "ACTIVE" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Wallet balance" value={formatMoney(w.walletBalance, w.currency)} />
            <Stat label="Credit available" value={formatMoney(w.creditAvailable, w.currency)} />
            <Stat label="Credit used / limit" value={`${formatMoney(w.creditUsed, w.currency)} / ${formatMoney(w.creditLimit, w.currency)}`} />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Wallet and credit details appear here once your agency is active.</p>
        )}
      </PageCard>

      <PageCard>
        <h2 className="mb-3 font-semibold text-gray-900">KYC documents</h2>
        {partner.kycDocuments.length === 0 ? (
          <p className="text-sm text-gray-500">No documents submitted yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {partner.kycDocuments.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{docTypeLabel(d.docType)}</span>
                  <span className="text-gray-500">{d.fileName}</span>
                  <span className="text-xs text-gray-400">{formatDate(d.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {d.isVerified ? <Badge label="Verified" variant="green" size="sm" /> : d.notes ? <Badge label="Needs attention" variant="red" size="sm" /> : <Badge label="Pending" variant="yellow" size="sm" />}
                  {isAdmin && <Button variant="ghost" size="sm" onClick={() => openKycFile(`/b2b/kyc-documents/${d.id}/file`)}>View</Button>}
                </div>
                {d.notes && !d.isVerified && <p className="w-full text-xs text-red-600">Reviewer note: {d.notes}</p>}
              </li>
            ))}
          </ul>
        )}

        {canSubmitKyc && (
          <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900">{partner.status === "REJECTED" ? "Resubmit documents" : "Add documents"}</h3>
            {formError && <Alert variant="error" message={formError} onClose={() => setFormError(null)} />}
            <KycFilePicker rows={rows} onChange={setRows} disabled={upload.isPending} />
            <Button leftIcon={<Upload className="h-4 w-4" />} onClick={submit} isLoading={upload.isPending}>
              {partner.status === "REJECTED" ? "Resubmit for review" : "Upload documents"}
            </Button>
          </div>
        )}
        {!isAdmin && <p className="mt-3 text-xs text-gray-500">Only an agency admin can view or submit KYC documents.</p>}
      </PageCard>
    </div>
  );
}
