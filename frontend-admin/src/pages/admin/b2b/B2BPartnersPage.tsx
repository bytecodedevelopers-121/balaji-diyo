import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { PartnerStatusBadge } from "@/components/b2b/b2b-ui";
import { useAdminPartners, useAdminTiers } from "@/hooks/queries/useB2B";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { AdminPartnerRow, B2BPartnerStatus } from "@/types/b2b";

const STATUS_OPTIONS: { value: B2BPartnerStatus; label: string }[] = [
  { value: "PENDING_KYC", label: "Pending KYC" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REJECTED", label: "Rejected" },
];

/** Partner queue — defaults to the KYC review backlog. */
export default function B2BPartnersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<B2BPartnerStatus | "">("PENDING_KYC");
  const [tierId, setTierId] = useState("");

  useEffect(() => { document.title = `B2B Partners | ${COMPANY_INFO.name} Admin`; }, []);

  const { data, isLoading, isError, error, isFetching, refetch } = useAdminPartners({
    page, perPage: 15, q: q || undefined, status: status || undefined, tierId: tierId || undefined,
  });
  const { data: tiers } = useAdminTiers();
  const items = data?.data.items ?? [];
  const meta = data?.data.meta;

  const columns: DataTableColumn<AdminPartnerRow>[] = [
    { key: "partner", header: "Agency", render: (p) => (
      <div><p className="font-medium text-gray-900">{p.legalName}</p><p className="text-xs text-gray-500">{p.partnerCode} · {p.email}</p></div>
    ) },
    { key: "country", header: "Country", render: (p) => p.country },
    { key: "tier", header: "Tier", render: (p) => <Badge label={p.tier.name} variant="indigo" /> },
    { key: "status", header: "Status", render: (p) => <PartnerStatusBadge status={p.status} /> },
    { key: "kyc", header: "KYC docs", render: (p) => <span className="text-gray-700">{p.kyc.verified}/{p.kyc.total} verified</span> },
    { key: "users", header: "Users", render: (p) => p._count.users },
    { key: "created", header: "Applied", render: (p) => <span className="text-gray-600">{formatDate(p.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeader title="B2B Partners" action={<RefreshButton isFetching={isFetching} onRefresh={refetch} />} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_200px]">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, code, email, tax no…" />
        <Select aria-label="Status" value={status} placeholder="All statuses" options={STATUS_OPTIONS} onChange={(e) => { setStatus(e.target.value as B2BPartnerStatus | ""); setPage(1); }} />
        <Select aria-label="Tier" value={tierId} placeholder="All tiers" options={(tiers?.data ?? []).map((t) => ({ value: t.id, label: t.name }))} onChange={(e) => { setTierId(e.target.value); setPage(1); }} />
      </div>
      {isError && <div className="mb-4"><Alert variant="error" message={getErrorMessage(error)} /></div>}
      <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage="No partners match these filters" onRowClick={(p) => navigate(PATHS.B2B_PARTNER_DETAIL(p.id))} />
      {meta && meta.totalPages > 0 && (
        <Pagination page={meta.currentPage} totalPages={meta.totalPages} total={meta.total} limit={meta.perPage} onPageChange={setPage} isLoading={isLoading} />
      )}
    </div>
  );
}
