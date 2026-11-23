import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { PackageSelect, PartnerSelect } from "@/components/b2b/pickers";
import { useContracts, useSaveContract } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { AdminContract, B2BRateType, ContractInput } from "@/types/b2b";

interface Draft {
  id?: string;
  partnerId: string;
  packageId: string;
  rateType: B2BRateType;
  netUnitPrice: string;
  commissionPct: string;
  validFrom: string;
  validTo: string;
  blackoutDates: { start: string; end: string }[];
  minPax: string;
  maxPax: string;
  cutoffHours: string;
  isActive: boolean;
}

const EMPTY: Draft = { partnerId: "", packageId: "", rateType: "NET", netUnitPrice: "", commissionPct: "", validFrom: "", validTo: "", blackoutDates: [], minPax: "", maxPax: "", cutoffHours: "48", isActive: true };
const day = (iso: string) => iso.slice(0, 10);

const toDraft = (c: AdminContract): Draft => ({
  id: c.id, partnerId: c.partnerId, packageId: c.packageId, rateType: c.rateType,
  netUnitPrice: c.netUnitPrice ?? "", commissionPct: c.commissionPct ?? "", validFrom: day(c.validFrom), validTo: day(c.validTo),
  blackoutDates: c.blackoutDates ?? [], minPax: c.minPax?.toString() ?? "", maxPax: c.maxPax?.toString() ?? "",
  cutoffHours: String(c.cutoffHours), isActive: c.isActive,
});

const toInput = (d: Draft): ContractInput => ({
  ...(d.id ? {} : { partnerId: d.partnerId, packageId: d.packageId }),
  rateType: d.rateType,
  netUnitPrice: d.rateType === "NET" ? Number(d.netUnitPrice) : null,
  commissionPct: d.rateType === "COMMISSIONABLE" && d.commissionPct !== "" ? Number(d.commissionPct) : null,
  validFrom: d.validFrom,
  validTo: d.validTo,
  blackoutDates: d.blackoutDates.filter((b) => b.start && b.end),
  minPax: d.minPax === "" ? null : Number(d.minPax),
  maxPax: d.maxPax === "" ? null : Number(d.maxPax),
  cutoffHours: Number(d.cutoffHours),
  isActive: d.isActive,
});

