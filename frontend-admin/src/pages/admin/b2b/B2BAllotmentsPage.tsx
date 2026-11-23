import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
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
import { useAllotments, useDeparturesForPackage, useSetCapacity, useUpsertAllotment } from "@/hooks/queries/useB2B";
import { usePermission } from "@/hooks/usePermission";
import { getDetailedErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { AdminAllotment } from "@/types/b2b";
import type { Departure } from "@/types/departure";

interface AllotDraft { partnerId: string; packageId: string; departureId: string; allocatedSeats: string; releaseBeforeHours: string; isActive: boolean }
interface CapDraft { departure: Departure; totalSeats: string; cutoffHours: string }

function AllotmentsSection() {
  const canEdit = usePermission("update:b2b_allotment");
  const [page, setPage] = useState(1);
  const [packageId, setPackageId] = useState("");
  const { data, isLoading } = useAllotments({ page, perPage: 15, packageId: packageId || undefined });
  const upsert = useUpsertAllotment();
  const [draft, setDraft] = useState<AllotDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: deps } = useDeparturesForPackage(draft?.packageId ?? "");
  const meta = data?.data.meta;
  const set = <K extends keyof AllotDraft>(k: K, v: AllotDraft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const submit = () => {
    if (!draft) return;
    setError(null);
    if (!draft.partnerId || !draft.departureId) return setError("Choose a partner, package and departure.");
    upsert.mutate(
      { partnerId: draft.partnerId, departureId: draft.departureId, allocatedSeats: Number(draft.allocatedSeats), releaseBeforeHours: Number(draft.releaseBeforeHours), isActive: draft.isActive },
      { onSuccess: () => setDraft(null), onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  };

  const edit = (a: AdminAllotment) => {
    setError(null);
    setDraft({ partnerId: a.partnerId, packageId: a.departure.package.id, departureId: a.departureId, allocatedSeats: String(a.allocatedSeats), releaseBeforeHours: String(a.releaseBeforeHours), isActive: a.isActive });
  };

  const columns: DataTableColumn<AdminAllotment>[] = [
    { key: "partner", header: "Partner", render: (a) => <div><p className="font-medium text-gray-900">{a.partner.legalName}</p><p className="text-xs text-gray-500">{a.partner.partnerCode}</p></div> },
    { key: "dep", header: "Departure", render: (a) => <div><p className="text-gray-900">{a.departure.package.title}</p><p className="text-xs text-gray-500">{formatDate(a.departure.departureDate)}</p></div> },
    { key: "seats", header: "Allocated / booked / held", render: (a) => `${a.allocatedSeats} / ${a.bookedSeats} / ${a.heldSeats}` },
    { key: "rel", header: "Released", render: (a) => `${a.releaseBeforeHours}h before` },
    { key: "status", header: "Status", render: (a) => <Badge label={a.isActive ? "Active" : "Inactive"} variant={a.isActive ? "green" : "gray"} /> },
    ...(canEdit ? [{ key: "act", header: "", render: (a: AdminAllotment) => <Button variant="outline" size="sm" onClick={() => edit(a)}>Edit</Button> }] : []),
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-logo-navy-dark">Partner allotments</h2>
        {canEdit && <Button onClick={() => { setError(null); setDraft({ partnerId: "", packageId: "", departureId: "", allocatedSeats: "1", releaseBeforeHours: "72", isActive: true }); }}>New allotment</Button>}
      </div>
      <p className="text-sm text-gray-500">A dedicated block reserves seats for one partner until its release window opens; unused seats then return to the shared pool.</p>
      <div className="max-w-sm"><PackageSelect aria-label="Filter by package" placeholder="All packages" value={packageId} onChange={(e) => { setPackageId(e.target.value); setPage(1); }} /></div>
      <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage="No allotments yet" />
      {meta && meta.totalPages > 1 && <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} />}

      <Modal isOpen={!!draft} onClose={() => setDraft(null)} title="Partner allotment"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={submit} isLoading={upsert.isPending}>Save</Button></div>}>
        {draft && (
          <div className="space-y-3">
            {error && <Alert variant="error" message={error} />}
            <PartnerSelect label="Partner" value={draft.partnerId} onChange={(e) => set("partnerId", e.target.value)} />
            <PackageSelect label="Package" value={draft.packageId} onChange={(e) => { set("packageId", e.target.value); set("departureId", ""); }} />
            <Select label="Departure" value={draft.departureId} placeholder={draft.packageId ? "Select departure" : "Choose a package first"} disabled={!draft.packageId}
              options={(deps?.data.items ?? []).map((d) => ({ value: d.id, label: `${formatDate(d.departureDate)} · capacity ${d.totalSeats ?? "untracked"}` }))} onChange={(e) => set("departureId", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Allocated seats" type="number" min={0} value={draft.allocatedSeats} onChange={(e) => set("allocatedSeats", e.target.value)} />
              <Input label="Release (hours before departure)" type="number" min={0} value={draft.releaseBeforeHours} onChange={(e) => set("releaseBeforeHours", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700"><Checkbox checked={draft.isActive} onChange={() => set("isActive", !draft.isActive)} /> Active</label>
          </div>
        )}
      </Modal>
    </section>
  );
}

function CapacitySection() {
  const canEdit = usePermission("update:travel");
  const [packageId, setPackageId] = useState("");
  const { data, isLoading } = useDeparturesForPackage(packageId);
  const setCapacity = useSetCapacity();
  const [draft, setDraft] = useState<CapDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!draft) return;
    setError(null);
    setCapacity.mutate(
      { departureId: draft.departure.id, totalSeats: draft.totalSeats === "" ? null : Number(draft.totalSeats), cutoffHours: Number(draft.cutoffHours) },
      { onSuccess: () => setDraft(null), onError: (e) => setError(getDetailedErrorMessage(e)) },
    );
  };

  const columns: DataTableColumn<Departure>[] = [
    { key: "date", header: "Departure", render: (d) => <span className="font-medium text-gray-900">{formatDate(d.departureDate)}</span> },
    { key: "status", header: "Status", render: (d) => d.departureStatus },
    { key: "total", header: "Capacity", render: (d) => (d.totalSeats ?? null) === null ? <span className="text-gray-400">Not tracked</span> : d.totalSeats },
    { key: "used", header: "Booked / held", render: (d) => `${d.bookedSeats ?? 0} / ${d.heldSeats ?? 0}` },
    { key: "cut", header: "Cut-off", render: (d) => `${d.cutoffHours ?? 24}h` },
    ...(canEdit ? [{ key: "act", header: "", render: (d: Departure) => <Button variant="outline" size="sm" onClick={() => { setError(null); setDraft({ departure: d, totalSeats: d.totalSeats?.toString() ?? "", cutoffHours: String(d.cutoffHours ?? 24) }); }}>Set capacity</Button> }] : []),
  ];

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-logo-navy-dark">Departure capacity</h2>
      <p className="text-sm text-gray-500">Leave capacity blank to keep a departure uncapped (no seat limit enforced). Capacity can't drop below seats already booked, held or reserved by allotments.</p>
      <div className="max-w-sm"><PackageSelect aria-label="Package" value={packageId} onChange={(e) => setPackageId(e.target.value)} /></div>
      {packageId && <DataTable columns={columns} data={data?.data.items ?? []} isLoading={isLoading} emptyMessage="No departures for this package" />}

      <Modal isOpen={!!draft} onClose={() => setDraft(null)} title={draft ? `Capacity · ${formatDate(draft.departure.departureDate)}` : ""} size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={submit} isLoading={setCapacity.isPending}>Save</Button></div>}>
        {draft && (
          <div className="space-y-3">
            {error && <Alert variant="error" message={error} />}
            <Input label="Total seats" type="number" min={0} value={draft.totalSeats} onChange={(e) => setDraft({ ...draft, totalSeats: e.target.value })} hint="Blank = not tracked" />
            <Input label="Default cut-off (hours before departure)" type="number" min={0} value={draft.cutoffHours} onChange={(e) => setDraft({ ...draft, cutoffHours: e.target.value })} />
          </div>
        )}
      </Modal>
    </section>
  );
}

export default function B2BAllotmentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Allotments & Capacity" />
      <PageCard><AllotmentsSection /></PageCard>
      <PageCard><CapacitySection /></PageCard>
    </div>
  );
}
