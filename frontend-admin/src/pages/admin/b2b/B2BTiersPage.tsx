import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { useAdminTiers, useCreateTier, useUpdateTier } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { getDetailedErrorMessage } from "@/lib/apiError";
import type { B2BRateType, B2BTier } from "@/types/b2b";

interface Draft {
  id?: string;
  name: string;
  code: string;
  priorityOrder: string;
  defaultRateType: B2BRateType;
  defaultCommissionPct: string;
  defaultCreditLimit: string;
  creditTermDays: string;
  holdDurationMinutes: string;
  slaResponseHours: string;
  isActive: boolean;
}

const EMPTY: Draft = { name: "", code: "", priorityOrder: "0", defaultRateType: "COMMISSIONABLE", defaultCommissionPct: "10", defaultCreditLimit: "0", creditTermDays: "0", holdDurationMinutes: "30", slaResponseHours: "4", isActive: true };

const toDraft = (t: B2BTier): Draft => ({
  id: t.id, name: t.name, code: t.code, priorityOrder: String(t.priorityOrder), defaultRateType: t.defaultRateType,
  defaultCommissionPct: String(Number(t.defaultCommissionPct)), defaultCreditLimit: String(Number(t.defaultCreditLimit)),
  creditTermDays: String(t.creditTermDays), holdDurationMinutes: String(t.holdDurationMinutes), slaResponseHours: String(t.slaResponseHours), isActive: t.isActive,
});

export default function B2BTiersPage() {
  const canCreate = usePermission("create:b2b_tier");
  const canUpdate = usePermission("update:b2b_tier");
  const { data, isLoading } = useAdminTiers();
  const create = useCreateTier();
  const update = useUpdateTier();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () => {
    if (!draft) return;
    setError(null);
    const body = {
      name: draft.name.trim(),
      priorityOrder: Number(draft.priorityOrder),
      defaultRateType: draft.defaultRateType,
      defaultCommissionPct: draft.defaultCommissionPct,
      defaultCreditLimit: draft.defaultCreditLimit,
      creditTermDays: Number(draft.creditTermDays),
      holdDurationMinutes: Number(draft.holdDurationMinutes),
      slaResponseHours: Number(draft.slaResponseHours),
      isActive: draft.isActive,
    };
    const opts = { onSuccess: () => setDraft(null), onError: (e: unknown) => setError(getDetailedErrorMessage(e)) };
    if (draft.id) update.mutate({ id: draft.id, ...body }, opts);
    else create.mutate({ ...body, code: draft.code.trim() }, opts);
  };

  const columns: DataTableColumn<B2BTier>[] = [
    { key: "name", header: "Tier", render: (t) => <div><p className="font-medium text-gray-900">{t.name}</p><p className="font-mono text-xs text-gray-500">{t.code}</p></div> },
    { key: "rate", header: "Default rate", render: (t) => `${t.defaultRateType === "NET" ? "Net" : "Commissionable"} · ${Number(t.defaultCommissionPct)}%` },
    { key: "credit", header: "Credit", render: (t) => `${Number(t.defaultCreditLimit).toLocaleString()} / ${t.creditTermDays}d` },
    { key: "hold", header: "Hold / SLA", render: (t) => `${t.holdDurationMinutes} min / ${t.slaResponseHours} h` },
    { key: "partners", header: "Partners", render: (t) => t._count?.partners ?? 0 },
    { key: "status", header: "Status", render: (t) => <Badge label={t.isActive ? "Active" : "Inactive"} variant={t.isActive ? "green" : "gray"} /> },
    ...(canUpdate ? [{ key: "edit", header: "", render: (t: B2BTier) => <Button variant="outline" size="sm" onClick={() => { setError(null); setDraft(toDraft(t)); }}>Edit</Button> }] : []),
  ];

  return (
    <div>
      <PageHeader title="Partner Tiers" action={canCreate ? <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setError(null); setDraft(EMPTY); }}>New tier</Button> : undefined} />
      <p className="mb-4 text-sm text-gray-500">The lowest priority-order active tier is assigned to new partner registrations. Defaults apply when a partner is approved.</p>
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} emptyMessage="No tiers yet — run the tier seed script" />

      <Modal
        isOpen={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit tier" : "New tier"}
        size="lg"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={save} isLoading={create.isPending || update.isPending}>Save</Button></div>}
      >
        {draft && (
          <div className="space-y-3">
            {error && <Alert variant="error" message={error} />}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Name" value={draft.name} onChange={(e) => set("name", e.target.value)} required />
              <Input label="Code" value={draft.code} disabled={!!draft.id} hint={draft.id ? "Code can't be changed" : "A-Z, 0-9, _"} onChange={(e) => set("code", e.target.value.toUpperCase())} required />
              <Input label="Priority order" type="number" min={0} value={draft.priorityOrder} onChange={(e) => set("priorityOrder", e.target.value)} hint="Lower = entry level" />
              <Select label="Default rate type" value={draft.defaultRateType} options={[{ value: "COMMISSIONABLE", label: "Commissionable" }, { value: "NET", label: "Net" }]} onChange={(e) => set("defaultRateType", e.target.value as B2BRateType)} />
              <Input label="Commission %" type="number" min={0} max={100} step="0.01" value={draft.defaultCommissionPct} onChange={(e) => set("defaultCommissionPct", e.target.value)} />
              <Input label="Default credit limit" type="number" min={0} step="0.01" value={draft.defaultCreditLimit} onChange={(e) => set("defaultCreditLimit", e.target.value)} />
              <Input label="Credit term (days)" type="number" min={0} value={draft.creditTermDays} onChange={(e) => set("creditTermDays", e.target.value)} />
              <Input label="Seat hold (minutes)" type="number" min={1} value={draft.holdDurationMinutes} onChange={(e) => set("holdDurationMinutes", e.target.value)} />
              <Input label="SLA response (hours)" type="number" min={1} value={draft.slaResponseHours} onChange={(e) => set("slaResponseHours", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700"><Checkbox checked={draft.isActive} onChange={() => set("isActive", !draft.isActive)} /> Active</label>
          </div>
        )}
      </Modal>
    </div>
  );
}