export default function B2BContractsPage() {
  const canCreate = usePermission("create:b2b_contract");
  const canUpdate = usePermission("update:b2b_contract");
  const [page, setPage] = useState(1);
  const [partnerId, setPartnerId] = useState("");
  const [packageId, setPackageId] = useState("");
  const { data, isLoading } = useContracts({ page, perPage: 15, partnerId: partnerId || undefined, packageId: packageId || undefined });
  const save = useSaveContract();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meta = data?.data.meta;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const submit = () => {
    if (!draft) return;
    setError(null);
    if (!draft.id && (!draft.partnerId || !draft.packageId)) return setError("Choose a partner and a package.");
    save.mutate({ id: draft.id, data: toInput(draft) }, { onSuccess: () => setDraft(null), onError: (e) => setError(getDetailedErrorMessage(e)) });
  };

  const toggleActive = (c: AdminContract) => {
    setError(null);
    save.mutate({ id: c.id, data: { ...toInput(toDraft(c)), isActive: !c.isActive } }, { onError: (e) => setError(getDetailedErrorMessage(e)) });
  };

  const columns: DataTableColumn<AdminContract>[] = [
    { key: "partner", header: "Partner", render: (c) => <div><p className="font-medium text-gray-900">{c.partner.legalName}</p><p className="text-xs text-gray-500">{c.partner.partnerCode}</p></div> },
    { key: "pkg", header: "Package", render: (c) => c.package.title },
    { key: "rate", header: "Rate", render: (c) => c.rateType === "NET" ? `Net ${Number(c.netUnitPrice)}` : `Commission ${c.commissionPct ? `${Number(c.commissionPct)}%` : "(tier default)"}` },
    { key: "valid", header: "Valid", render: (c) => <span className="whitespace-nowrap text-gray-600">{formatDate(c.validFrom)} – {formatDate(c.validTo)}</span> },
    { key: "pax", header: "Pax / cut-off", render: (c) => `${c.minPax ?? 1}–${c.maxPax ?? "∞"} · ${c.cutoffHours}h${c.blackoutDates?.length ? ` · ${c.blackoutDates.length} blackout` : ""}` },
    { key: "status", header: "Status", render: (c) => <Badge label={c.isActive ? "Active" : "Inactive"} variant={c.isActive ? "green" : "gray"} /> },
    ...(canUpdate ? [{ key: "act", header: "", render: (c: AdminContract) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => { setError(null); setDraft(toDraft(c)); }}>Edit</Button>
        <Button variant="ghost" size="sm" onClick={() => toggleActive(c)} disabled={save.isPending}>{c.isActive ? "Deactivate" : "Activate"}</Button>
      </div>
    ) }] : []),
  ];

  return (
    <div>
      <PageHeader title="Partner Contracts" action={canCreate ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setError(null); setDraft(EMPTY); }}>New contract</Button> : undefined} />
      <p className="mb-4 text-sm text-gray-500">A contract overrides tier pricing for one partner on one package between its valid dates (UTC calendar days). Quotes always use the current contract; holds don't store a price.</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <PartnerSelect aria-label="Filter by partner" placeholder="All partners" value={partnerId} onChange={(e) => { setPartnerId(e.target.value); setPage(1); }} />
        <PackageSelect aria-label="Filter by package" placeholder="All packages" value={packageId} onChange={(e) => { setPackageId(e.target.value); setPage(1); }} />
      </div>
      {error && !draft && <div className="mb-4"><Alert variant="error" message={error} onClose={() => setError(null)} /></div>}
      <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage="No contracts yet" />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}

      <Modal
        isOpen={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit contract" : "New contract"}
        size="xl"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={submit} isLoading={save.isPending}>Save</Button></div>}
      >
        {draft && (
          <div className="space-y-3">
            {error && <Alert variant="error" message={error} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <PartnerSelect label="Partner" value={draft.partnerId} disabled={!!draft.id} onChange={(e) => set("partnerId", e.target.value)} />
              <PackageSelect label="Package" value={draft.packageId} disabled={!!draft.id} onChange={(e) => set("packageId", e.target.value)} />
              <Select label="Rate type" value={draft.rateType} options={[{ value: "NET", label: "Net rate" }, { value: "COMMISSIONABLE", label: "Commissionable" }]} onChange={(e) => set("rateType", e.target.value as B2BRateType)} />
              {draft.rateType === "NET" ? (
                <Input label="Net price per person" type="number" min={0} step="0.01" value={draft.netUnitPrice} onChange={(e) => set("netUnitPrice", e.target.value)} required />
              ) : (
                <Input label="Commission %" type="number" min={0} max={100} step="0.01" value={draft.commissionPct} onChange={(e) => set("commissionPct", e.target.value)} hint="Blank = tier default" />
              )}
              <Input label="Valid from" type="date" value={draft.validFrom} onChange={(e) => set("validFrom", e.target.value)} required />
              <Input label="Valid to" type="date" value={draft.validTo} onChange={(e) => set("validTo", e.target.value)} required />
              <Input label="Min travellers" type="number" min={1} value={draft.minPax} onChange={(e) => set("minPax", e.target.value)} />
              <Input label="Max travellers" type="number" min={1} value={draft.maxPax} onChange={(e) => set("maxPax", e.target.value)} />
              <Input label="Booking cut-off (hours before departure)" type="number" min={0} value={draft.cutoffHours} onChange={(e) => set("cutoffHours", e.target.value)} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Blackout dates</span>
                <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => set("blackoutDates", [...draft.blackoutDates, { start: "", end: "" }])}>Add range</Button>
              </div>
              {draft.blackoutDates.length === 0 && <p className="text-xs text-gray-500">None — every date in the validity window is bookable.</p>}
              {draft.blackoutDates.map((b, i) => (
                <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <Input aria-label="Blackout start" type="date" value={b.start} onChange={(e) => set("blackoutDates", draft.blackoutDates.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
                  <Input aria-label="Blackout end" type="date" value={b.end} onChange={(e) => set("blackoutDates", draft.blackoutDates.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
                  <Button type="button" variant="ghost" size="sm" aria-label="Remove range" onClick={() => set("blackoutDates", draft.blackoutDates.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700"><Checkbox checked={draft.isActive} onChange={() => set("isActive", !draft.isActive)} /> Active</label>
          </div>
        )}
      </Modal>
    </div>
  );
}
